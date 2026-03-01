'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Save, CheckCircle, Clock, Building2, Mail, Phone, Home, ShieldAlert } from 'lucide-react'

const HOTEL_KEY = 'guestara_hotel_config'
const ROOMS_KEY = 'guestara_rooms_config'

interface HotelConfig {
  nombre: string
  direccion: string
  telefono: string
  email: string
  checkIn: string
  checkOut: string
  totalRooms: number
}

const defaults: HotelConfig = {
  nombre: '', direccion: '', telefono: '', email: '',
  checkIn: '14:00', checkOut: '12:00', totalRooms: 10,
}

export default function SetupPage() {
  const router = useRouter()
  const [config, setConfig] = useState<HotelConfig>(defaults)
  const [saved, setSaved] = useState(false)
  const [role, setRole] = useState<string>('')
  const [activeRooms, setActiveRooms] = useState<number[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(HOTEL_KEY)
    if (stored) setConfig(JSON.parse(stored))
    const storedRooms = localStorage.getItem(ROOMS_KEY)
    if (storedRooms) setActiveRooms(JSON.parse(storedRooms))
    try {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('session='))
      if (cookie) {
        const val = JSON.parse(atob(decodeURIComponent(cookie.split('=')[1])))
        setRole(val.role)
        if (val.role !== 'admin') router.push('/')
      } else { router.push('/') }
    } catch { router.push('/') }
  }, [])

  useEffect(() => {
    const count = config.totalRooms
    setActiveRooms(prev => {
      const next = Array.from({length: count}, (_, i) => i + 1)
      return next.map(n => prev.includes(n) ? n : n)
    })
  }, [config.totalRooms])

  const toggleRoom = (n: number) => {
    setActiveRooms(prev =>
      prev.includes(n) ? prev.filter(r => r !== n) : [...prev, n].sort((a,b) => a-b)
    )
  }

  const set = (k: keyof HotelConfig, v: string | number) =>
    setConfig(prev => ({ ...prev, [k]: v }))

  const handleSave = () => {
    localStorage.setItem(HOTEL_KEY, JSON.stringify(config))
    localStorage.setItem(ROOMS_KEY, JSON.stringify(activeRooms))
    setSaved(true)
    setTimeout(() => { setSaved(false); router.push('/configuracion') }, 2000)
  }

  if (role !== 'admin') return null

  const allRooms = Array.from({length: config.totalRooms}, (_, i) => i + 1)

  return (
    <div className="p-5 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
          <Settings className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Asistente de configuracion</h1>
          <p className="text-xs text-gray-400">Solo visible para Administrador</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
          <ShieldAlert className="w-3 h-3" /> Admin
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-sm">Identidad del hotel</h2>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Nombre del hotel</label>
          <input type="text" value={config.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Hotel Casa del Sol" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Direccion</label>
          <input type="text" value={config.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Av. Principal 123" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Telefono</label>
            <input type="text" value={config.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email</label>
            <input type="email" value={config.email} onChange={e => set('email', e.target.value)} placeholder="contacto@hotel.com" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-sm">Horarios</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Check-in</label>
            <input type="time" value={config.checkIn} onChange={e => set('checkIn', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Check-out</label>
            <input type="time" value={config.checkOut} onChange={e => set('checkOut', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-sm">Cabanas</h2>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Total de cabanas</label>
          <input type="number" min={1} max={100} value={config.totalRooms} onChange={e => set('totalRooms', parseInt(e.target.value) || 1)} className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2">Selecciona las cabanas activas (visibles en el dashboard)</p>
          <div className="grid grid-cols-5 gap-2">
            {allRooms.map(n => (
              <button key={n} onClick={() => toggleRoom(n)} className={`py-2 rounded-lg text-sm font-medium border transition-colors ${ activeRooms.includes(n) ? 'bg-violet-600 border-violet-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500' }`}>
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{activeRooms.length} de {config.totalRooms} cabanas activas</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
          {saved ? <><CheckCircle className="w-4 h-4" /> Guardado!</> : <><Save className="w-4 h-4" /> Guardar configuracion</>}
        </button>
        <button onClick={() => router.push('/configuracion')} className="text-sm text-gray-400 hover:text-white px-3 py-2">
          Cancelar
        </button>
      </div>
    </div>
  )
}
