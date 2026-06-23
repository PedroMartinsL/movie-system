import { useState } from 'react'
import { User, Lock, ArrowLeft, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/services/api'

const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

interface ProfilePageProps {
  onBack: () => void
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, login } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [languages, setLanguages] = useState<string[]>((user as any)?.languages ?? ['pt'])
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  function toggleLanguage(code: string) {
    setLanguages(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(l => l !== code) : prev
        : [...prev, code]
    )
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess(false)
    setProfileLoading(true)
    try {
      await auth.updateProfile({ name: name.trim(), languages })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      setProfileError(err.message || 'Erro ao salvar perfil')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }

    setPasswordLoading(true)
    try {
      await auth.changePassword({ currentPassword, newPassword })
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao alterar senha')
    } finally {
      setPasswordLoading(false)
    }
  }

  const ROLE_LABEL: Record<string, string> = { ADMIN: 'Administrador', NORMAL: 'Usuário' }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <h1 className="text-2xl text-foreground mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          Meu Perfil
        </h1>

        {/* Info card */}
        <div className="rounded-xl border border-border bg-secondary/40 p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <User size={26} className="text-primary" />
          </div>
          <div>
            <p className="text-foreground font-medium">{user?.name}</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-primary/20 text-primary">
              {ROLE_LABEL[user?.role ?? 'NORMAL']}
            </span>
          </div>
        </div>

        {/* Dados pessoais */}
        <section className="rounded-xl border border-border bg-secondary/20 p-6 mb-6">
          <h2 className="text-foreground text-base font-medium mb-4">Dados Pessoais</h2>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            {profileError && (
              <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm">{profileError}</div>
            )}
            {profileSuccess && (
              <div className="px-4 py-3 rounded-lg bg-green-500/10 text-green-400 text-sm flex items-center gap-2">
                <Check size={14} /> Perfil atualizado com sucesso!
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-sm font-medium">Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-sm font-medium">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-muted-foreground text-sm cursor-not-allowed"
              />
              <p className="text-muted-foreground text-xs">O email não pode ser alterado</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-foreground text-sm font-medium">Idiomas que falo</label>
              <div className="flex gap-2">
                {LANGUAGES.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleLanguage(code)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 ${
                      languages.includes(code)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground bg-secondary hover:border-primary hover:text-primary'
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {profileLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </section>

        {/* Alterar senha */}
        <section className="rounded-xl border border-border bg-secondary/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-muted-foreground" />
            <h2 className="text-foreground text-base font-medium">Alterar Senha</h2>
          </div>

          {(user as any)?.googleId && !(user as any)?.passwordHash ? (
            <p className="text-muted-foreground text-sm">
              Sua conta foi criada via Google. Não é possível definir uma senha por aqui.
            </p>
          ) : (
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              {passwordError && (
                <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="px-4 py-3 rounded-lg bg-green-500/10 text-green-400 text-sm flex items-center gap-2">
                  <Check size={14} /> Senha alterada com sucesso!
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-medium">Senha atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-medium">Nova senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-medium">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
