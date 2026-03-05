'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, Bell, LogOut, User, ChevronDown, Key, AlertTriangle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function Topbar() {
  const { reservations, rooms, setSelectedGuest } = useStore()
  const router = useRouter()
  const [query,        setQuery]        = useState('')
  const [focused,      setFocused]      = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)

  // UX-12: Hotel name from localStorage config
  const [hotelName, setHotelName] = useState('Mi Hotel')
  const [userName,  setUserName]  = useState('Recepcionista')
  const [userRole,  setUserRole]  = useState('receptionist')
  useEffect(() => {
    try {
      const config = localStorage.getItem('guestara_hotel_config')
      if (config) setHotelName(JSON.parse(config).nombre || 'Mi Hotel')
      const auth = document.cookie.split('; ').find(c => c.startsWith('g_auth='))?.split('=')[1]
      if (auth) {
        const user = JSON.parse(atob(decodeURIComponent(auth)))
        setUserName(user.name || 'Recepcionista')
        setUserRole(user.role || 'receptionist')
      }
    } catch {}
  }, [])

  // ADD-20: Build notifications
  const now = new Date()
  const overdueRes = reservations.filter(r => r.status === 'checked-in' && new Date(r.checkOut) < now)
  const checkinsToday = reservations.filter(r => {
    const ci = new Date(r.checkIn)
    return r.status === 'confirmed' &&
      ci.toDateString() === now.toDateString()
  })
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance')
  const notifications = [
    ...overdueRes.map(r   => ({ id:`ov-${r.id}`,   type:'danger'  as const, msg:`Reserva vencida: ${r.guest} — Hab.${r.room}` })),
    ...checkinsToday.map(r=> ({ id:`ci-${r.id}`,   type:'warning' as const, msg:`Check-in pendiente hoy: ${r.guest} — Hab.${r.room}` })),
    ...maintenanceRooms.map(r=>({ id:`mn-${r.id}`, type:'info'    as const, msg:`Hab.${r.number} en mantención` })),
  ]
  const notifCount = notifications.length

  // Search
  const q = query.toLowerCase().trim()
  const results = q.length < 2 ? [] : [
    ...reservations
      .filter(r => r.guest.toLowerCase().includes(q) || r.room.includes(q))
      .slice(0,4)
      .map(r => ({ type:'reservation' as const, id:r.id, label:r.guest, sub:`Hab. ${r.room} · ${r.checkIn} → ${r.checkOut}`, status:r.status, data:r })),
    ...rooms
      .filter(r => r.number.includes(q))
      .slice(0,3)
      .map(r => ({ type:'room' as const, id:r.id, label:`Habitación ${r.number}`, sub:`Piso ${r.floor} · ${r.type} · ${r.status}`, status:r.status, data:r })),
  ]

  const handleSelect = (item: typeof results[number]) => {
    setQuery(''); setFocused(false)
    if (item.type === 'reservation') { setSelectedGuest(item.data as any); router.push('/dashboard') }
    else { router.push('/habitaciones') }
  }

  // ADD-21: logout function
  const handleLogout = () => {
    document.cookie = 'g_auth=; path=/; max-age=0'
    document.cookie = 'session=; path=/; max-age=0'
    localStorage.removeItem('g_last_activity')
    router.push('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setFocused(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const statusClr: Record<string,string> = {
    available:'text-emerald-400', occupied:'text-blue-400', cleaning:'text-amber-400',
    maintenance:'text-gray-500', 'checked-in':'text-blue-400', confirmed:'text-emerald-400',
    pending:'text-amber-400', completed:'text-gray-500', cancelled:'text-red-400',
  }

  return (
    <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center gap-3 px-4 shrink-0">

      {/* Hotel name */}
      <span className="text-sm font-semibold text-gray-200 mr-2 hidden sm:block">{hotelName}</span>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Buscar huésped, habitación..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
        />
        {focused && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {results.map((item, i) => (
              <button
                key={i}
                onMouseDown={e => { e.preventDefault(); handleSelect(item) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{item.label}</p>
                  <p className="text-[11px] text-gray-500 truncate">{item.sub}</p>
                </div>
                <span className={`ml-auto text-[10px] shrink-0 ${statusClr[item.status] || 'text-gray-400'}`}>
                  {item.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* ADD-20: Bell notification */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Bell className="w-4 h-4 text-gray-400" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-800">
                Notificaciones {notifCount > 0 && <span className="text-red-400">({notifCount})</span>}
              </p>
              {notifications.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500 text-center">Sin notificaciones</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`flex items-start gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0 ${
                      n.type === 'danger' ? 'bg-red-500/5' : n.type === 'warning' ? 'bg-amber-500/5' : ''
                    }`}>
                      <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        n.type === 'danger' ? 'text-red-400' : n.type === 'warning' ? 'text-amber-400' : 'text-gray-500'
                      }`} />
                      <p className="text-xs text-gray-300 leading-snug">{n.msg}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ADD-21: Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-gray-200 leading-none">{userName}</p>
              <p className="text-[10px] text-gray-500 capitalize">{userRole === 'admin' ? 'Administrador' : 'Recepcionista'}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-800">
                <p className="text-xs font-medium text-white">{userName}</p>
                <p className="text-[11px] text-gray-500">{userRole === 'admin' ? 'Administrador' : 'Recepcionista'}</p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); router.push('/configuracion') }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left"
              >
                <User className="w-3.5 h-3.5" /> Mi perfil
              </button>
              <button
                onClick={() => { setProfileOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left"
              >
                <Key className="w-3.5 h-3.5" /> Cambiar contraseña
              </button>
              <div className="border-t border-gray-800" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
