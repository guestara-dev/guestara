'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Room } from '@/lib/data'
import { Plus, Wrench, Sparkles, User, X, CheckCircle } from 'lucide-react'

// BUG #4 FIX: modal for maintenance/cleaning rooms
function RoomStatusModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const { updateRoomStatus } = useStore()
  const isMaint = room.status === 'maintenance'
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Hab. {room.number}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white"/></button>
        </div>
        <div className={`rounded-xl p-4 mb-4 text-center ${isMaint?'bg-gray-800/60':'bg-amber-950/30'}`}>
          {isMaint ? <Wrench className="w-8 h-8 text-gray-500 mx-auto mb-2"/> : <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2"/>}
          <p className="font-medium capitalize">{room.status === 'maintenance' ? 'En mantención' : 'En limpieza'}</p>
          <p className="text-xs text-gray-400 mt-1">Piso {room.floor} · {room.type}</p>
        </div>
        <div className="space-y-2">
          <button onClick={() => { updateRoomStatus(room.number, 'available'); onClose() }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <CheckCircle className="w-4 h-4"/> Marcar como Disponible
          </button>
          {isMaint && (
            <button onClick={() => { updateRoomStatus(room.number, 'cleaning'); onClose() }}
              className="w-full bg-amber-700/40 hover:bg-amber-700/60 py-2.5 rounded-xl text-sm font-medium transition-colors text-amber-300">
              Pasar a Limpieza
            </button>
          )}
          <button onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-sm text-gray-400 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function RoomCard({ room, onManage }: { room: Room; onManage: (r: Room) => void }) {
  const { reservations, setSelectedGuest, setSelectedRoomNumber } = useStore()
  const activeRes = reservations.find(r =>
    r.room === room.number && ['checked-in','confirmed','pending'].includes(r.status))
  const typeTag = room.type === 'single' ? 'S' : 'D'

  if (room.status === 'available') {
    return (
      <div onClick={() => setSelectedRoomNumber(room.number)}
        className="relative border-2 border-emerald-400/70 bg-emerald-950 hover:bg-emerald-900/80 rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.06] hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/60 select-none">
        <div className="flex items-start justify-between">
          <span className="text-base font-extrabold text-emerald-300 leading-none">{room.number}</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded">{typeTag}</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-emerald-400">
          <Plus className="w-3 h-3"/><span className="text-[10px] font-semibold">Reservar</span>
        </div>
        <p className="text-[9px] text-emerald-600 mt-0.5">${room.price}/n</p>
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
      </div>
    )
  }
  if (room.status === 'occupied') {
    const firstName = activeRes?.guest.split(' ')[0] ?? ''
    return (
      <div onClick={() => activeRes && setSelectedGuest(activeRes)}
        className="relative border border-blue-500/40 bg-blue-950/50 rounded-xl p-2.5 cursor-pointer hover:bg-blue-900/40 hover:scale-[1.03] transition-all select-none">
        <div className="flex items-start justify-between">
          <span className="text-base font-bold text-white leading-none">{room.number}</span>
          <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded">{typeTag}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          <User className="w-2.5 h-2.5 text-blue-400/70 shrink-0"/>
          <p className="text-[10px] font-medium text-blue-200 truncate">{firstName}</p>
        </div>
        {activeRes && <p className="text-[9px] text-blue-400/60 mt-0.5">Sale {activeRes.checkOut}</p>}
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400"/>
      </div>
    )
  }
  if (room.status === 'cleaning') {
    return (
      // BUG #4: cleaning rooms also clickable
      <div onClick={() => onManage(room)}
        className="border border-amber-600/30 bg-amber-950/20 rounded-xl p-2.5 cursor-pointer hover:bg-amber-950/40 opacity-70 hover:opacity-90 transition-all select-none">
        <div className="flex items-start justify-between">
          <span className="text-base font-semibold text-amber-600/80 leading-none">{room.number}</span>
          <span className="text-[9px] bg-amber-500/10 text-amber-600/70 px-1 py-0.5 rounded">{typeTag}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-amber-600/70">
          <Sparkles className="w-2.5 h-2.5"/><span className="text-[10px]">Limpieza</span>
        </div>
      </div>
    )
  }
  // BUG #4 FIX: maintenance rooms are now clickable
  return (
    <div onClick={() => onManage(room)}
      className="border border-gray-600/50 bg-gray-800/30 rounded-xl p-2.5 cursor-pointer hover:bg-gray-800/50 hover:opacity-70 opacity-50 transition-all select-none">
      <div className="flex items-start justify-between">
        <span className="text-base font-semibold text-gray-500 leading-none">{room.number}</span>
        <span className="text-[9px] bg-gray-700/30 text-gray-600 px-1 py-0.5 rounded">{typeTag}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-gray-600">
        <Wrench className="w-2.5 h-2.5"/><span className="text-[10px]">Mant.</span>
      </div>
    </div>
  )
}

export default function RoomGrid() {
  const { rooms } = useStore()
  const [mounted, setMounted] = useState(false)
  const [managingRoom, setManagingRoom] = useState<Room | null>(null)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-32 bg-gray-800 rounded"/>
          <div className="h-3 w-48 bg-gray-800 rounded"/>
        </div>
        {[1,2,3].map(f => (
          <div key={f} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-12 bg-gray-800 rounded"/>
              <div className="flex-1 h-px bg-gray-800"/>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(10)].map((_,i) => <div key={i} className="h-16 bg-gray-800/60 rounded-xl"/>)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const cnt = {
    available:   rooms.filter(r=>r.status==='available').length,
    occupied:    rooms.filter(r=>r.status==='occupied').length,
    cleaning:    rooms.filter(r=>r.status==='cleaning').length,
    maintenance: rooms.filter(r=>r.status==='maintenance').length,
  }

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Mapa · {rooms.length} habitaciones</h2>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-[10px] text-emerald-400 font-medium">Disponible ({cnt.available})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400"/>
              <span className="text-[10px] text-blue-400">Ocupada ({cnt.occupied})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500/70"/>
              <span className="text-[10px] text-amber-500/70">Limpieza ({cnt.cleaning})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-600/50"/>
              <span className="text-[10px] text-gray-500">Mantención ({cnt.maintenance})</span>
            </div>
          </div>
        </div>
        {[1,2,3].map(floor => (
          <div key={floor} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Piso {floor}</p>
              <div className="flex-1 h-px bg-gray-800"/>
              <span className="text-[10px] text-emerald-600 font-medium">
                {rooms.filter(r=>r.floor===floor&&r.status==='available').length} disp.
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {rooms.filter(r=>r.floor===floor).map(r =>
                <RoomCard key={r.id} room={r} onManage={setManagingRoom}/>
              )}
            </div>
          </div>
        ))}
      </div>

      {managingRoom && <RoomStatusModal room={managingRoom} onClose={() => setManagingRoom(null)}/>}
    </>
  )
}
