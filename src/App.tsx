import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import SoaPage from './components/SoaPage'
import './App.css'

const navigation = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Controles', icon: '◈' },
  { name: 'Declaración de aplicabilidad', icon: '▤' },
  { name: 'Acciones de mejora', icon: '↗' },
  { name: 'Documentación', icon: '▱' },
  { name: 'Asistente IA', icon: '✧' },
]

const controlCategories = [
  'Organizativo',
  'Personas',
  'Físico',
  'Tecnológico',
] as const

type ControlCategory = typeof controlCategories[number]

interface Control {
  id: string
  code: string
  name: string
  description: string
  category: ControlCategory
  sort_order: number
}

function ControlsPage() {
  const [controls, setControls] = useState<Control[]>([])
  const [loadingControls, setLoadingControls] = useState(true)
  const [controlsError, setControlsError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadControls() {
      setLoadingControls(true)
      setControlsError(null)

      const { data, error } = await supabase
        .from('controls')
        .select('id, code, name, description, category, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (!isMounted) return

      if (error) {
        console.error('Error al cargar los controles:', error.message)
        setControlsError(
          'No se ha podido cargar el catálogo de controles. Inténtalo de nuevo.',
        )
        setControls([])
      } else {
        setControls((data ?? []) as Control[])
      }

      setLoadingControls(false)
    }

    void loadControls()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredControls = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return controls

    return controls.filter((control) =>
      [
        control.code,
        control.name,
        control.description,
        control.category,
      ].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    )
  }, [controls, searchTerm])

  return (
    <>
      <section className="panel controls-information">
        <div className="controls-information-icon">i</div>

        <div>
          <strong>Sobre el catálogo de controles</strong>

          <p>
            El catálogo se basa en la estructura del Anexo A de
            ISO/IEC 27001:2022. Las denominaciones y descripciones
            son elaboraciones explicativas propias y no reproducen
            el contenido normativo oficial.
          </p>

          <p>
            SOA Manager no sustituye la consulta de las publicaciones
            oficiales ni determina automáticamente el cumplimiento
            de los requisitos de la norma.
          </p>
        </div>
      </section>

      <section className="controls-toolbar">
        <div>
          <h3>Catálogo de controles</h3>
          <p>
            Consulta los controles del Anexo A de ISO/IEC 27001:2022.
          </p>
        </div>

        <div className="controls-count">
          {loadingControls ? '--' : controls.length}
          <span> controles activos</span>
        </div>
      </section>

      <div className="controls-search">
        <span aria-hidden="true">⌕</span>

        <input
          type="search"
          placeholder="Buscar por código, nombre o descripción..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Buscar controles"
        />
      </div>

      {loadingControls ? (
        <section className="panel controls-message">
          <div className="loading-spinner" />
          <p>Cargando catálogo de controles...</p>
        </section>
      ) : controlsError ? (
        <section className="panel controls-message">
          <div className="empty-icon">!</div>
          <h3>No se ha podido cargar el catálogo</h3>
          <p>{controlsError}</p>

          <button
            className="primary-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </section>
      ) : controls.length === 0 ? (
        <section className="panel controls-message">
          <h3>No hay controles disponibles</h3>
          <p>
            No se han encontrado controles activos en el catálogo.
          </p>
        </section>
      ) : filteredControls.length === 0 ? (
        <section className="panel controls-message">
          <h3>No se han encontrado resultados</h3>
          <p>
            Prueba con otro código, nombre o término de búsqueda.
          </p>
        </section>
      ) : (
        <div className="controls-categories">
          {controlCategories.map((category) => {
            const categoryControls = filteredControls.filter(
              (control) => control.category === category,
            )

            if (categoryControls.length === 0) return null

            return (
              <section
                className="panel controls-category"
                key={category}
              >
                <div className="controls-category-heading">
                  <div>
                    <h3>{category}</h3>
                    <p>{categoryControls.length} controles</p>
                  </div>
                </div>

                <div className="controls-list">
                  {categoryControls.map((control) => (
                    <article
                      className="control-item"
                      key={control.id}
                    >
                      <div className="control-code">
                        {control.code}
                      </div>

                      <div className="control-details">
                        <h4>{control.name}</h4>
                        <p>{control.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}

function App() {
  const {
    session,
    loading,
    signOut,
    profile,
    memberships,
    availableOrganizations,
    activeOrganization,
    profileLoading,
    profileError,
    selectOrganization,
  } = useAuth()

  const [activePage, setActivePage] = useState('Dashboard')
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  async function handleSignOut() {
    setSignOutError(null)
    setUserMenuOpen(false)

    const error = await signOut()

    if (error) {
      setSignOutError(
        'No se ha podido cerrar la sesión. Inténtalo de nuevo.',
      )
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        Comprobando sesión...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  if (profileLoading) {
    return (
      <div className="auth-loading">
        Cargando tu espacio de trabajo...
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="auth-loading">
        <div className="auth-error-content">
          <p>
            {profileError ?? 'No se ha podido cargar tu perfil.'}
          </p>

          {signOutError && (
            <p className="login-error" role="alert">
              {signOutError}
            </p>
          )}

          <button
            className="primary-button"
            type="button"
            onClick={() => void handleSignOut()}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  const nameParts = profile.display_name.trim().split(/\s+/)

  const userInitials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : profile.display_name.slice(0, 2).toUpperCase()

  const activeMembership = memberships.find(
    (membership) =>
      membership.organization_id === activeOrganization?.id,
  )

  const isPlatformAdmin =
    profile.platform_role === 'platform_admin'

  const canManageOrganization =
    isPlatformAdmin || activeMembership?.role === 'admin'

  const roleLabel = isPlatformAdmin
    ? 'Administrador global'
    : activeMembership?.role === 'admin'
      ? 'Administrador'
      : activeMembership?.role === 'standard_user'
        ? 'Usuario estándar'
        : 'Sin organización asignada'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div
            className="brand-icon"
            style={{ background: 'transparent' }}
          >
            <img
              src="/soa-manager-symbol.svg"
              alt="SOA Manager"
              style={{
                display: 'block',
                width: '56px',
                height: '56px',
                objectFit: 'contain',
              }}
            />
          </div>

          <div>
            <h1>SOA Manager</h1>
            <span>SECURITY MANAGEMENT</span>
          </div>
        </div>

        <nav className="navigation">
          <span className="nav-label">
            MENÚ PRINCIPAL
          </span>

          {navigation.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`nav-item ${
                activePage === item.name ? 'active' : ''
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span className="nav-item-label">
                {item.name}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-avatar">
            {userInitials}
          </div>

          <div className="user-info">
            <strong>{profile.display_name}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Espacio de trabajo <span>/</span> {activePage}
          </div>

          <div className="topbar-right">
            <label className="topbar-organization">
              <span className="sr-only">Organización activa</span>

              <select
                className="topbar-organization-select"
                aria-label="Seleccionar organización"
                value={activeOrganization?.id ?? ''}
                onChange={(event) => {
                  if (event.target.value) {
                    selectOrganization(event.target.value)
                  }
                }}
                disabled={availableOrganizations.length <= 1}
              >
                {availableOrganizations.length === 0 ? (
                  <option value="">
                    Sin organización disponible
                  </option>
                ) : (
                  availableOrganizations.map((organization) => (
                    <option
                      key={organization.id}
                      value={organization.id}
                    >
                      {organization.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <div className="user-dropdown">
              <button
                className={`topbar-user-button ${
                  userMenuOpen ? 'is-open' : ''
                }`}
                type="button"
                aria-label="Abrir menú de usuario"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <span className="topbar-avatar">
                  {userInitials}
                </span>

                <span className="topbar-user-text">
                  <strong>{profile.display_name}</strong>
                  <small>{roleLabel}</small>
                </span>

                <span className="user-dropdown-chevron">
                  {userMenuOpen ? '⌃' : '⌄'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu" role="menu">
                  <div className="user-dropdown-heading">
                    <strong>{profile.display_name}</strong>
                    <span>{roleLabel}</span>
                  </div>

                  <button
                    className="user-dropdown-item logout-item"
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSignOut()}
                  >
                    <span aria-hidden="true">↪</span>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          className="page-content"
          onClick={() => {
            if (userMenuOpen) setUserMenuOpen(false)
          }}
        >
          <section className="welcome-section">
            <div>
              <span className="eyebrow">
                PANEL DE CONTROL
              </span>

              <h2>
                {activePage === 'Dashboard'
                  ? 'Dashboard'
                  : activePage}
              </h2>

              <p>
                Consulta y gestiona la seguridad de tu sistema de información.
              </p>
            </div>

            {activeOrganization && canManageOrganization && (
              <button
                className="primary-button"
                type="button"
                onClick={() => setActivePage('Acciones de mejora')}
              >
                + Nueva acción
              </button>
            )}
          </section>

          {signOutError && (
            <p className="login-error" role="alert">
              {signOutError}
            </p>
          )}

          {activePage === 'Controles' ? (
            <ControlsPage />
          ) : !activeOrganization ? (
            <section className="panel placeholder-panel">
              <div className="empty-icon">◈</div>

              <h3>Sin organización asignada</h3>

              <p>
                Tu cuenta está autenticada, pero todavía no pertenece
                a ninguna organización. Contacta con un administrador
                para obtener acceso a un espacio de trabajo.
              </p>
            </section>
          ) : activePage === 'Declaración de aplicabilidad' ? (
            <SoaPage
              organizationId={activeOrganization.id}
              userId={profile.id}
              canManageOrganization={canManageOrganization}
            />
          ) : activePage === 'Dashboard' ? (
            <>
              <section className="metrics-grid">
                <article className="metric-card">
                  <div className="metric-header">
                    <span>Total de controles</span>
                    <span className="metric-icon purple">◈</span>
                  </div>

                  <strong className="metric-value">93</strong>

                  <span className="metric-caption">
                    Controles del Anexo A
                  </span>
                </article>

                <article className="metric-card">
                  <div className="metric-header">
                    <span>Aplicables</span>
                    <span className="metric-icon blue">✓</span>
                  </div>

                  <strong className="metric-value">--</strong>

                  <span className="metric-caption">
                    Pendiente de configuración
                  </span>
                </article>

                <article className="metric-card">
                  <div className="metric-header">
                    <span>Implantados</span>
                    <span className="metric-icon green">↗</span>
                  </div>

                  <strong className="metric-value">--</strong>

                  <span className="metric-caption">
                    Pendiente de configuración
                  </span>
                </article>

                <article className="metric-card">
                  <div className="metric-header">
                    <span>Acciones pendientes</span>
                    <span className="metric-icon orange">◷</span>
                  </div>

                  <strong className="metric-value">--</strong>

                  <span className="metric-caption">
                    Pendiente de configuración
                  </span>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Estado de los controles</h3>
                      <p>Resumen de implantación del Anexo A</p>
                    </div>

                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setActivePage('Controles')}
                    >
                      Ver controles →
                    </button>
                  </div>

                  <div className="empty-state">
                    <div className="empty-icon">◈</div>

                    <strong>Sin datos todavía</strong>

                    <p>
                      Cuando se registren los controles, aparecerá aquí
                      su estado de implantación.
                    </p>
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Acciones de mejora</h3>
                      <p>Seguimiento de tareas</p>
                    </div>

                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setActivePage('Acciones de mejora')}
                    >
                      Ver todas →
                    </button>
                  </div>

                  <div className="empty-state">
                    <div className="empty-icon">↗</div>

                    <strong>Sin acciones registradas</strong>

                    <p>
                      Las acciones de mejora aparecerán aquí cuando
                      se creen.
                    </p>
                  </div>
                </article>
              </section>

              <section className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Actividad reciente</h3>
                    <p>Últimos movimientos del espacio de trabajo</p>
                  </div>
                </div>

                <div className="activity-empty">
                  Todavía no hay actividad que mostrar.
                </div>
              </section>
            </>
          ) : (
            <section className="panel placeholder-panel">
              <div className="empty-icon">✧</div>

              <h3>{activePage}</h3>

              <p>
                Esta sección se desarrollará en las siguientes fases
                del proyecto.
              </p>
            </section>
          )}

          <footer className="footer">
            SOA Manager · Prototipo académico · ISO/IEC 27001:2022
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App