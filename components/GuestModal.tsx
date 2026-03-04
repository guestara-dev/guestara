'use client'
import { useState } from 'react'
import { X, BedDouble, Calendar, DollarSign, LogIn, LogOut, XCircle, RotateCcw, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useStore } from '@/lib/store'
import { extrasCatalog, ExtraCategory } from '@/lib/data'
import AlertDialog from './AlertDialog'
import PaymentModal from './PaymentModal'

const statusCfg: Record<string,{label:string;cls:string}> = {
  'pending': {label:'Pendiente', cls:'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'confirmed': {label:'Confirmada', cls:'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'},
  'checked-in': {label:'En Casa', cls:'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'completed': {label:'Completada', cls:'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  'cancelled': {label:'Cancelada', cls:'bg-red-500/20 text-red-400 border-red-500/30' },
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
  
  const [tab, setTab] = useState<'info'|'extras'>('info')
  const [showCatalog, setShowCatalog] = useState(false)
  const [qty, setQty] = useState<Record<number,number>>({})
  const [catFilter, setCatFilter] = useState<ExtraCategory|'all'>('all')
  const [confirm, setConfirm] = useState<Confirm|null>(null)
  const [showPayment, setShowPayment] = useState(false)

  if (!selectedGuest) return null

  const res = reservations.find(r=>r.id===selectedGuest.id) ?? selectedGuest
  const room = rooms.find(rm=>rm.number===res.room)
  const s = statusCfg[res.status] ?? statusCfg['confirmed']
  const myExtras = getExtrasForReservation(res.id)
  const extrasTotal = myExtras.reduce((sum,e)=>sum+e.total, 0)
  const grandTotal = res.amount + extrasTotal

  const catCounts = extrasCatalog.reduce((acc,item) => {
    acc[item.category] = (acc[item.category]??0)+1; return acc
  }, {} as Record<ExtraCategory,number>)

  const filteredCatalog = catFilter==='all' ? extrasCatalog : extrasCatalog.filter(e=>e.category===catFilter)
  const totalAll = extrasCatalog.length

  const handleAddExtra = (extraId:number, name:string, price:number) => {
    addExtra(res.id, extraId, name, price, qty[extraId]??1)
    setQty(p=>({...p,[extraId]:1}))
  }

  const handleClose = () => {
    setSelectedGuest(null)
    setTab('info')
    setShowCatalog(false)
  }

  const ask = (title:string, desc:string, action:()=>void, variant:'danger'|'warning'='warning') =>
    setConfirm({ open:true, title, desc, action, variant })

  return (
    <>
      {/* Backdrop with click-to-close */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
        onClick={handleClose}
      >
        {/* Modal content with stopPropagation */}
        <div 
          className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col" 
          style={{maxHeight:'88vh'}}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-800 shrink-0">
            <div>
              <h2 className="text-lg font-semibold">{res.guest}</h2>
              <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full border mt-1 ${s.cls}`}>{s.label}</span>
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5"/>
            </button>
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
                    {myExtras.length>0 && <span className="bg-violet-600 text-[10px] px-1.5 py-0.5 rounded-full">{myExtras.length}</span>}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
            {tab==='info' && (
              <div className="space-y-3">
                <div className="flex gap-3 bg-gray-800/50 border border-gray-800 rounded-xl p-4">
                  <BedDouble className="w-4 h-4 text-violet-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500">Habitación</p>
                    <p className="text-sm font-semibold">{res.room} · {room ? (room.name || typeLabel[room.type] || room.type) : ''} · ${room?.price??0}/noche</p>
                  </div>
                </div>
                <div className="flex gap-3 bg-gray-800/50 border border-gray-800 rounded-xl p-4">
                  <Calendar className="w-4 h-4 text-violet-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500">Estadía</p>
                    <p className="text-sm font-semibold">{res.checkIn} → {res.checkOut} · {res.nights} noche{res.nights!==1?'s':''}</p>
                  </div>
                </div>
                <div className="flex gap-3 bg-violet-600/10 border border-violet-500/20 rounded-xl p-4">
                  <DollarSign className="w-4 h-4 text-violet-400 shrink-0 mt-0.5"/>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-violet-400/70">Total acumulado</p>
                    <div className="flex justify-between items-baseline mt-1">
                      <p className="text-xl font-bold text-white">${grandTotal} USD</p>
                      {extrasTotal > 0 && <p className="text-[10px] text-gray-500">Hab: ${res.amount} + Ext: ${extrasTotal}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab==='extras' && (
              <div className="space-y-4">
                {myExtras.length > 0 ? (
                  <div className="space-y-2">
                    {myExtras.map(e=>(
                      <div key={e.instanceId} className="flex items-center justify-between bg-gray-800/50 border border-gray-800 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{e.name}</p>
                          <p className="text-xs text-gray-500">x{e.quantity} · ${e.unitPrice} c/u</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-emerald-400 text-sm">${e.total}</span>
                          <button onClick={()=>removeExtra(e.instanceId)} className="text-gray-600 hover:text-red-400 p-1">
                            <Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-500 text-center py-6 italic">No se han registrado consumos extras aún</p>}
                
                <button onClick={()=>setShowCatalog(p=>!p)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-700 py-3 rounded-xl text-xs font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5"/>{showCatalog ? 'Ocultar catálogo' : 'Añadir nuevo consumo'}
                </button>

                {showCatalog && (
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={()=>setCatFilter('all')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${catFilter==='all'?'bg-violet-600 text-white':'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                        Todos ({totalAll})
                      </button>
                      {(Object.entries(catLabel) as [ExtraCategory,string][]).map(([c,l])=>(
                        <button key={c} onClick={()=>setCatFilter(c)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${catFilter===c?'bg-violet-600 text-white':'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                          {l} ({catCounts[c]??0})
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {filteredCatalog.map(item=>(
                        <div key={item.id} className="flex items-center gap-3 bg-gray-800/40 border border-gray-800 rounded-xl px-3 py-2">
                          <span className="text-xl bg-gray-900 w-10 h-10 flex items-center justify-center rounded-lg">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-200 truncate">{item.name}</p>
                            <p className="text-[10px] font-bold text-emerald-500">${item.price} USD</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5 border border-gray-700">
                              <button onClick={()=>setQty(p=>({...p,[item.id]:Math.max(1,(p[item.id]??1)-1)}))} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white">−</button>
                              <span className="text-[10px] font-bold min-w-[1rem] text-center">{qty[item.id]??1}</span>
                              <button onClick={()=>setQty(p=>({...p,[item.id]:(p[item.id]??1)+1}))} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white">+</button>
                            </div>
                            <button onClick={()=>handleAddExtra(item.id,item.name,item.price)}
                              className="bg-violet-600 hover:bg-violet-500 p-2 rounded-lg transition-colors shadow-lg">
                              <Plus className="w-4 h-4 text-white"/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-800 space-y-2 shrink-0 bg-gray-900/50">
            {(res.status==='pending'||res.status==='confirmed') && (
              <button onClick={()=>ask('Realizar Check-in',`¿Confirmar check-in de ${res.guest} en hab. ${res.room}?`,()=>checkIn(res.id),'warning')}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg">
                <LogIn className="w-4 h-4"/> Realizar Check-in
              </button>
            )}
            {res.status==='pending' && (
              <button onClick={()=>ask('Confirmar reserva',`¿Confirmar la reserva de ${res.guest}?`,()=>updateResStatus(res.id,'confirmed'),'warning')}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 py-3 rounded-xl text-sm font-semibold transition-all">
                ✓ Confirmar Reserva
              </button>
            )}
            {res.status==='checked-in' && (
              <>
                <button onClick={()=>setShowPayment(true)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg">
                  <LogOut className="w-4 h-4"/> Cobrar y Check-out · ${grandTotal}
                </button>
                <button onClick={()=>{updateResStatus(res.id,'confirmed');setSelectedGuest({...res,status:'confirmed'})}}
                  className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 py-2 rounded-xl text-xs font-medium transition-all">
                  <RotateCcw className="w-3.5 h-3.5"/> Revertir a Confirmada
                </button>
              </>
            )}
            {['pending','confirmed','checked-in'].includes(res.status) && (
              <button onClick={()=>ask('Cancelar Reserva',`¿Seguro que deseas cancelar la reserva de ${res.guest} en hab. ${res.room}? Esta acción no se puede deshacer.`,()=>cancelReservation(res.id),'danger')}
                className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all">
                <XCircle className="w-3.5 h-3.5"/> Cancelar Reserva
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

      {confirm && (
        <AlertDialog open={confirm.open} title={confirm.title} description={confirm.desc}
          variant={confirm.variant} confirmLabel="Sí, confirmar" cancelLabel="No, volver"
          onConfirm={()=>{confirm.action();setConfirm(null)}}
          onCancel={()=>setConfirm(null)} />
      )}
    </>
  )
}
