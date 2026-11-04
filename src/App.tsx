
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
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
  const [activePage, setActivePage] = useState('Dashboard')
  const [connectionStatus, setConnectionStatus] = useState('Comprobando...')

  useEffect(() => {
    async function checkConnection() {
      const { error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)

      if (error) {
        setConnectionStatus(`Error: ${error.message}`)
        return
      }

      setConnectionStatus('Conexión correcta')
    }

    checkConnection()
  }, [])

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
          <span className="workspace-label">ESPACIO DE TRABAJO</span>
          <div className="workspace-name">
            <span className="workspace-dot" />
            Organización Demo
            <span className="chevron">⌄</span>
          </div>
        </div>

        <nav className="navigation">
          <span className="nav-label">MENÚ PRINCIPAL</span>

          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? 'active' : ''
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-avatar">AD</div>
          <div className="user-info">
            <strong>Administrador Demo</strong>
            <span>Administrador</span>
          </div>
          <span className="user-menu">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Espacio de trabajo <span>/</span> {activePage}
          </div>
          <div className="topbar-right">
            <span className="environment">ENTORNO DE DEMOSTRACIÓN</span>
            <div className="topbar-avatar">AD</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div>
              <span className="eyebrow">PANEL DE CONTROL</span>
              <h2>{activePage === 'Dashboard' ? 'Dashboard' : activePage}</h2>
              <p>
                Consulta y gestiona la seguridad de tu sistema de información.
              </p>
            </div>
            <button className="primary-button">
              + Nueva acción
            </button>
          </section>

          {activePage === 'Dashboard' ? (
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
                    <button className="text-button">Ver controles →</button>
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
                    <button className="text-button">Ver todas →</button>
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

          <div>
            Estado de conexión con Supabase: {connectionStatus}
          </div>

          <footer className="footer">
            SOA Manager · Prototipo académico · ISO/IEC 27001:2022
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
