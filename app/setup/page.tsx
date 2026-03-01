'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Save, CheckCircle, Clock, Building2, Mail, Phone, MapPin } from 'lucide-react'

const HOTEL_KEY = 'guestara_hotel_config'

interface HotelConfig {
  nombre: string
  direccion: string
  telefono: string
  email: string
  checkIn: string
  checkOut: string
}

const defaults: HotelConfig = {
  nombre: '', direccion: '', telefono: '', email: '',
  checkIn: '14:00', checkOut: '12:00',
}

export default function SetupPage() {
  const router = useRouter()
  const [config, setConfig] = useState<HotelConfig>(defaults)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(HOTEL_KEY)
    if (stored) setConfig(JSON.parse(stored))
  }, [])

  const set = (k: keyof HotelConfig, v: string) =>
    setConfig(prev => ({ ...prev, [k]: v }))

  const handleSave = () => {
    localStorage.setItem(HOTEL_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => { setSaved(false); router.push('/configuracion') }, 2000)
  }

  return (
    <div className="p-5 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
          <Settings className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Asistente de configuracion</h1>
          <p className="text-xs text-gray-400">Personalizacion del hotel</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-sm">Identidad del hotel</h2>
        </div>
        <div>
          abel className="text-xs text-gray-400 mb-1 block">Nombre del hotel</label>
          <input type="text" value={config.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Hotel Casa del Sol" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-500" />
        </div>
        <div>
          abel className="text-xs text-gray-400 mb-1 block">Direccion</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input type="text" value={config.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Ej: Av. Principal 123" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            abel className="text-xs text-gray-400 mb-1 block">Telefono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input type="text" value={config.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-500" />
            </div>
          </div>
          <div>
            abel className="text-xs text-gray-400 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input type="email" value={config.email} onChange={e => set('email', e.target.value)} placeholder="contacto@hotel.com" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-500" />
            </div>
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
            abel className="text-xs text-gray-400 mb-1 block">Check-in</label>
            <input type="time" value={config.checkIn} onChange={e => set('checkIn', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white" />
          </div>
          <div>
            abel className="text-xs text-gray-400 mb-1 block">Check-out</label>
            <input type="time" value={config.checkOut} onChange={e => set('checkOut', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          {saved ? (<><CheckCircle className="w-4 h-4" /> Guardado!</>) : (<><Save className="w-4 h-4" /> Guardar configuracion</>)}
        </button>
        <button onClick={() => router.push('/configuracion')} className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">
          Cancelar
        </button>
      </div>
    </div>
  )
}
