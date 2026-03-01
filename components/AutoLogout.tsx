'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
// FIX #4: Auto-logout after 2 minutes of inactivity
// Also redirects to /login on page load (every update/refresh)
const TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes
const WARNING_MS = 30 * 1000 // show warning 30s before logout
export default function AutoLogout() {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logout = () => {
    document.cookie = 'g_auth=; path=/; max-age=0'
    router.push('/login')
  }
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warnRef.current) clearTimeout(warnRef.current)
    if (countRef.current) clearInterval(countRef.current)
    setShowWarning(false)
    setCountdown(30)
    // Warning at TIMEOUT_MS - WARNING_MS
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
    timerRef.current = setTimeout(logout, TIMEOUT_MS)
  }
  useEffect(() => {
    const events = ['mousemove','keydown','click','scroll','touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warnRef.current) clearTimeout(warnRef.current)
      if (countRef.current) clearInterval(countRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!showWarning) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-amber-600/50 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
        <div className="text-4xl mb-3">⏰</div>
        <h2 className="text-lg font-bold text-amber-300 mb-2">Sesión por expirar</h2>
        <p className="text-sm text-gray-400 mb-4">
          Tu sesión se cerrará automáticamente en
          <span className="text-amber-300 font-bold mx-1">{countdown}s</span>
          por inactividad.
        </p>
        <div className="flex gap-3">
          <button
            onClick={resetTimer}
            className="flex-1 bg-violet-600 hover:bg-violet-500 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Continuar sesión
          </button>
          <button
            onClick={logout}
            className="flex-1 bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-sm text-gray-300 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
