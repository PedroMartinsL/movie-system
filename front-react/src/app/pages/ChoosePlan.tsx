import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { subscriptions, Plan } from '@/services/api'

interface ChoosePlanProps {
  onSuccess: () => void
}

const PLAN_META: Record<string, { badge?: string; highlight?: boolean; disabled?: boolean; cta: string }> = {
  'Básico':  { cta: 'Começar grátis', highlight: false },
  'Mensal':  { badge: 'Em breve', disabled: true, cta: 'Em breve' },
  'Anual':   { badge: 'Em breve', disabled: true, cta: 'Em breve' },
}

export function ChoosePlanPage({ onSuccess }: ChoosePlanProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    subscriptions.plans()
      .then(res => setPlans(res.plans))
      .catch(() => setError('Não foi possível carregar os planos'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(plan: Plan) {
    const meta = PLAN_META[plan.name]
    if (meta?.disabled) return
    setError('')
    setSubscribing(true)
    try {
      await subscriptions.subscribe(plan.id)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Erro ao assinar plano')
      setSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={20} className="text-primary" />
            <span className="text-primary text-sm font-medium uppercase tracking-widest">Bem-vindo!</span>
          </div>
          <h1 className="text-3xl text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-sm">
            Comece grátis e faça upgrade quando quiser
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center">Carregando planos...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map(plan => {
              const meta = PLAN_META[plan.name] ?? { cta: 'Assinar' }
              const isFree = plan.priceMonthly === 0

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-200 ${
                    meta.disabled
                      ? 'border-border bg-secondary/20 opacity-60'
                      : 'border-primary/40 bg-secondary/40 hover:border-primary hover:shadow-lg hover:shadow-primary/10'
                  }`}
                >
                  {meta.badge && (
                    <span className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                      {meta.badge}
                    </span>
                  )}

                  <div>
                    <h2 className="text-foreground font-semibold text-lg">{plan.name}</h2>
                    <p className="text-muted-foreground text-xs mt-1">{plan.description}</p>
                  </div>

                  <div>
                    {isFree ? (
                      <span className="text-3xl font-bold text-foreground">Grátis</span>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          R$ {plan.priceMonthly.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-muted-foreground text-sm mb-1">/mês</span>
                      </div>
                    )}
                    {plan.name === 'Anual' && (
                      <p className="text-primary text-xs mt-0.5">Equivale a R$ 178,80/ano</p>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={meta.disabled || subscribing}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      meta.disabled
                        ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60'
                    }`}
                  >
                    {subscribing && !meta.disabled ? 'Aguarde...' : meta.cta}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
