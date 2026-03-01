'use client'
// FIX [C-03] [U-02] Confirmation before destructive actions
// FIX [M-02] Category badges with item counts
import { useState } from 'react'
import { X, BedDouble, Calendar, DollarSign, LogIn, LogOut, XCircle, RotateCcw, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useStore } from '@/lib/store'
import { extrasCatalog, ExtraCategory } from '@/lib/data'
import AlertDialog from './AlertDialog'
import PaymentModal from './PaymentModal'

const statusCfg: Record<string,{label:string;cls:string}> = {
  'pending':    {label:'Pendiente',  cls:'bg-amber-500/20 text-amber-300 border-amber-500/30'    },
  'confirmed':  {label:'Confirmada', cls:'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'},
  'checked-in': {label:'En Casa',    cls:'bg-blue-500/20 text-blue-300 border-blue-500/30'       },
  'completed':  {label:'Completada', cls:'bg-gray-500/20 text-gray-400 border-gray-500/30'       },
  'cancelled':  {label:'Cancelada',  cls:'bg-red-500/20 text-red-400 border-red-500/30'          },
}
const catLabel: Record<ExtraCategory,string> = {
  food:'Comida', drink:'Bebidas', service:'Servicios', transport:'Transporte', other:'Otros'
}
const typeLabel: Record<string,string> = { single:'Single', double:'Doble', suite:'Suite' }

type Confirm = { open:boolean; title:string; desc:string; action:()=>void; variant:'danger'|'warning' }

