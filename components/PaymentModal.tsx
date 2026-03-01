'use client'
// Integración Transbank WebpayPlus — MODO TEST
// Tarjetas oficiales: https://www.transbankdevelopers.cl
import { useState, useEffect } from 'react'
import { X, CreditCard, Banknote, Wifi, CheckCircle, XCircle, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Payment } from '@/lib/data'

// BUG #7 FIX: correct card detection — 4051... is VISA not Redcompra
function detectCard(raw: string): 'visa' | 'mastercard' | 'amex' | 'redcompra' | null {
  const n = raw.replace(/\s/g,'')
  if (n.length < 1) return null
  if (/^3[47]/.test(n)) return 'amex'
  if (/^5[1-5]/.test(n)) return 'mastercard'
  // Redcompra BINs (Banco Santander Chile): 4754, 4035, 4175 specifically
  if (/^(4754|4035|4175)/.test(n)) return 'redcompra'
  if (/^4/.test(n)) return 'visa'     // all other 4xxx = VISA
  return null
}

function fmtCardNum(v: string) {
  return v.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ')
}
function fmtExpiry(v: string) {
  const d = v.replace(/\D/g,'').slice(0,4)
  return d.length > 2 ? d.slice(0,2)+'/'+d.slice(2) : d
}
function genCode(len=6) { return Math.random().toString(36).slice(2,2+len).toUpperCase() }

type Method = 'card_credit'|'card_debit'|'cash'|'pos'
type Step   = 'form'|'processing'|'success'|'rejected'

interface Props {
  reservationId:number; guest:string; room:string
  roomAmount:number; extrasAmount:number
  onSuccess:()=>void; onClose:()=>void
}

