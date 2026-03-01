'use client'
import { useState, useMemo, useEffect } from 'react'
import { X, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import AlertDialog from '@/components/AlertDialog'

type RoomType = 'single' | 'double'
const prices: Record<RoomType,number> = { single:89, double:129 }
const labels: Record<RoomType,string> = { single:'Single', double:'Doble' }

function fmtDate(d: string) {
  if (!d) return ''
  const [,m,day] = d.split('-')
  return `${day}/${m}`
}

function todayISO() { return new Date().toISOString().split('T')[0] }
function nowHHMM() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
}

function calcDuration(inD:string,inT:string,outD:string,outT:string){
  if(!inD||!inT||!outD||!outT) return {nights:0,hours:0,minutes:0,valid:false}
  const start = new Date(`${inD}T${inT}:00`)
  const end = new Date(`${outD}T${outT}:00`)
  const ms = end.getTime()-start.getTime()
  if(ms<=0) return {nights:0,hours:0,minutes:0,valid:false}
  return {
    nights: Math.floor(ms/86400000),
    hours: Math.floor(ms/3600000),
    minutes: Math.floor((ms%3600000)/60000),
    valid: true,
  }
}

interface Props { onClose:()=>void; preRoomNumber?:string }

export default function ReservationModal({ onClose, preRoomNumber }: Props) {
  const { rooms, addReservation, checkIn: performCheckIn, reservations } = useStore()
  const preRoom = preRoomNumber ? rooms.find(r=>r.number===preRoomNumber) : null
  const preType = (preRoom?.type as RoomType) ?? 'double'

  const [guest, setGuest] = useState('')
  const [type, setType] = useState<RoomType>(preType)
  const [room, setRoom] = useState(preRoomNumber ?? '')
  const [checkIn, setCheckIn] = useState('')
  const [checkInTime, setCheckInTime] = useState('15:00')
  const [checkOut, setCheckOut] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('12:00')
  
  const [showCheckInConfirm, setShowCheckInConfirm] = useState(false)
  const [lastResId, setLastResId] = useState<number | null>(null)
  
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [touched, setTouched] = useState<Record<string,boolean>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (preRoomNumber) { setRoom(preRoomNumber); setType(preType) }
  }, [preRoomNumber, preType])

  const available = useMemo(() =>
    rooms.filter(r => r.type===type && r.status==='available'), [rooms, type])

  const dur = calcDuration(checkIn, checkInTime, checkOut, checkOutTime)
  const amount = Math.max(1, dur.nights) * prices[type]
  const dateError = checkIn && checkOut && !dur.valid
    ? 'El check-out debe ser posterior al check-in' : ''

  const isValid = (
    guest.trim() !== '' &&
    room !== '' &&
    checkIn !== '' &&
    checkOut !== '' &&
    dur.valid &&
    !dateError
  )

  const fillNow = () => {
    setCheckIn(todayISO())
    setCheckInTime(nowHHMM())
    setTouched(p => ({...p, checkIn:true}))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({guest:true, room:true, checkIn:true, checkOut:true})
    if (!isValid) return

    const newId = Date.now()
    addReservation({
      guest: guest.trim(),
      roomNumber: room,
      checkIn: `${fmtDate(checkIn)} ${checkInTime}`,
      checkOut: `${fmtDate(checkOut)} ${checkOutTime}`,
      nights: Math.max(1, dur.nights),
      amount,
    })
    
    setLastResId(newId)
    setSaved(true)
    
    // Si la fecha de check-in es hoy, preguntar si quiere hacer check-in inmediato
    if (checkIn === todayISO()) {
      setShowCheckInConfirm(true)
    } else {
      setTimeout(onClose, 1800)
    }
  }

  const handleAutoCheckIn = () => {
    if (lastResId) {
      performCheckIn(lastResId)
    }
    setShowCheckInConfirm(false)
    onClose()
  }

  const ic = (k: string) =>
    `w-full bg-gray-800 border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${
      touched[k] && errors[k]
        ? 'border-red-500'
        : 'border-gray-700 focus:border-violet-500'
    }`

  function Err({ k }: { k: string }) {
    if (!touched[k] || !errors[k]) return null
    return (
      <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
        <AlertCircle className="w-3 h-3"/>
        {errors[k]}
      </p>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold">Nueva Reserva</h2>
            {preRoomNumber && (
              <p className="text-xs text-violet-400 mt-0.5">Hab. {preRoomNumber} pre-seleccionada</p>
            )}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white"/></button>
        </div>

        {saved && !showCheckInConfirm ? (
          <div className="text-center py-12 px-5">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-emerald-400 font-medium text-lg">¡Reserva confirmada!</p>
            <p className="text-gray-400 text-sm mt-1">
              Hab. {room} · {dur.hours}h · ${amount} USD
            </p>
          </div>
        ) : !showCheckInConfirm ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
            {/* Guest */}
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Nombre del huésped *</label>
              <input
                value={guest}
                placeholder="Ej: Juan Pérez"
                onChange={e => setGuest(e.target.value)}
                onBlur={() => {
                  setTouched(p => ({...p, guest:true}))
                  setErrors(p => ({...p, guest: guest.trim() ? '' : 'Requerido'}))
                }}
                className={ic('guest')}/>
              <Err k="guest"/>
            </div>

            {/* Room type */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {(['single','double'] as RoomType[]).map(t => {
                  const av = rooms.filter(r => r.type===t && r.status==='available').length
                  const locked = !!preRoomNumber
                  return (
                    <button key={t} type="button"
                      onClick={() => !locked && av>0 && (setType(t), setRoom(''))}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        type===t
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : locked||av===0
                            ? 'bg-gray-800/30 border-gray-700/50 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-violet-500'
                      }`}>
                      <p>{labels[t]}</p>
                      <p className="text-xs opacity-60 mt-0.5">${prices[t]}/n · {av} disp.</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Room select */}
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Habitación *</label>
              {preRoomNumber ? (
                <div className="bg-gray-800 border border-violet-500/50 rounded-xl px-3 py-2.5 text-sm text-violet-300">
                  Hab. {preRoomNumber} · Piso {preRoom?.floor}
                </div>
              ) : (
                <select
                  value={room}
                  onChange={e => { setRoom(e.target.value); setErrors(p => ({...p, room:''})) }}
                  onBlur={() => setTouched(p => ({...p, room:true}))}
                  className={ic('room')}>
                  <option value="">— Selecciona —</option>
                  {available.map(r => (
                    <option key={r.id} value={r.number}>Hab. {r.number} · Piso {r.floor}</option>
                  ))}
                </select>
              )}
              <Err k="room"/>
            </div>

            {/* Check-in */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-gray-400">Check-in *</label>
                <button type="button" onClick={fillNow}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  <Clock className="w-3 h-3"/>Hoy + ahora
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={checkIn}
                  onChange={e => { setCheckIn(e.target.value); setErrors(p => ({...p, checkIn:''})) }}
                  onBlur={() => setTouched(p => ({...p, checkIn:true}))}
                  className={ic('checkIn')}/>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={e => setCheckInTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"/>
              </div>
              <Err k="checkIn"/>
            </div>

            {/* Check-out */}
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Check-out *</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || undefined}
                  onChange={e => { setCheckOut(e.target.value); setErrors(p => ({...p, checkOut:''})) }}
                  onBlur={() => setTouched(p => ({...p, checkOut:true}))}
                  className={ic('checkOut')}/>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={e => setCheckOutTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"/>
              </div>
              {dateError && (
                <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3 h-3"/>{dateError}
                </p>
              )}
            </div>

            {/* Duration summary */}
            {dur.valid && (
              <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl p-3.5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-300 font-medium">
                      {dur.nights > 0 ? `${dur.nights} noche${dur.nights>1?'s':''} · ` : ''}
                      {dur.hours}h{dur.minutes > 0 ? ` ${dur.minutes}min` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {checkInTime} → {checkOutTime} · {labels[type]}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-violet-300">${amount} USD</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                isValid
                  ? 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}>
              {isValid ? 'Confirmar Reserva' : 'Completa todos los campos'}
            </button>
          </form>
        ) : (
          <div className="p-6 text-center space-y-6">
             <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center justify-center mx-auto">
               <CheckCircle className="w-8 h-8 text-violet-400" />
             </div>
             <div>
               <h3 className="text-lg font-semibold text-white">¿Hacer check-in ahora?</h3>
               <p className="text-sm text-gray-400 mt-2">
                 La reserva para {guest} en la Hab. {room} ha sido creada. 
                 ¿Deseas realizar el check-in automático asociado a esta reserva?
               </p>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={handleAutoCheckIn}
                 className="bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-900/40"
               >
                 Hacer Check-in
               </button>
               <button 
                 onClick={onClose}
                 className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-medium transition-all"
               >
                 Después
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
