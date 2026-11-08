
import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setLoading(true)

    const signInError = await signIn(email.trim(), password)

    if (signInError) {
      setError('No se ha podido iniciar sesión. Comprueba tus credenciales.')
    }

    setLoading(false)
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <img
            className="login-brand-logo"
            src="/soa-manager-logo.svg"
            alt="SOA Manager - Security Management"
          />
        </div>

        <div className="login-heading">
          <h2>Bienvenido</h2>
          <p>Inicia sesión para acceder a tu espacio de trabajo.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Introduce tu contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-footer">
          SOA Manager · Prototipo académico
        </p>
      </section>
    </main>
  )
}
