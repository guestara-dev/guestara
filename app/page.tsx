'use client'
import { useState, useEffect } from 'react'
import StatsGrid from '@/components/StatsGrid'
import RoomGrid from '@/components/RoomGrid'
import ReservationModal from '@/components/ReservationModal'
import GuestModal from '@/components/GuestModal'
import { useStore } from '@/lib/store'
import { Plus, Bot } from 'lucide-react'

const statusCfg: Record<string,{label:string;cls:string}> = {
  'pending':    {label:'Pendiente',  cls:'bg-amber-500/20 text-amber-300'},
  'confirmed':  {label:'Confirmada', cls:'bg-emerald-500/20 text-emerald-300'},
  'checked-in': {label:'En Casa',    cls:'bg-blue-500/20 text-blue-300'},
  'completed':  {label:'Completada', cls:'bg-gray-500/20 text-gray-400'},
  'cancelled':  {label:'Cancelada',  cls:'bg-red-500/20 text-red-400'},
}

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const { reservations, setSelectedGuest, selectedRoomNumber, setSelectedRoomNumber } = useStore()
  const active = reservations.filter(r=>!['cancelled','completed'].includes(r.status))

  useEffect(()=>{ if(selectedRoomNumber) setShowModal(true) }, [selectedRoomNumber])

  const handleClose = () => { setShowModal(false); setSelectedRoomNumber(null) }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-xs mt-0.5">Sábado, 28 de Febrero 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors">
            <Bot className="w-4 h-4 text-violet-400"/>Concierge IA
          </button>
          <button onClick={()=>setShowModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4"/>Nueva Reserva
          </button>
        </div>
      </div>
      <StatsGrid/>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2"><RoomGrid/></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
          <h2 className="font-semibold text-sm mb-3">Actividad · {active.length} activas</h2>
          <div className="space-y-2 overflow-y-auto flex-1 pr-0.5" style={{maxHeight:'520px'}}>
            {active.map(r=>(
              <div key={r.id} onClick={()=>setSelectedGuest(r)}
                className="bg-gray-800 hover:bg-gray-700/80 rounded-xl p-3 cursor-pointer border border-transparent hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate mr-2">{r.guest}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${statusCfg[r.status].cls}`}>
                    {statusCfg[r.status].label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Hab. {r.room} · {r.checkIn}→{r.checkOut}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">${r.amount} · {r.nights}n</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showModal && <ReservationModal onClose={handleClose} preRoomNumber={selectedRoomNumber??undefined}/>}
      <GuestModal/>
    </div>
  )
}
