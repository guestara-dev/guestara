'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Trash2, AlertTriangle, CheckCircle, Settings, Database, ShieldAlert, Edit2, Save, X, Eye, EyeOff } from 'lucide-react'
import AlertDialog from '@/components/AlertDialog'

export default function ConfiguracionPage() {
  const { rooms, updateRoom, resetDashboard, hotelLogo, setHotelLogo } = useStore()
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for room editing
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ name: '', type: 'single' as 'single' | 'double', price: 0, enabled: true })

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setHotelLogo(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    try {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('g_auth='))
      if (cookie) {
        const val = JSON.parse(atob(decodeURIComponent(cookie.split('=').slice(1).join('='))))
        setRole(val.role)
      } else {
        setRole('receptionist')
      }
    } catch {
      setRole('receptionist')
    }
  }, [])

  const handleReset = async () => {
    await resetDashboard()
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  const handleStartEdit = (room: any) => {
    setEditingRoom(room.number)
    setEditValues({
      name: room.name || `Habitación ${room.number}`,
      type: room.type,
      price: room.price,
      enabled: room.enabled
    })
  }

  const handleSaveRoom = (roomNum: string) => {
    updateRoom(roomNum, editValues)
    setEditingRoom(null)
  }

  return (
    <div className="p-5 space-y-6 max-w-4xl pb-20">
      <div>
        <h1 className="text-xl font-bold">Configuración</h1>
        <p className="text-xs text-gray-400 mt-0.5">Ajustes del sistema Guestara</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Logo del hotel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <Settings className="w-4 h-4 text-violet-400"/>
              </div>
              <div>
                <h2 className="font-semibold text-sm">Logo del hotel</h2>
                <p className="text-xs text-gray-400">Imagen de marca</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {hotelLogo ? (
                <img src={hotelLogo} alt="Logo" className="h-16 w-16 object-contain rounded-xl border border-gray-700 bg-gray-800 p-1" />
              ) : (
                <div className="h-16 w-16 rounded-xl border border-dashed border-gray-600 bg-gray-800 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Sin logo</span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-all">
                  Subir logo
                </button>
                {hotelLogo && (
                  <button onClick={() => setHotelLogo(null)} className="text-red-400 text-xs hover:underline text-left">
                    Eliminar logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info del hotel / Setup */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Settings className="w-4 h-4 text-blue-400"/>
              </div>
              <div>
                <h2 className="font-semibold text-sm">Asistente de configuración</h2>
                <p className="text-xs text-gray-400">Configuración inicial del hotel</p>
              </div>
            </div>
            {role === 'admin' ? (
              <button onClick={() => router.push('/setup')} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-xl text-xs font-medium border border-gray-700 transition-colors">
                Abrir Setup Wizard
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-amber-950/20 border border-amber-900/30 rounded-lg px-3 py-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0"/>
                <p className="text-[10px] text-amber-200/70">Solo admin puede reconfigurar el hotel.</p>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="bg-gray-900 border border-red-900/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <Database className="w-4 h-4 text-red-400"/>
              </div>
              <div>
                <h2 className="font-semibold text-sm text-red-300">Zona de peligro</h2>
                <p className="text-xs text-gray-400">Acciones críticas</p>
              </div>
            </div>
            {done ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5"/> Base limpiada exitosamente
              </div>
            ) : (
              <button onClick={() => setShowConfirm(true)} className="w-full flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 py-2 rounded-xl text-xs font-semibold transition-all">
                <Trash2 className="w-3.5 h-3.5"/> Limpiar base completa
              </button>
            )}
          </div>
        </div>

        {/* Room Management */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-sm">Gestión de Habitaciones</h2>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{rooms.length} Total</span>
            </div>
            <p className="text-xs text-gray-400">Habilitar/Deshabilitar y editar detalles</p>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[600px] p-2 space-y-1 custom-scrollbar">
            {rooms.sort((a,b) => a.number.localeCompare(b.number)).map(room => (
              <div key={room.number} className={`group rounded-lg p-2 transition-all ${editingRoom === room.number ? 'bg-violet-600/10 border border-violet-500/30' : 'hover:bg-gray-800/50 border border-transparent'}`}>
                {editingRoom === room.number ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-400">Editando {room.number}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingRoom(null)} className="p-1 hover:bg-gray-700 rounded text-gray-400"><X className="w-3.5 h-3.5"/></button>
                        <button onClick={() => handleSaveRoom(room.number)} className="p-1 bg-violet-600 text-white rounded hover:bg-violet-500"><Save className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Nombre / Alias</label>
                        <input 
                          type="text" 
                          value={editValues.name}
                          onChange={e => setEditValues({...editValues, name: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                          placeholder="Ej: Suite Presidencial"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Tipo</label>
                        <select 
                          value={editValues.type}
                          onChange={e => setEditValues({...editValues, type: e.target.value as any})}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="single">Single</option>
                          <option value="double">Double</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Precio x Noche</label>
                        <input 
                          type="number" 
                          value={editValues.price}
                          onChange={e => setEditValues({...editValues, price: Number(e.target.value)})}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => setEditValues({...editValues, enabled: !editValues.enabled})}
                      className={`w-full py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${editValues.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                    >
                      {editValues.enabled ? 'Habitación Habilitada' : 'Habitación Deshabilitada'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${room.enabled ? 'bg-gray-800 text-white' : 'bg-red-950/40 text-red-500/50 grayscale'}`}>
                        {room.number}
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${room.enabled ? 'text-gray-200' : 'text-gray-500 line-through'}`}>
                          {room.name || `Habitación ${room.number}`}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {room.type === 'single' ? 'Simple' : 'Doble'} • ${room.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => updateRoom(room.number, { enabled: !room.enabled })}
                        className={`p-1.5 rounded hover:bg-gray-700 ${room.enabled ? 'text-gray-400' : 'text-amber-500'}`}
                        title={room.enabled ? "Deshabilitar" : "Habilitar"}
                      >
                        {room.enabled ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                      </button>
                      <button 
                        onClick={() => handleStartEdit(room)}
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-400"
                        title="Editar detalles"
                      >
                        <Edit2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showConfirm && (
        <AlertDialog
          open
          title="¿Limpiar toda la base?"
          description="Se eliminarán TODAS las reservas, pagos, extras y cierres de caja. Las 30 habitaciones quedarán disponibles. Esta acción es irreversible."
          variant="danger"
          confirmLabel="Sí, limpiar todo"
          cancelLabel="Cancelar"
          onConfirm={() => { setShowConfirm(false); handleReset() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
