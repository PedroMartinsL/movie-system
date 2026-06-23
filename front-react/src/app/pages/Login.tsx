import { useState } from 'react'
import { Film } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface LoginPageProps {
  onNavigateRegister: () => void
  onSuccess: () => void
}

export function LoginPage({ onNavigateRegister, onSuccess }: LoginPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--primary)' }}>
            <Film size={24} style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <h1 className="text-foreground text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            Movie System
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { window.location.href = 'http://localhost:8080/auth/google' }}
          className="w-full py-3 rounded-lg border border-border bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M43.611 20.083H42V20H24v8h11.303C33.973 32.443 29.418 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.807 0 5.365 1.056 7.31 2.784l5.657-5.657C33.592 7.602 29.034 6 24 6 13.507 6 5 14.507 5 25s8.507 19 19 19 19-8.507 19-19c0-1.274-.138-2.517-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 13 24 13c2.807 0 5.365 1.056 7.31 2.784l5.657-5.657C33.592 7.602 29.034 6 24 6 16.318 6 9.656 9.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 35c-5.397 0-9.944-3.53-11.289-8.382l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 43 34 43 25c0-1.274-.138-2.517-.389-3.917z" fill="#1976D2"/>
          </svg>
          Entrar com Google
        </button>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Não tem conta?{' '}
          <button onClick={onNavigateRegister} className="text-primary hover:underline">
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  )
}