export default function PaymentModal({reservationId,guest,room,roomAmount,extrasAmount,onSuccess,onClose}:Props){
  const { recordPayment } = useStore()
  const total = roomAmount + extrasAmount

  const [method,    setMethod]    = useState<Method>('card_credit')
  const [step,      setStep]      = useState<Step>('form')
  const [cardNum,   setCardNum]   = useState('')
  const [expiry,    setExpiry]    = useState('')
  const [cvv,       setCvv]       = useState('')
  const [holder,    setHolder]    = useState('')
  const [showCvv,   setShowCvv]   = useState(false)
  const [posStatus, setPosStatus] = useState<'idle'|'connecting'|'ready'|'error'>('idle')
  const [result,    setResult]    = useState<Payment|null>(null)
  const [copied,    setCopied]    = useState('')

  const raw      = cardNum.replace(/\s/g,'')
  const cardType = detectCard(raw)

  // BUG #2 FIX: explicit, simple validations
  const cardValid   = raw.length === 16
  const expiryValid = /^\d{2}\/\d{2}$/.test(expiry)
  const cvvValid    = cvv.length >= 3               // BUG #2: was failing due to closure issue
  const holderValid = holder.trim().length >= 3

  const isCardMethod = method === 'card_credit' || method === 'card_debit'
  const canPay =
    method === 'cash' ? true :
    method === 'pos'  ? posStatus === 'ready' :
    cardValid && expiryValid && cvvValid && holderValid

  // Load Transbank POS SDK
  useEffect(() => {
    if (method !== 'pos') return
    setPosStatus('connecting')
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/transbank-pos-sdk-web-js@latest/dist/pos.js'
    s.async = true
    s.onload  = () => setTimeout(() => setPosStatus('error'), 1500)
    s.onerror = () => setPosStatus('error')
    document.body.appendChild(s)
    return () => { try{document.body.removeChild(s)}catch{} }
  }, [method])

  const process = () => {
    if (!canPay) return
    setStep('processing')
    setTimeout(() => {
      const approved = method === 'cash' || raw !== '5186059559590568'
      const p: Payment = {
        id: Date.now(), reservationId, guest, room,
        roomAmount, extrasAmount, totalAmount: total,
        method, cardLast4: raw.slice(-4) || undefined,
        cardType: cardType ?? undefined,
        authCode: approved ? genCode() : undefined,
        status: approved ? 'approved' : 'rejected',
        date: new Date().toLocaleDateString('es-CL'),
        time: new Date().toLocaleTimeString('es-CL'),
        boletaNum: approved ? `F-${genCode(8)}` : undefined,
      }
      setResult(p)
      setStep(approved ? 'success' : 'rejected')
      if (approved) { recordPayment(p); setTimeout(onSuccess, 2000) }
    }, method === 'cash' ? 700 : 2200)
  }

  const copyTestCard = (num: string, label: string) => {
    navigator.clipboard.writeText(num).catch(()=>{})
    setCardNum(fmtCardNum(num))
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  const cardBadge: Record<string,string> = { visa:'🔵 VISA', mastercard:'🔴 MC', amex:'🟡 AMEX', redcompra:'🟠 RC' }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Cobro</h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">MODO TEST</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{guest} — Hab. {room}</p>
          </div>
          {step==='form' && <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white"/></button>}
        </div>

        {/* Total banner */}
        <div className="bg-gray-800/60 px-5 py-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Total</p>
            {extrasAmount>0 && <p className="text-[10px] text-gray-500">Hab. ${roomAmount} + Extras ${extrasAmount}</p>}
          </div>
          <p className="text-3xl font-extrabold">${total} <span className="text-sm text-gray-400">USD</span></p>
        </div>

        {/* FORM */}
        {step==='form' && (
          <div className="p-5 space-y-4">
            {/* Method */}
            <div className="grid grid-cols-3 gap-2">
              {([
                {id:'card_credit', icon:<CreditCard className="w-4 h-4"/>, label:'Crédito'},
                {id:'card_debit',  icon:<CreditCard className="w-4 h-4"/>, label:'Débito'},
                {id:'cash',        icon:<Banknote   className="w-4 h-4"/>, label:'Efectivo'},
              ] as const).map(m=>(
                <button key={m.id} type="button" onClick={()=>setMethod(m.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${method===m.id?'bg-violet-600 border-violet-500 text-white':'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>

            {isCardMethod && (
              <div className="space-y-3">
                {/* Test cards */}
                <div className="bg-amber-950/40 border border-amber-600/30 rounded-xl p-3">
                  <p className="flex items-center gap-1.5 text-xs text-amber-300 font-medium mb-2">
                    <AlertTriangle className="w-3.5 h-3.5"/>Tarjetas de prueba Transbank
                  </p>
                  {[
                    {num:'4051885600446623', label:'VISA', result:'✅ Aprobada'},
                    {num:'5186059559590568', label:'MC',   result:'❌ Rechazada'},
                  ].map(c=>(
                    <div key={c.num} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-2.5 py-1.5 mb-1 last:mb-0">
                      <div>
                        <p className="text-[10px] font-mono text-gray-300">{c.num.replace(/(\d{4})/g,'$1 ').trim()}</p>
                        <p className="text-[9px] text-gray-500">{c.label} · CVV: 123 · Venc: 12/26 · {c.result}</p>
                      </div>
                      <button onClick={()=>copyTestCard(c.num, c.label)}
                        className="text-gray-500 hover:text-violet-400 transition-colors ml-2">
                        {copied===c.label ? <span className="text-[9px] text-violet-400">✓</span> : <Copy className="w-3 h-3"/>}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Card number */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Número de tarjeta</label>
                  <div className="relative">
                    <input value={cardNum} onChange={e=>setCardNum(fmtCardNum(e.target.value))}
                      placeholder="0000 0000 0000 0000" maxLength={19}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 pr-20 text-sm font-mono focus:outline-none focus:border-violet-500"/>
                    {cardType && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">
                        {cardBadge[cardType]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Holder */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Nombre en la tarjeta</label>
                  <input value={holder} onChange={e=>setHolder(e.target.value.toUpperCase())}
                    placeholder="JUAN PEREZ"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:border-violet-500"/>
                </div>

                {/* Expiry + CVV — BUG #2 FIX */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Vencimiento</label>
                    <input value={expiry} onChange={e=>setExpiry(fmtExpiry(e.target.value))}
                      placeholder="MM/AA" maxLength={5}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-violet-500"/>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">CVV</label>
                    <div className="relative">
                      <input
                        type={showCvv ? 'text' : 'password'}
                        value={cvv}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g,'').slice(0,4)
                          setCvv(val)
                        }}
                        placeholder="•••"
                        maxLength={4}
                        autoComplete="off"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 pr-9 text-sm font-mono focus:outline-none focus:border-violet-500"/>
                      <button type="button" onClick={()=>setShowCvv(p=>!p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        {showCvv ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation feedback */}
                <div className="flex gap-3 text-[10px]">
                  <span className={cardValid ? 'text-emerald-400' : 'text-gray-600'}>✓ 16 dígitos</span>
                  <span className={expiryValid ? 'text-emerald-400' : 'text-gray-600'}>✓ Vencimiento</span>
                  <span className={cvvValid ? 'text-emerald-400' : 'text-gray-600'}>✓ CVV</span>
                  <span className={holderValid ? 'text-emerald-400' : 'text-gray-600'}>✓ Nombre</span>
                </div>
              </div>
            )}

            {method==='cash' && (
              <div className="bg-emerald-950/30 border border-emerald-700/30 rounded-xl p-5 text-center">
                <Banknote className="w-10 h-10 text-emerald-400 mx-auto mb-2"/>
                <p className="font-semibold text-emerald-300">Pago en efectivo</p>
                <p className="text-sm text-gray-400 mt-1">Monto: <strong className="text-white">${total} USD</strong></p>
              </div>
            )}

            {method==='pos' && (
              <div className="bg-blue-950/30 border border-blue-700/30 rounded-xl p-4 text-center space-y-3">
                <Wifi className={`w-8 h-8 mx-auto ${posStatus==='connecting'?'text-blue-400 animate-pulse':posStatus==='error'?'text-red-400':'text-emerald-400'}`}/>
                <p className="text-sm font-semibold">
                  {posStatus==='connecting'&&'Buscando terminal POS...'}
                  {posStatus==='ready'&&'✅ Terminal conectada'}
                  {posStatus==='error'&&'Terminal no detectada'}
                </p>
                {posStatus==='error'&&(
                  <button onClick={()=>setMethod('card_credit')} className="text-xs text-violet-400 underline">
                    Usar tarjeta manual
                  </button>
                )}
              </div>
            )}

            <button onClick={process} disabled={!canPay}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${canPay?'bg-emerald-600 hover:bg-emerald-500 text-white':'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
              {method==='cash' ? `Confirmar cobro $${total} USD` : `Procesar pago $${total} USD`}
            </button>
          </div>
        )}

        {step==='processing'&&(
          <div className="p-10 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"/>
            <p className="font-semibold">Procesando{method!=='cash'?' con Transbank':''}...</p>
          </div>
        )}

        {step==='success'&&result&&(
          <div className="p-6 text-center space-y-4">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto"/>
            <div>
              <p className="text-xl font-bold text-emerald-400">¡Pago aprobado!</p>
              <p className="text-gray-400 text-sm mt-1">${total} USD</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Autorización</span><span className="font-mono font-bold">{result.authCode}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Boleta N°</span><span className="text-violet-300 font-mono">{result.boletaNum}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Método</span><span className="capitalize">{result.method.replace('_',' ')}{result.cardLast4?` ****${result.cardLast4}`:''}</span></div>
              <div className="flex justify-between border-t border-gray-700 pt-2"><span className="font-medium">Total</span><span className="font-bold text-emerald-400">${result.totalAmount} USD</span></div>
            </div>
            <p className="text-xs text-gray-500">Cerrando...</p>
          </div>
        )}

        {step==='rejected'&&(
          <div className="p-6 text-center space-y-4">
            <XCircle className="w-14 h-14 text-red-400 mx-auto"/>
            <div>
              <p className="text-xl font-bold text-red-400">Pago rechazado</p>
              <p className="text-gray-400 text-sm mt-1">Transbank no autorizó la transacción</p>
            </div>
            <div className="bg-red-950/30 border border-red-700/30 rounded-xl p-3 text-xs text-gray-400">
              Tarjeta MASTERCARD de prueba siempre rechazada. Usa VISA para aprobar.
            </div>
            <button onClick={()=>{setStep('form');setCardNum('');setCvv('');setExpiry('');setHolder('')}}
              className="w-full bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
