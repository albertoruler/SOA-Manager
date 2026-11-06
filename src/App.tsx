
import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import './App.css'

const navigation = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Controles', icon: '◈' },
  { name: 'Declaración de aplicabilidad', icon: '▤' },
  { name: 'Acciones de mejora', icon: '↗' },
  { name: 'Documentación', icon: '▱' },
  { name: 'Asistente IA', icon: '✧' },
]

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

  async function handleSignOut() {
    setSignOutError(null)

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
        <div>
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
          <div className="brand-icon">S</div>

          <div>
            <h1>SOA Manager</h1>
            <span>SECURITY MANAGEMENT</span>
          </div>
        </div>

        <div className="workspace">
          <span className="workspace-label">
            ESPACIO DE TRABAJO
          </span>

          <div className="workspace-name">
            <span className="workspace-dot" />

            <select
              className="organization-selector"
              aria-label="Seleccionar organización"
              value={activeOrganization?.id ?? ''}
              onChange={(event) => {
                if (event.target.value) {
                  selectOrganization(event.target.value)
                }
              }}
              disabled={availableOrganizations.length === 0}
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

              {item.name}
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

          <button
            className="user-menu"
            type="button"
            onClick={() => void handleSignOut()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            ↪
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Espacio de trabajo <span>/</span> {activePage}
          </div>

          <div className="topbar-right">
            <span className="environment">
              {activeOrganization?.name ?? 'SIN ORGANIZACIÓN'}
            </span>

            <div className="topbar-avatar">
              {userInitials}
            </div>
          </div>
        </header>

        <div className="page-content">
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

          {!activeOrganization ? (
            <section className="panel placeholder-panel">
              <div className="empty-icon">◈</div>

              <h3>Sin organización asignada</h3>

              <p>
                Tu cuenta está autenticada, pero todavía no pertenece
                a ninguna organización. Contacta con un administrador
                para obtener acceso a un espacio de trabajo.
              </p>
            </section>
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
