import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Mail, Lock, User, AtSign, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/store/useAuth'
import { useUI } from '@/store/useUI'
import { haptic } from '@/lib/utils'

export function AuthModal() {
  const open = useUI((s) => s.authOpen)
  const setOpen = useUI((s) => s.setAuthOpen)
  const { signIn, signUp, error, clearError } = useAuth()

  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    clearError()
    setNotice(null)
  }

  const submit = async () => {
    setBusy(true)
    setNotice(null)
    haptic()
    if (mode === 'in') {
      const ok = await signIn(email, password)
      if (ok) close()
    } else {
      const res = await signUp(email, password, name, username)
      if (res.ok && !res.needsConfirm) close()
      else if (res.ok) setNotice('Almost there! Check your email to confirm, then sign in. ✉️')
    }
    setBusy(false)
  }

  const valid =
    email.includes('@') &&
    password.length >= 6 &&
    (mode === 'in' || (name.trim().length > 0 && username.trim().length > 1))

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="glass relative z-10 w-full max-w-md rounded-t-3xl border border-border/70 p-6 pb-8 shadow-glow sm:rounded-3xl safe-b"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted"
            >
              <X size={18} />
            </button>

            <div className="mb-5 text-center">
              <div
                className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-glow"
                style={{ background: 'linear-gradient(135deg, rgb(196 181 253), rgb(249 168 212))' }}
              >
                <Sparkles size={26} />
              </div>
              <h2 className="font-script text-2xl text-content">
                {mode === 'in' ? 'Welcome back' : 'Join RoutineFlow'}
              </h2>
              <p className="text-sm text-muted">
                {mode === 'in' ? 'Sign in to sync & see friends' : 'Create your account to share routines'}
              </p>
            </div>

            <div className="space-y-3">
              {mode === 'up' && (
                <>
                  <Field icon={<User size={17} />}>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input" />
                  </Field>
                  <Field icon={<AtSign size={17} />}>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username (friends find you by this)"
                      className="input"
                    />
                  </Field>
                </>
              )}
              <Field icon={<Mail size={17} />}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="input" />
              </Field>
              <Field icon={<Lock size={17} />}>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password (min 6 chars)"
                  className="input"
                  onKeyDown={(e) => e.key === 'Enter' && valid && submit()}
                />
              </Field>

              {error && <p className="text-sm font-semibold text-rose-500">{error}</p>}
              {notice && <p className="text-sm font-semibold text-emerald-500">{notice}</p>}

              <button
                onClick={submit}
                disabled={!valid || busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-40"
                style={{ backgroundImage: 'linear-gradient(135deg, rgb(196 181 253), rgb(249 168 212))' }}
              >
                {busy && <Loader2 size={18} className="animate-spin" />}
                {mode === 'in' ? 'Sign in' : 'Create account'}
              </button>
            </div>

            <p className="mt-4 text-center text-sm text-muted">
              {mode === 'in' ? "New here? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setMode(mode === 'in' ? 'up' : 'in')
                  clearError()
                  setNotice(null)
                }}
                className="font-bold text-brand"
              >
                {mode === 'in' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3.5 focus-within:border-brand">
      <span className="text-muted">{icon}</span>
      {children}
    </div>
  )
}
