'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react'

// BUG-03 FIX: Credenciales ocultas en producción
const IS_DEV = process.env.NODE_ENV === 'development'

const USERS = [
  { email: 'admin@hoteldelmar.cl',  password: 'admin123', role: 'admin',         name: 'Admin Guestara'  },
  { email: 'recep@hoteldelmar.cl',  password: 'recep123', role: 'receptionist',  name: 'Recepcionista'   },
]

function setCookie(name: string, value: string, days = 1) {
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 3600 * 1000)
  document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`
}

// BUG-03 FIX: Componente separado solo visible en development
function DemoCredentials() {
  return (
    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
      <div className="flex items-center gap-1.5 mb-2">
        <Shield className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-amber-400">Credenciales de Prueba</span>
        <span className="text-[10px] text-amber-600 ml-auto">(solo en desarrollo)</span>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-gray-400 font-mono">admin@hoteldelmar.cl / admin123</p>
        <p className="text-xs text-gray-400 font-mono">recep@hoteldelmar.cl / recep123</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const user = USERS.find(u => u.email === email.trim() && u.password === password)
    if (!user) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }
    // BUG-01 FIX: Save as 'g_auth' cookie so middleware reads it
    const payload = encodeURIComponent(btoa(JSON.stringify({ name: user.name, role: user.role, email: user.email })))
    setCookie('g_auth', payload, 1)
    setCookie('session', payload, 1) // backward compat
    try {
      const res  = await fetch('/api/hotel')
      const data = await res.json()
      if (data?.isConfigured) setCookie('hotel_configured', 'true', 365)
    } catch {}
    setLoading(false)
    // BUG-01 FIX: Redirect to /dashboard (not /) after login
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🏨</span>
            <span className="text-2xl font-bold">Guestara</span>
          </div>
          <p className="text-sm text-gray-400">Sistema de gestión hotelera</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="font-semibold text-lg mb-5">Iniciar sesión</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Correo</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@hotel.cl"
                autoComplete="email"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            {/* Password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}
            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" /> Entrar</>
              )}
            </button>
          </form>

          {/* BUG-03 FIX: Solo visible en development */}
          {IS_DEV && <DemoCredentials />}
        </div>
      </div>
    </div>
  )
}
