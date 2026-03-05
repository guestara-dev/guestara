'use client'
import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Hotel, BedDouble, CreditCard, Settings2, Upload, Save, X, Edit2, Trash2, CheckCircle } from 'lucide-react'
import AlertDialog from '@/components/AlertDialog'

type Section = 'hotel' | 'rooms' | 'payments' | 'system'

export default function ConfiguracionPage() {
  const { rooms, updateRoom, resetDashboard, hotelLogo, setHotelLogo } = useStore()
  const [section, setSection] = useState<Section>('hotel')
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
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

  const handleEditRoom = (roomNum: string) => {
    const room = rooms.find(r => r.number === roomNum)
    if (room) {
      setEditingRoom(roomNum)
      setEditValues({ name: room.name || '', type: room.type, price: room.price || 0, enabled: room.enabled !== false })
    }
  }

  const handleSaveRoom = () => {
    if (!editingRoom) return
    updateRoom(editingRoom, editValues)
    setEditingRoom(null)
  }

  const menu = [
    { id: 'hotel'    as Section, label: 'Info del Hotel',   icon: Hotel },
    { id: 'rooms'    as Section, label: 'Habitaciones',     icon: BedDouble },
    { id: 'payments' as Section, label: 'Métodos de Pago', icon: CreditCard },
    { id: 'system'   as Section, label: 'Sistema',          icon: Settings2 },
  ]

  return (
    <div className="flex gap-6 p-5 min-h-screen">

      {/* SIDEBAR NAV */}
      <aside className="w-56 shrink-0 border-r border-gray-800 pr-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Configuración</h2>
        <nav className="flex flex-col gap-1">
          {menu.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                section === id
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 min-w-0">

        {/* ─ INFO DEL HOTEL ─ */}
        {section === 'hotel' && (
          <div>
            <h1 className="text-xl font-bold mb-1">Info del Hotel</h1>
            <p className="text-xs text-gray-500 mb-6">Nombre, logo y datos generales del establecimiento.</p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Logo del Hotel</label>
                <div className="flex items-center gap-4">
                  {hotelLogo ? (
                    <img src={hotelLogo} alt="logo" className="h-16 w-16 object-contain rounded-lg border border-gray-700 bg-gray-800" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                      <Hotel className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Subir Logo
                    </button>
                    {hotelLogo && (
                      <button onClick={() => setHotelLogo(null)} className="text-xs text-red-400 hover:text-red-300 text-left">
                        Eliminar logo
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─ HABITACIONES ─ */}
        {section === 'rooms' && (
          <div>
            <h1 className="text-xl font-bold mb-1">Habitaciones</h1>
            <p className="text-xs text-gray-500 mb-6">
              Activa o desactiva habitaciones. Las desactivadas no aparecen en el dashboard ni en las métricas.
            </p>
            <div className="space-y-2">
              {rooms.map(room => (
                <div
                  key={room.number}
                  className={`bg-gray-900 border rounded-xl p-4 transition-opacity ${
                    room.enabled === false ? 'opacity-50 border-gray-800' : 'border-gray-700'
                  }`}
                >
                  {editingRoom === room.number ? (
                    <div className="grid grid-cols-5 gap-3 items-center">
                      <input
                        value={editValues.name}
                        onChange={e => setEditValues(v => ({...v, name: e.target.value}))}
                        placeholder="Nombre"
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm col-span-1"
                      />
                      <select
                        value={editValues.type}
                        onChange={e => setEditValues(v => ({...v, type: e.target.value as any}))}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="single">Simple</option>
                        <option value="double">Doble</option>
                      </select>
                      <input
                        type="number"
                        value={editValues.price}
                        onChange={e => setEditValues(v => ({...v, price: +e.target.value}))}
                        placeholder="Precio/noche"
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
                      />
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editValues.enabled}
                          onChange={e => setEditValues(v => ({...v, enabled: e.target.checked}))}
                        />
                        Visible
                      </label>
                      <div className="flex gap-2">
                        <button onClick={handleSaveRoom} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-xs font-medium"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingRoom(null)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-violet-400 w-10">{room.number}</span>
                        <div>
                          <p className="text-sm font-medium">{room.name || `Habitación ${room.number}`}</p>
                          <p className="text-xs text-gray-500">{room.type === 'single' ? 'Simple' : 'Doble'}{room.price ? ` · $${room.price}/noche` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateRoom(room.number, { enabled: room.enabled === false ? true : false })}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                            room.enabled !== false
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {room.enabled !== false ? 'Visible' : 'Oculta'}
                        </button>
                        <button
                          onClick={() => handleEditRoom(room.number)}
                          className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─ PAGOS ─ */}
        {section === 'payments' && (
          <div>
            <h1 className="text-xl font-bold mb-1">Métodos de Pago</h1>
            <p className="text-xs text-gray-500 mb-6">Configura los métodos aceptados en el establecimiento.</p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-400">Efectivo, Tarjeta de débito/crédito y Transferencia están activos por defecto.</p>
            </div>
          </div>
        )}

        {/* ─ SISTEMA ─ */}
        {section === 'system' && (
          <div>
            <h1 className="text-xl font-bold mb-1">Sistema</h1>
            <p className="text-xs text-gray-500 mb-6">Opciones avanzadas y mantenimiento del sistema.</p>
            <div className="bg-gray-900 border border-red-900/40 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-red-400 mb-1">Zona de Peligro</h3>
              <p className="text-xs text-gray-500 mb-4">
                Elimina todas las reservas, pagos y registros. Las habitaciones vuelven al estado inicial.
                Esta acción no se puede deshacer.
              </p>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-900/40"
              >
                <Trash2 className="w-4 h-4" /> Limpiar Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <AlertDialog
          title="¿Limpiar todo el dashboard?"
          desc="Esto eliminará TODAS las reservas, pagos y auditorías. Esta acción NO se puede deshacer."
          variant="danger"
          onConfirm={() => { resetDashboard(); setShowConfirm(false); setDone(true); setTimeout(() => setDone(false), 2500) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {done && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Dashboard limpiado
        </div>
      )}
    </div>
  )
}
