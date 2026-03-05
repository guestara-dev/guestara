'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, RefreshCw, Clock } from 'lucide-react'

const TIMEOUT_MS  = 10 * 60 * 1000  // 10 minutos de inactividad
const WARNING_MS  = 30 * 1000       // Aviso 30s antes
const LAST_ACT_KEY = 'g_last_activity'

export default function AutoLogout() {
  const router   = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const warnRef  = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // BUG-04 FIX: countdown state starts at 30 and decrements properly
  const [showWarning, setShowWarning] = useState(false)
  const [seconds,     setSeconds]     = useState(30)

  // BUG-04 FIX: logout clears cookie + localStorage and navigates to /login
  const logout = useCallback(() => {
    if (countRef.current) clearInterval(countRef.current)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warnRef.current)  clearTimeout(warnRef.current)
    document.cookie = 'g_auth=; path=/; max-age=0'
    document.cookie = 'session=; path=/; max-age=0'
    localStorage.removeItem(LAST_ACT_KEY)
    router.push('/login')
  }, [router])

  // BUG-04 FIX: resetTimer clears ALL timers + resets countdown state
  const resetTimer = useCallback(() => {
    if (pathname === '/login') return
    localStorage.setItem(LAST_ACT_KEY, Date.now().toString())

    if (timerRef.current) clearTimeout(timerRef.current)
    if (warnRef.current)  clearTimeout(warnRef.current)
    if (countRef.current) clearInterval(countRef.current)

    setShowWarning(false)
    setSeconds(30)

    // Warn user WARNING_MS before logout
    warnRef.current = setTimeout(() => {
      setShowWarning(true)
      setSeconds(30)
      // BUG-04 FIX: interval uses functional updater for correct decrement
      countRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            if (countRef.current) clearInterval(countRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, TIMEOUT_MS - WARNING_MS)

    // Final logout after full timeout
    timerRef.current = setTimeout(logout, TIMEOUT_MS)
  }, [pathname, logout])

  // BUG-04 FIX: auto-logout when counter reaches 0
  useEffect(() => {
    if (seconds === 0 && showWarning) {
      logout()
    }
  }, [seconds, showWarning, logout])

  useEffect(() => {
    if (pathname === '/login') return
    const lastAct = localStorage.getItem(LAST_ACT_KEY)
    if (lastAct) {
      const diff = Date.now() - parseInt(lastAct)
      if (diff >= TIMEOUT_MS) { logout(); return }
    }
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warnRef.current)  clearTimeout(warnRef.current)
      if (countRef.current) clearInterval(countRef.current)
    }
  }, [pathname, resetTimer, logout])

  if (!showWarning || pathname === '/login') return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-amber-500/40 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Sesión por expirar</h3>
            <p className="text-xs text-gray-400">Tu sesión está a punto de cerrarse</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center py-4 mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 mb-2">
            <span className="text-2xl font-bold text-amber-400">{seconds}</span>
          </div>
          <p className="text-sm text-gray-400">segundos restantes</p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {/* BUG-04 FIX: Continuar llama resetTimer para renovar la sesión */}
          <button
            onClick={resetTimer}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Continuar sesión
          </button>
          {/* BUG-04 FIX: Cerrar sesión llama logout correctamente */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-sm text-gray-400 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