export default function GuestModal() {
  const { selectedGuest, setSelectedGuest, reservations, rooms,
    checkIn, checkOut, cancelReservation, updateResStatus,
    addExtra, removeExtra, getExtrasForReservation } = useStore()

  const [tab,         setTab]         = useState<'info'|'extras'>('info')
  const [showCatalog, setShowCatalog] = useState(false)
  const [qty,         setQty]         = useState<Record<number,number>>({})
  const [catFilter,   setCatFilter]   = useState<ExtraCategory|'all'>('all')
  // FIX [C-03] [U-02]
  const [confirm,     setConfirm]     = useState<Confirm|null>(null)
  const [showPayment, setShowPayment] = useState(false)

  if (!selectedGuest) return null
  const res   = reservations.find(r=>r.id===selectedGuest.id) ?? selectedGuest
  const room  = rooms.find(rm=>rm.number===res.room)
  const s     = statusCfg[res.status] ?? statusCfg['confirmed']
  const myExtras    = getExtrasForReservation(res.id)
  const extrasTotal = myExtras.reduce((sum,e)=>sum+e.total, 0)
  const grandTotal  = res.amount + extrasTotal

  // FIX [M-02] Count per category
  const catCounts = extrasCatalog.reduce((acc,item) => {
    acc[item.category] = (acc[item.category]??0)+1; return acc
  }, {} as Record<ExtraCategory,number>)

  const filteredCatalog = catFilter==='all' ? extrasCatalog : extrasCatalog.filter(e=>e.category===catFilter)
  const totalAll = extrasCatalog.length

  const handleAddExtra = (extraId:number, name:string, price:number) => {
    addExtra(res.id, extraId, name, price, qty[extraId]??1)
    setQty(p=>({...p,[extraId]:1}))
  }

  const ask = (title:string, desc:string, action:()=>void, variant:'danger'|'warning'='warning') =>
    setConfirm({ open:true, title, desc, action, variant })

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col" style={{maxHeight:'88vh'}}>

          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-800 shrink-0">
            <div>
              <h2 className="text-lg font-semibold">{res.guest}</h2>
              <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full border mt-1 ${s.cls}`}>{s.label}</span>
            </div>
            <button onClick={()=>{setSelectedGuest(null);setTab('info');setShowCatalog(false)}}
              className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5"/></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800 px-5 shrink-0">
            {(['info','extras'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)}
                className={`py-2.5 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab===t ? 'border-violet-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                {t==='info' ? 'Información' : (
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5"/>
                    Extras
                    {myExtras.length>0 && <span className="bg-violet-600 text-xs px-1.5 py-0.5 rounded-full">{myExtras.length}</span>}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 p-5">
            {tab==='info' && (
              <div className="space-y-2.5">
                <div className="flex gap-3 bg-gray-800 rounded-xl p-3.5">
                  <BedDouble className="w-4 h-4 text-violet-400 shrink-0 mt-0.5"/>
                  <div><p className="text-xs text-gray-400">Habitación</p>
                    <p className="text-sm font-medium">{res.room} · {room?typeLabel[room.type]??room.type:''} · ${room?.price??0}/noche</p></div>
                </div>
                <div className="flex gap-3 bg-gray-800 rounded-xl p-3.5">
                  <Calendar className="w-4 h-4 text-violet-400 shrink-0 mt-0.5"/>
                  <div><p className="text-xs text-gray-400">Estadía</p>
                    <p className="text-sm font-medium">{res.checkIn} → {res.checkOut} · {res.nights} noche{res.nights!==1?'s':''}</p></div>
                </div>
                <div className="flex gap-3 bg-gray-800 rounded-xl p-3.5">
                  <DollarSign className="w-4 h-4 text-violet-400 shrink-0 mt-0.5"/>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Total a pagar</p>
                    <div className="flex justify-between items-center">
                      <p className="text-base font-bold">${grandTotal} USD</p>
                      {extrasTotal>0 && <p className="text-xs text-gray-500">Hab. ${res.amount} + Extras ${extrasTotal}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab==='extras' && (
              <div className="space-y-4">
                {myExtras.length>0 ? (
                  <div className="space-y-2">
                    {myExtras.map(e=>(
                      <div key={e.instanceId} className="flex items-center justify-between bg-gray-800 rounded-xl px-3.5 py-2.5">
                        <div><p className="text-sm font-medium">{e.name}</p>
                          <p className="text-xs text-gray-400">x{e.quantity} · ${e.unitPrice} c/u</p></div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400">${e.total}</span>
                          <button onClick={()=>removeExtra(e.instanceId)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between bg-violet-900/20 border border-violet-700/30 rounded-xl px-3.5 py-2.5">
                      <span className="text-sm text-gray-300">Subtotal extras</span>
                      <span className="font-bold text-violet-300">${extrasTotal} USD</span>
                    </div>
                  </div>
                ) : <p className="text-sm text-gray-500 text-center py-4">Sin extras agregados</p>}

                <button onClick={()=>setShowCatalog(p=>!p)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 py-2.5 rounded-xl text-sm transition-colors">
                  <Plus className="w-4 h-4"/>{showCatalog?'Cerrar catálogo':'Agregar extra'}
                </button>

                {showCatalog && (
                  <div className="space-y-3">
                    {/* FIX [M-02] Category badges with counts */}
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={()=>setCatFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${catFilter==='all'?'bg-violet-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
                        Todos ({totalAll})
                      </button>
                      {(Object.entries(catLabel) as [ExtraCategory,string][]).map(([c,l])=>(
                        <button key={c} onClick={()=>setCatFilter(c)}
                          className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${catFilter===c?'bg-violet-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
                          {l} ({catCounts[c]??0})
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {filteredCatalog.map(item=>(
                        <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-3.5 py-2.5">
                          <span className="text-lg">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">${item.price} USD</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-gray-700 rounded-lg">
                              <button onClick={()=>setQty(p=>({...p,[item.id]:Math.max(1,(p[item.id]??1)-1)}))} className="px-2 py-1 text-sm hover:text-white">−</button>
                              <span className="px-1 text-sm min-w-[1.5rem] text-center">{qty[item.id]??1}</span>
                              <button onClick={()=>setQty(p=>({...p,[item.id]:(p[item.id]??1)+1}))} className="px-2 py-1 text-sm hover:text-white">+</button>
                            </div>
                            <button onClick={()=>handleAddExtra(item.id,item.name,item.price)}
                              className="bg-violet-600 hover:bg-violet-500 p-1.5 rounded-lg transition-colors">
                              <Plus className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions — FIX [C-03] [U-02] all destructive actions have confirmation */}
          <div className="p-4 border-t border-gray-800 space-y-2 shrink-0">
            {(res.status==='pending'||res.status==='confirmed') && (
              <button onClick={()=>ask('Realizar Check-in',`¿Confirmar check-in de ${res.guest} en hab. ${res.room}?`,()=>checkIn(res.id),'warning')}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <LogIn className="w-4 h-4"/> Realizar Check-in
              </button>
            )}
            {res.status==='pending' && (
              <button onClick={()=>ask('Confirmar reserva',`¿Confirmar la reserva de ${res.guest}?`,()=>updateResStatus(res.id,'confirmed'),'warning')}
                className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 py-2.5 rounded-xl text-sm font-medium transition-colors">
                ✓ Confirmar Reserva
              </button>
            )}
            {res.status==='checked-in' && (
              <>
                <button onClick={()=>setShowPayment(true)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <LogOut className="w-4 h-4"/> Cobrar y hacer Check-out · ${grandTotal} USD
                </button>
                <button onClick={()=>{updateResStatus(res.id,'confirmed');setSelectedGuest({...res,status:'confirmed'})}}
                  className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 py-2 rounded-xl text-sm font-medium transition-colors">
                  <RotateCcw className="w-4 h-4"/> Revertir a Confirmada
                </button>
              </>
            )}
            {/* FIX [U-02] Cancel always asks confirmation */}
            {['pending','confirmed','checked-in'].includes(res.status) && (
              <button onClick={()=>ask('Cancelar Reserva',`¿Seguro que deseas cancelar la reserva de ${res.guest} en hab. ${res.room}? Esta acción no se puede deshacer.`,()=>cancelReservation(res.id),'danger')}
                className="w-full flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 py-2 rounded-xl text-sm font-medium text-red-300 transition-colors">
                <XCircle className="w-4 h-4"/> Cancelar Reserva
              </button>
            )}
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          reservationId={res.id}
          guest={res.guest}
          room={res.room}
          roomAmount={res.amount}
          extrasAmount={extrasTotal}
          onSuccess={() => { checkOut(res.id); setShowPayment(false) }}
          onClose={() => setShowPayment(false)}
        />
      )}
      {/* FIX [C-03] AlertDialog */}
      {confirm && (
        <AlertDialog open={confirm.open} title={confirm.title} description={confirm.desc}
          variant={confirm.variant} confirmLabel="Sí, confirmar" cancelLabel="No, volver"
          onConfirm={()=>{confirm.action();setConfirm(null)}}
          onCancel={()=>setConfirm(null)} />
      )}
    </>
  )
}
