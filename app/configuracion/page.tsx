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
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-black overflow-hidden">
      {/* Side Menu */}
      <div className="w-full lg:w-80 border-r border-gray-800 p-6 space-y-8 bg-gray-900/20 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold text-white">Configuración</h1>
          <p className="text-xs text-gray-500 mt-1">Gestión general del sistema</p>
        </div>

        {/* Logo Section */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Identidad del Hotel</label>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center shadow-lg">
            <div className="relative inline-block mb-4">
              {hotelLogo ? (
                <img src={hotelLogo} alt="Logo" className="h-24 w-24 object-contain rounded-2xl border border-gray-700 bg-gray-800 p-2 shadow-inner" />
              ) : (
                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-800/50 flex flex-col items-center justify-center gap-2">
                  <Settings className="w-6 h-6 text-gray-600" />
                  <span className="text-[10px] text-gray-500 font-medium">Sin logo</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all w-full shadow-lg shadow-violet-900/20">
                Cambiar Logo
              </button>
              {hotelLogo && (
                <button onClick={() => setHotelLogo(null)} className="text-red-400 text-[10px] font-medium hover:text-red-300 transition-colors py-1">
                  Eliminar imagen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* System Section */}
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Herramientas</label>
          <div className="space-y-2">
            <button onClick={() => role === 'admin' ? router.push('/setup') : null} 
              disabled={role !== 'admin'}
              className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 px-4 py-3 rounded-xl transition-all group shadow-sm">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-gray-200">Asistente Setup</span>
              </div>
              {!role || role === 'admin' ? null : <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
            </button>

            <button onClick={() => setShowConfirm(true)}
              className="w-full flex items-center gap-3 bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 px-4 py-3 rounded-xl transition-all group">
              <Database className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-red-400">Reiniciar Base</span>
            </button>
            {done && <p className="text-[10px] text-emerald-400 text-center animate-bounce font-medium mt-2">¡Base de datos limpiada!</p>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-black">
        <div className="p-6 lg:p-8 border-b border-gray-800 bg-gray-900/10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-bold text-white">Gestión de Habitaciones</h2>
            <p className="text-xs text-gray-400 mt-1">Configura el inventario de 30 habitaciones del hotel</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/30 border-b border-gray-800">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Número</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Identificador / Alias</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Precio Base</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Estado y Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rooms.sort((a,b) => Number(a.number) - Number(b.number)).map(room => (
                      <tr key={room.number} className={`transition-colors ${editingRoom === room.number ? 'bg-violet-600/10' : room.enabled ? 'hover:bg-gray-800/40' : 'bg-red-950/5'}`}>
                        {editingRoom === room.number ? (
                          <td colSpan={5} className="px-6 py-6 bg-gray-800/50">
                            <div className="grid grid-cols-4 gap-6 items-end">
                              <div className="col-span-1">
                                <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-tight">Nombre Habitación</label>
                                <input value={editValues.name} onChange={e => setEditValues({...editValues, name: e.target.value})}
                                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 outline-none transition-all" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-tight">Tipo de Cama</label>
                                <select value={editValues.type} onChange={e => setEditValues({...editValues, type: e.target.value as any})}
                                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500">
                                  <option value="single">Individual (Single)</option>
                                  <option value="double">Matrimonial (Double)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-tight">Tarifa Diaria</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                  <input type="number" value={editValues.price} onChange={e => setEditValues({...editValues, price: Number(e.target.value)})}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-6 pr-3 py-2 text-xs text-white outline-none focus:border-violet-500" />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleSaveRoom(room.number)} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30">
                                  <Save className="w-3.5 h-3.5" /> Aplicar
                                </button>
                                <button onClick={() => setEditingRoom(null)} className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl border border-gray-600 transition-all">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-bold ${room.enabled ? 'text-white' : 'text-gray-600'}`}>{room.number}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-medium ${room.enabled ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                                {room.name || `Habitación ${room.number}`}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${room.enabled ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-transparent border-gray-800 text-gray-700'}`}>
                                {room.type === 'single' ? 'Single' : 'Double'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-semibold ${room.enabled ? 'text-emerald-400' : 'text-gray-700'}`}>${room.price.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => updateRoom(room.number, { enabled: !room.enabled })}
                                  className={`p-2 rounded-xl transition-all border ${room.enabled ? 'text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white' : 'text-amber-500 border-amber-900/30 bg-amber-500/10 hover:bg-amber-500/20'}`}
                                  title={room.enabled ? "Ocultar en Dashboard" : "Mostrar en Dashboard"}>
                                  {room.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button onClick={() => handleStartEdit(room)}
                                  className="p-2 rounded-xl text-gray-400 border border-gray-800 hover:bg-gray-800 hover:text-white transition-all"
                                  title="Editar parámetros">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <AlertDialog
          open
          title="¿Confirmar Reinicio del Sistema?"
          description="Se borrarán permanentemente todos los datos operativos (reservas, pagos, historial). La configuración de las 30 habitaciones se mantendrá pero todas quedarán como 'Disponibles'. Esta acción no se puede deshacer."
          variant="danger"
          confirmLabel="Sí, borrar todo"
          cancelLabel="Cancelar"
          onConfirm={() => { setShowConfirm(false); handleReset() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
