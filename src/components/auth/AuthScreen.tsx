import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FaXmark as X,
  FaEnvelope as Mail,
  FaLock as Lock,
  FaUser as User,
  FaAt as AtSign,
  FaEye as Eye,
  FaEyeSlash as EyeOff,
  FaSpinner as Loader2,
  FaArrowLeft as ArrowLeft,
  FaWandMagicSparkles as Sparkles,
  FaCheck as Check,
} from 'react-icons/fa6'
import { useAuth } from '@/store/useAuth'
import { useUI } from '@/store/useUI'
import { haptic, cn } from '@/lib/utils'

type View = 'signin' | 'signup' | 'forgot'

export function AuthScreen() {
  const open = useUI((s) => s.authOpen)
  const setOpen = useUI((s) => s.setAuthOpen)
  const { signIn, signUp, resetPassword, error, clearError } = useAuth()

  const [view, setView] = useState<View>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    clearError()
    setNotice(null)
  }
  const go = (v: View) => {
    setView(v)
    clearError()
    setNotice(null)
    haptic(6)
  }

  const submit = async () => {
    setBusy(true)
    setNotice(null)
    haptic()
    if (view === 'signin') {
      const ok = await signIn(email, password)
      if (ok) close()
    } else if (view === 'signup') {
      const res = await signUp(email, password, name, username)
      if (res.ok && !res.needsConfirm) close()
      else if (res.ok) setNotice('Account created! Check your email to confirm, then sign in. ✉️')
    } else {
      const ok = await resetPassword(email)
      if (ok) setNotice('Reset link sent! Check your email inbox. 📬')
    }
    setBusy(false)
  }

  const valid =
    view === 'forgot'
      ? email.includes('@')
      : view === 'signin'
        ? email.includes('@') && password.length >= 6
        : email.includes('@') && password.length >= 6 && name.trim() && username.trim().length > 1

  const titles: Record<View, { h: string; p: string; cta: string }> = {
    signin: { h: 'Welcome back', p: 'Sign in to sync your routine & see friends', cta: 'Sign in' },
    signup: { h: 'Create your account', p: 'Start tracking & share with friends', cta: 'Create account' },
    forgot: { h: 'Reset password', p: "We'll email you a secure reset link", cta: 'Send reset link' },
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background:
              'radial-gradient(120% 60% at 50% -10%, rgb(196 181 253 / 0.55), transparent 60%), radial-gradient(120% 50% at 100% 0%, rgb(249 168 212 / 0.45), transparent 55%), rgb(var(--bg))',
          }}
        >
          <div className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-10 pt-[max(env(safe-area-inset-top),1.5rem)]">
            {/* top bar */}
            <div className="mb-2 flex items-center justify-between">
              {view === 'forgot' ? (
                <button
                  onClick={() => go('signin')}
                  className="grid h-10 w-10 place-items-center rounded-full bg-surface/70 text-content shadow-soft backdrop-blur"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={close}
                className="grid h-10 w-10 place-items-center rounded-full bg-surface/70 text-muted shadow-soft backdrop-blur"
                aria-label="Continue without account"
              >
                <X size={18} />
              </button>
            </div>

            {/* hero brand */}
            <div className="mb-7 mt-6 text-center">
              <motion.div
                initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[1.6rem] text-white shadow-glow ring-1 ring-white/40"
                style={{ background: 'linear-gradient(135deg, rgb(196 181 253), rgb(249 168 212))' }}
              >
                <Sparkles size={38} strokeWidth={2.2} />
              </motion.div>
              <h1 className="font-script text-3xl text-content">RoutineFlow</h1>
              <p className="mt-1 font-hand text-lg text-muted">plan your day, beautifully ✿</p>
            </div>

            {/* form card */}
            <div className="glass rounded-3xl border border-border/60 p-6 shadow-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="font-display text-2xl font-bold text-content">{titles[view].h}</h2>
                  <p className="mb-5 text-sm text-muted">{titles[view].p}</p>

                  <div className="space-y-3">
                    {view === 'signup' && (
                      <>
                        <Field icon={<User size={17} />}>
                          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input" />
                        </Field>
                        <Field icon={<AtSign size={17} />}>
                          <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username (friends find you by this)"
                            className="input"
                            autoCapitalize="none"
                          />
                        </Field>
                      </>
                    )}

                    <Field icon={<Mail size={17} />}>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Email address"
                        className="input"
                        autoCapitalize="none"
                      />
                    </Field>

                    {view !== 'forgot' && (
                      <Field icon={<Lock size={17} />}>
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPw ? 'text' : 'password'}
                          placeholder="Password"
                          className="input"
                          onKeyDown={(e) => e.key === 'Enter' && valid && submit()}
                        />
                        <button onClick={() => setShowPw((v) => !v)} className="text-muted" tabIndex={-1} aria-label="Toggle password">
                          {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </Field>
                    )}

                    {view === 'signin' && (
                      <div className="flex justify-end">
                        <button onClick={() => go('forgot')} className="text-sm font-semibold text-brand">
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {error && (
                      <p className="rounded-2xl bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-500">{error}</p>
                    )}
                    {notice && (
                      <p className="flex items-start gap-1.5 rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-500">
                        <Check size={15} className="mt-0.5 shrink-0" /> {notice}
                      </p>
                    )}

                    <button
                      onClick={submit}
                      disabled={!valid || busy}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold text-white shadow-glow ring-1 ring-white/30 transition active:scale-[0.98] disabled:opacity-40"
                      style={{ backgroundImage: 'linear-gradient(135deg, rgb(196 181 253), rgb(244 114 182))' }}
                    >
                      {busy && <Loader2 size={18} className="animate-spin" />}
                      {titles[view].cta}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* footer switch */}
            <div className="mt-6 text-center text-sm text-muted">
              {view === 'signin' && (
                <>
                  New to RoutineFlow?{' '}
                  <button onClick={() => go('signup')} className="font-bold text-brand">
                    Create an account
                  </button>
                </>
              )}
              {view === 'signup' && (
                <>
                  Already have an account?{' '}
                  <button onClick={() => go('signin')} className="font-bold text-brand">
                    Sign in
                  </button>
                </>
              )}
              {view === 'forgot' && (
                <>
                  Remembered it?{' '}
                  <button onClick={() => go('signin')} className="font-bold text-brand">
                    Back to sign in
                  </button>
                </>
              )}
            </div>

            <button onClick={close} className="mt-4 text-center text-xs font-medium text-muted/80">
              Continue without an account →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn('flex items-center gap-2.5 rounded-2xl border border-border bg-surface-2 px-3.5 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20')}>
      <span className="text-muted">{icon}</span>
      {children}
    </div>
  )
}
