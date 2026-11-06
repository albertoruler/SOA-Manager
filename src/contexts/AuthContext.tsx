
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  display_name: string
  is_active: boolean
  platform_role: 'platform_admin' | 'user'
}

interface Organization {
  id: string
  name: string
}

interface OrganizationMembership {
  organization_id: string
  role: 'admin' | 'standard_user'
  joined_at: string
  organization: Organization
}

interface AuthContextType {
  session: Session | null
  loading: boolean
  profile: UserProfile | null
  memberships: OrganizationMembership[]
  availableOrganizations: Organization[]
  activeOrganization: Organization | null
  profileLoading: boolean
  profileError: string | null
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<string | null>
  selectOrganization: (organizationId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

function isValidPlatformRole(
  role: string
): role is UserProfile['platform_role'] {
  return role === 'platform_admin' || role === 'user'
}

function isValidMembershipRole(
  role: string
): role is OrganizationMembership['role'] {
  return role === 'admin' || role === 'standard_user'
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([])
  const [availableOrganizations, setAvailableOrganizations] =
    useState<Organization[]>([])
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null)

  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Recuperar y observar la sesión de Supabase.
  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession)
        setLoading(false)
      }
    })

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        if (mounted) {
          setSession(data.session)
        }
      } catch (error) {
        console.error('Error al recuperar la sesión:', error)

        if (mounted) {
          setSession(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Recuperar perfil, membresías y organizaciones disponibles.
  useEffect(() => {
    let mounted = true

    async function loadUserData() {
      if (!session) {
        setProfile(null)
        setMemberships([])
        setAvailableOrganizations([])
        setActiveOrganization(null)
        setProfileError(null)
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)
      setProfileError(null)
      setProfile(null)
      setMemberships([])
      setAvailableOrganizations([])
      setActiveOrganization(null)

      try {
        const { data: profileData, error: profileQueryError } =
          await supabase
            .from('users')
            .select('id, display_name, is_active, platform_role')
            .eq('id', session.user.id)
            .maybeSingle()

        if (profileQueryError) {
          throw profileQueryError
        }

        if (!profileData) {
          throw new Error(
            'No existe un perfil asociado a este usuario.'
          )
        }

        if (!profileData.is_active) {
          throw new Error(
            'El perfil de este usuario está desactivado.'
          )
        }

        if (!isValidPlatformRole(profileData.platform_role)) {
          throw new Error(
            'El rol global del usuario no es válido.'
          )
        }

        const { data: membershipData, error: membershipQueryError } =
          await supabase
            .from('organization_memberships')
            .select('organization_id, role, joined_at')
            .eq('user_id', session.user.id)
            .eq('is_active', true)

        if (membershipQueryError) {
          throw membershipQueryError
        }

        const { data: organizationData, error: organizationQueryError } =
          await supabase
            .from('organizations')
            .select('id, name')
            .eq('is_active', true)
            .order('name')

        if (organizationQueryError) {
          throw organizationQueryError
        }

        const organizations: Organization[] = organizationData ?? []

        const organizationMap = new Map(
          organizations.map((organization) => [
            organization.id,
            organization,
          ])
        )

        const userMemberships: OrganizationMembership[] = (
          membershipData ?? []
        ).flatMap((membership) => {
          const organization = organizationMap.get(
            membership.organization_id
          )

          if (!organization) {
            return []
          }

          if (!isValidMembershipRole(membership.role)) {
            throw new Error(
              'Se ha encontrado un rol de membresía no válido.'
            )
          }

          return [
            {
              organization_id: membership.organization_id,
              role: membership.role,
              joined_at: membership.joined_at,
              organization,
            },
          ]
        })

        if (!mounted) return

        setProfile({
          id: profileData.id,
          display_name: profileData.display_name,
          is_active: profileData.is_active,
          platform_role: profileData.platform_role,
        })

        setMemberships(userMemberships)
        setAvailableOrganizations(organizations)

        const initialOrganization =
          profileData.platform_role === 'platform_admin'
            ? organizations[0] ?? null
            : userMemberships[0]?.organization ?? null

        setActiveOrganization(initialOrganization)
      } catch (error) {
        if (!mounted) return

        const message =
          error instanceof Error
            ? error.message
            : 'No se han podido recuperar los datos del usuario.'

        setProfileError(message)
      } finally {
        if (mounted) {
          setProfileLoading(false)
        }
      }
    }

    void loadUserData()

    return () => {
      mounted = false
    }
  }, [session])

  // Seleccionar una organización disponible.
  function selectOrganization(organizationId: string): boolean {
    const organization = availableOrganizations.find(
      (item) => item.id === organizationId
    )

    if (!organization) {
      console.error(
        'La organización no está disponible para este usuario.'
      )
      return false
    }

    if (profile?.platform_role !== 'platform_admin') {
      const hasMembership = memberships.some(
        (membership) =>
          membership.organization_id === organizationId
      )

      if (!hasMembership) {
        console.error(
          'No tienes una membresía activa en esta organización.'
        )
        return false
      }
    }

    setActiveOrganization(organization)
    return true
  }

  // Iniciar sesión.
  async function signIn(
    email: string,
    password: string
  ): Promise<string | null> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return error?.message ?? null
    } catch (error) {
      console.error('Error inesperado al iniciar sesión:', error)

      return 'Ha ocurrido un error inesperado al iniciar sesión.'
    }
  }

  // Cerrar sesión.
  async function signOut(): Promise<string | null> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return error.message
      }

      return null
    } catch (error) {
      console.error('Error inesperado al cerrar sesión:', error)

      return 'Ha ocurrido un error inesperado al cerrar sesión.'
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        profile,
        memberships,
        availableOrganizations,
        activeOrganization,
        profileLoading,
        profileError,
        signIn,
        signOut,
        selectOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )
  }

  return context
}
