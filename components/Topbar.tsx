'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, Bell, Settings, LogOut, User, Building2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function Topbar() {
  const { reservations, rooms, setSelectedGuest } = useStore()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  // Obtener nombre del hotel desde localStorage (vía store indirectamente)
  const [hotelName, setHotelName] = useState('Guestara')
  useEffect(() => {
    const config = localStorage.getItem('guestara_hotel_config')
    if (config) {
      try { setHotelName(JSON.parse(config).nombre || 'Guestara') } catch {}
    }
  }, [])

  const q = query.toLowerCase().trim()
  const results = q.length < 2 ? [] : [
    ...reservations
      .filter(r => r.guest.toLowerCase().includes(q) || r.room.includes(q))
      .slice(0,4)
      .map(r => ({
        type: 'reservation' as const,
        id: r.id,
        label: r.guest,
        sub: `Hab. ${r.room} · ${r.checkIn} → ${r.checkOut}`,
        status: r.status,
        data: r,
      })),
    ...rooms
      .filter(r => r.number.includes(q) || r.type.includes(q))
      .slice(0,3)
      .map(r => ({
        type: 'room' as const,
        id: r.id,
        label: `Habitación ${r.number}`,
        sub: `Piso ${r.floor} · ${r.type} · ${r.status}`,
        status: r.status,
        data: r,
      })),
  ]

  const handleSelect = (item: typeof results[number]) => {
    setQuery('')
    setFocused(false)
    if (item.type === 'reservation') {
      setSelectedGuest(item.data as any)
      router.push('/')
    } else {
      router.push('/habitaciones')
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const statusClr: Record<string,string> = {
    available:'text-emerald-400', occupied:'text-blue-400',
    cleaning:'text-amber-400', maintenance:'text-gray-500',
    'checked-in':'text-blue-400', confirmed:'text-emerald-400',
    pending:'text-amber-400', completed:'text-gray-500', cancelled:'text-red-400',
  }

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-5 gap-4 shrink-0">
      <div className="flex items-center gap-2 mr-4">
        <Building2 className="w-5 h-5 text-violet-500" />
        <span className="font-bold text-sm tracking-tight text-gray-200">{hotelName}</span>
      </div>

      <div ref={ref} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"/>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Buscar huésped, habitación..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"/>

        {focused && results.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            {results.map((item, i) => (
              <button key={`${item.type}-${item.id}-${i}`}
                onMouseDown={e => { e.preventDefault(); handleSelect(item) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors text-left">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  item.type==='reservation'?'bg-violet-400':'bg-blue-400'
                }`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p className="text-[10px] text-gray-500 truncate">{item.sub}</p>
                </div>
                <span className={`text-[10px] shrink-0 capitalize ${statusClr[item.status] ?? 'text-gray-400'}`}>
                  {item.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1"/>

      <button className="relative text-gray-400 hover:text-white transition-colors">
        <Bell className="w-5 h-5"/>
      </button>
      
      <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-1.5 ml-2">
        <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
          <User className="w-3.5 h-3.5"/>
        </div>
        <span className="text-sm text-gray-300">Recepcionista</span>
      </div>

      <button onClick={() => router.push('/login')}
        className="text-gray-500 hover:text-red-400 transition-colors ml-1">
        <LogOut className="w-4 h-4"/>
      </button>
    </header>
  )
}
