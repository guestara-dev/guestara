'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, RefreshCw, Clock } from 'lucide-react'

const TIMEOUT_MS  = 10 * 60 * 1000  // 10 minutos de inactividad
const WARNING_MS  = 30 * 1000        // Aviso 30s antes
const LAST_ACT_KEY = 'g_last_activity'

export default function AutoLogout() {
  const router    = useRouter()
  const pathname  = usePathname()
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown,   setCountdown]   = useState(30)

  // P4 FIX: logout clears cookie + localStorage and navigates to /login
  const logout = useCallback(() => {
    document.cookie = 'g_auth=; path=/; max-age=0'
    localStorage.removeItem(LAST_ACT_KEY)
    router.push('/login')
  }, [router])

  // P4 FIX: resetTimer properly clears ALL timers before resetting
  const resetTimer = useCallback(() => {
    if (pathname === '/login') return

    localStorage.setItem(LAST_ACT_KEY, Date.now().toString())

    // Clear all pending timers
    if (timerRef.current)  clearTimeout(timerRef.current)
    if (warnRef.current)   clearTimeout(warnRef.current)
    if (countRef.current)  clearInterval(countRef.current)

    setShowWarning(false)
    setCountdown(30)

    // Warning appears WARNING_MS before logout
    warnRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(30)
      countRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            if (countRef.current) clearInterval(countRef.current)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }, TIMEOUT_MS - WARNING_MS)

    // Final logout after full timeout
    timerRef.current = setTimeout(logout, TIMEOUT_MS)
  }, [pathname, logout])

  useEffect(() => {
    if (pathname === '/login') return

    // Check if session expired while page was closed
    const lastAct = localStorage.getItem(LAST_ACT_KEY)
    if (lastAct) {
      const diff = Date.now() - parseInt(lastAct)
      if (diff >= TIMEOUT_MS) {
        logout()
        return
      }
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current)  clearTimeout(timerRef.current)
      if (warnRef.current)   clearTimeout(warnRef.current)
      if (countRef.current)  clearInterval(countRef.current)
    }
  }, [pathname, resetTimer, logout])

  if (!showWarning || pathname === '/login') return null

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center pb-8 px-4 pointer-events-none">
      <div className="bg-gray-900 border border-orange-500/50 rounded-2xl shadow-2xl p-5 w-full max-w-sm pointer-events-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sesión por expirar</p>
            <p className="text-xs text-gray-400">Cierre automático en <span className="text-orange-400 font-bold">{countdown}s</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* P4 FIX: "Continuar" llama resetTimer para renovar la sesión */}
          <button
            onClick={resetTimer}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Continuar
          </button>
          {/* P4 FIX: "Cerrar sesión" llama logout correctamente */}
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-xl text-sm font-medium transition-colors border border-gray-700"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
