import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from '@/components/layout/BottomNav'
import { Doodles } from '@/components/decor/Doodles'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { Today } from '@/pages/Today'
import { History } from '@/pages/History'
import { Reports } from '@/pages/Reports'
import { Friends } from '@/pages/Friends'
import { Settings } from '@/pages/Settings'
import { useTheme } from '@/hooks/useTheme'
import { useReminders } from '@/hooks/useReminders'

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      className="relative z-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  )
}

export default function App() {
  useTheme()
  useReminders()
  const location = useLocation()

  return (
    <>
      <Doodles />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Page><Today /></Page>} />
          <Route path="/history" element={<Page><History /></Page>} />
          <Route path="/reports" element={<Page><Reports /></Page>} />
          <Route path="/friends" element={<Page><Friends /></Page>} />
          <Route path="/settings" element={<Page><Settings /></Page>} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
      <AuthScreen />
    </>
  )
}
