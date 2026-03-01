'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Room } from '@/lib/data'
import { BedDouble, Wrench, Sparkles, CheckCircle, UserSquare2 } from 'lucide-react'
import AlertDialog from '@/components/AlertDialog'
import GuestModal from '@/components/GuestModal'

type RoomStatus = Room['status']

const statusMeta: Record<RoomStatus,{label:string;cls:string}> = {
  available:   {label:'Disponible', cls:'bg-emerald-500/20 text-emerald-300'},
  occupied:    {label:'Ocupada',    cls:'bg-blue-500/20 text-blue-300'},
  cleaning:    {label:'Limpieza',   cls:'bg-amber-500/20 text-amber-300'},
  maintenance: {label:'Mantención', cls:'bg-gray-500/20 text-gray-400'},
}

interface Confirm { title:string; desc:string; action:()=>void }

export default function HabitacionesPage() {
  const { rooms, reservations, updateRoomStatus, setSelectedGuest } = useStore()
  const [filter, setFilter] = useState<RoomStatus|'all'>('all')
  const [confirm, setConfirm] = useState<Confirm|null>(null)
  const [showGuestModal, setShowGuestModal] = useState(false)

  const ask = (title:string, desc:string, action:()=>void) => setConfirm({title,desc,action})

  const displayed = filter==='all' ? rooms : rooms.filter(r=>r.status===filter)

  const openGuestModal = (room: Room) => {
    const res = reservations.find(r =>
      r.room===room.number && ['checked-in','confirmed','pending'].includes(r.status))
    if (res) {
      setSelectedGuest(res)
      setShowGuestModal(true)
    }
  }

  const counts = {
    all: rooms.length,
    available: rooms.filter(r=>r.status==='available').length,
    occupied: rooms.filter(r=>r.status==='occupied').length,
    cleaning: rooms.filter(r=>r.status==='cleaning').length,
    maintenance: rooms.filter(r=>r.status==='maintenance').length,
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Habitaciones</h1>
          <p className="text-xs text-gray-400 mt-0.5">{rooms.length} habitaciones · {counts.available} disponibles</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all','available','occupied','cleaning','maintenance'] as const).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter===s?'bg-violet-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {s==='all'?`Todas (${counts.all})`:
             s==='available'?`Disponibles (${counts.available})`:
             s==='occupied'?`Ocupadas (${counts.occupied})`:
             s==='cleaning'?`Limpieza (${counts.cleaning})`:
             `Mantención (${counts.maintenance})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/30">
              {['Hab.','Piso','Tipo','Precio/n','Estado','Huésped','Acciones'].map(h=>(
                <th key={h} className="px-4 py-3 text-xs text-gray-400 font-medium text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(room => {
              const res = reservations.find(r=>r.room===room.number&&['checked-in','confirmed','pending'].includes(r.status))
              return (
                <tr key={room.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="px-4 py-3 font-bold">{room.number}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{room.floor}</td>
                  <td className="px-4 py-3 text-sm capitalize text-gray-300">{room.type}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">${room.price}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta[room.status].cls}`}>
                      {statusMeta[room.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {res ? res.guest : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {/* BUG #6 FIX: occupied rooms get action button */}
                      {room.status==='occupied'&&(
                        <button onClick={()=>openGuestModal(room)}
                          className="flex items-center gap-1 text-[10px] bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                          <UserSquare2 className="w-3 h-3"/>Ver huésped
                        </button>
                      )}
                      {room.status==='available'&&(
                        <div className="flex gap-1">
                          <button onClick={()=>ask('Mantención',`Poner hab. ${room.number} en mantención?`,()=>updateRoomStatus(room.number,'maintenance'))}
                            className="flex items-center gap-1 text-[10px] bg-gray-600/20 text-gray-400 hover:bg-gray-600/40 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                            <Wrench className="w-3 h-3"/>Mantención
                          </button>
                          <button onClick={()=>ask('Limpieza',`Poner hab. ${room.number} en limpieza?`,()=>updateRoomStatus(room.number,'cleaning'))}
                            className="flex items-center gap-1 text-[10px] bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3"/>Limpieza
                          </button>
                        </div>
                      )}
                      {(room.status==='cleaning'||room.status==='maintenance')&&(
                        <button onClick={()=>ask('Disponible',`¿Marcar hab. ${room.number} como disponible?`,()=>updateRoomStatus(room.number,'available'))}
                          className="flex items-center gap-1 text-[10px] bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                          <CheckCircle className="w-3 h-3"/>Disponible
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showGuestModal && <GuestModal onClose={()=>setShowGuestModal(false)}/>}
      {confirm&&(
        <AlertDialog open title={confirm.title} description={confirm.desc}
          variant="warning" confirmLabel="Confirmar" cancelLabel="Cancelar"
          onConfirm={()=>{confirm.action();setConfirm(null)}}
          onCancel={()=>setConfirm(null)}/>
      )}
    </div>
  )
}
