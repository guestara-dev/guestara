'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'

const USERS = [
  { email: 'admin@hoteldelmar.cl',  password: 'admin123',  role: 'admin',        name: 'Admin Guestara' },
  { email: 'recep@hoteldelmar.cl',  password: 'recep123',  role: 'receptionist', name: 'Recepcionista'  },
]

function setCookie(name: string, value: string, days = 1) {
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 3600 * 1000)
  document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`
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

    const user = USERS.find(u => u.email===email.trim() && u.password===password)
    if (!user) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Set session cookie (1 day)
    setCookie('session', JSON.stringify({ name: user.name, role: user.role, email: user.email }), 1)
    // Check if hotel is configured → set cookie
    try {
      const res = await fetch('/api/hotel')
      const data = await res.json()
      if (data?.isConfigured) setCookie('hotel_configured', 'true', 365)
    } catch {}

    setLoading(false)
    // Admin goes to setup check, receptionist goes to dashboard
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🏨</span>
            <span className="text-2xl font-bold">Guestara</span>
          </div>
          <p className="text-sm text-gray-400">Sistema de gestión hotelera</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="font-semibold text-lg mb-5">Iniciar sesión</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Correo</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@hotel.cl"
                autoComplete="email"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"/>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-violet-500 transition-colors"/>
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed py-2.5 rounded-xl text-sm font-semibold transition-all">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <><LogIn className="w-4 h-4"/>Entrar</>
              }
            </button>
          </form>

          {/* Test credentials hint */}
          <div className="mt-4 bg-gray-800/60 rounded-xl p-3 space-y-1">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Credenciales de prueba</p>
            <p className="text-xs text-gray-400 font-mono">admin@hoteldelmar.cl / admin123</p>
            <p className="text-xs text-gray-400 font-mono">recep@hoteldelmar.cl / recep123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
