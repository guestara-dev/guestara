'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  Room, Reservation, ResStatus, ReservationExtra,
  GuestProfile, AuditEntry, CashClosing, Payment,
  rooms as initRooms, reservations as initRes,
} from './data'
export interface NewRes {
  guest: string; roomNumber: string
  checkIn: string; checkOut: string; nights: number; amount: number
}
export interface CloseCajaPayload {
  notes: string
  roomsTotal: number; extrasTotal: number; grandTotal: number
  checkoutsCount: number; checkinsCount: number; newReservations: number
}
interface StoreCtx {
  rooms: Room[]; reservations: Reservation[]
  extras: ReservationExtra[]; auditLog: AuditEntry[]
  cashClosings: CashClosing[]; payments: Payment[]
  guestProfiles: Record<string, GuestProfile>
  hotelLogo: string | null
  setHotelLogo: (logo: string | null) => void
  selectedGuest: Reservation | null
  selectedRoomNumber: string | null
  setSelectedGuest: (r: Reservation | null) => void
  setSelectedRoomNumber: (n: string | null) => void
  addReservation: (d: NewRes) => void
  updateRoomStatus: (roomNum: string, status: Room['status']) => void
  updateRoom: (roomNum: string, patch: Partial<Room>) => void
  setRooms: (rooms: Room[]) => void
  updateResStatus: (id: number, status: ResStatus) => void
  checkIn: (id: number) => void
  checkOut: (id: number) => void
  cancelReservation: (id: number) => void
  addExtra: (reservationId: number, extraId: number, name: string, price: number, qty: number, note?: string) => void
  removeExtra: (instanceId: number) => void
  getExtrasForReservation: (reservationId: number) => ReservationExtra[]
  updateGuestProfile: (name: string, profile: Partial<GuestProfile>) => void
  closeCaja: (payload: CloseCajaPayload) => void
  recordPayment: (p: Payment) => void
  resetDashboard: () => void
}
const STORE_VERSION = 'guestara_v11'
function initLS() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem('_ver') !== STORE_VERSION) {
    ['rooms','reservations','extras','profiles','audit','cashClosings','payments']
    .forEach(k => localStorage.removeItem(`g_${k}`))
    localStorage.setItem('_ver', STORE_VERSION)
  }
}
function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(`g_${key}`); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function saveLS<T>(key: string, val: T) {
  try { localStorage.setItem(`g_${key}`, JSON.stringify(val)) } catch {}
}
const Ctx = createContext<StoreCtx | null>(null)
export function StoreProvider({ children }: { children: ReactNode }) {
  ;(() => initLS())()
  const [rooms, setRoomsRaw] = useState<Room[]>(() => loadLS('rooms', initRooms))
  const [reservations, setResRaw] = useState<Reservation[]>(() => loadLS('reservations', initRes))
  const [extras, setExtrasRaw] = useState<ReservationExtra[]>(() => loadLS('extras', []))
  const [auditLog, setAuditRaw] = useState<AuditEntry[]>(() => loadLS('audit', []))
  const [cashClosings, setCashClosingsRaw] = useState<CashClosing[]>(() => loadLS('cashClosings', []))
  const [payments, setPaymentsRaw] = useState<Payment[]>(() => loadLS('payments', []))
  const [guestProfiles, setProfilesRaw] = useState<Record<string,GuestProfile>>(() => loadLS('profiles', {}))
  const [hotelLogo, setHotelLogoRaw] = useState<string | null>(() => loadLS('hotelLogo', null))
  const [selectedGuest, setSelectedGuest] = useState<Reservation | null>(null)
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null)
  const setRooms = useCallback((fn: Room[] | ((p: Room[]) => Room[])) => {
    setRoomsRaw(p => { const n = typeof fn==='function'?fn(p):fn; saveLS('rooms',n); return n })
  }, [])
  const setReservations = useCallback((fn: Reservation[] | ((p: Reservation[]) => Reservation[])) => {
    setResRaw(p => { const n = typeof fn==='function'?fn(p):fn; saveLS('reservations',n); return n })
  }, [])
  const setExtras = useCallback((fn: ReservationExtra[] | ((p: ReservationExtra[]) => ReservationExtra[])) => {
    setExtrasRaw(p => { const n = typeof fn==='function'?fn(p):fn; saveLS('extras',n); return n })
  }, [])
  const setCashClosings = useCallback((fn: CashClosing[] | ((p: CashClosing[]) => CashClosing[])) => {
    setCashClosingsRaw(p => { const n = typeof fn==='function'?fn(p):fn; saveLS('cashClosings',n); return n })
  }, [])
  const setPayments = useCallback((fn: Payment[] | ((p: Payment[]) => Payment[])) => {
    setPaymentsRaw(p => { const n = typeof fn==='function'?fn(p):fn; saveLS('payments',n); return n })
  }, [])
  const audit = useCallback((action: string, detail: string) => {
    const entry: AuditEntry = {
      id: Date.now(), action, detail,
      user: 'Recepcionista',
      timestamp: new Date().toLocaleString('es-CL'),
    }
    setAuditRaw(p => { const n = [entry,...p].slice(0,100); saveLS('audit',n); return n })
  }, [])
  const setRoomStatus = useCallback((roomNum: string, status: Room['status']) => {
    setRooms(p => p.map(r => r.number===roomNum ? {...r, status} : r))
  }, [setRooms])
  const updateRoomStatus = setRoomStatus
  const updateRoom = useCallback((roomNum: string, patch: Partial<Room>) => {
    setRooms(p => p.map(r => r.number===roomNum ? {...r, ...patch} : r))
    audit('Habitación editada', `Hab. ${roomNum} actualizada`)
  }, [setRooms, audit])
  const updateResStatus = useCallback((id: number, status: ResStatus) => {
    setReservations(p => p.map(r => r.id===id ? {...r, status} : r))
  }, [setReservations])
  const addReservation = useCallback((d: NewRes) => {
    const newRes: Reservation = {
      id: Date.now(), guest: d.guest, room: d.roomNumber,
      checkIn: d.checkIn, checkOut: d.checkOut,
      status: 'confirmed', amount: d.amount, nights: d.nights,
    }
    setReservations(p => [newRes, ...p])
    audit('Nueva reserva', `${d.guest} — Hab. ${d.roomNumber} (${d.checkIn}→${d.checkOut})`)
  }, [setReservations, audit])
  const checkIn = useCallback((id: number) => {
    setResRaw(curr => {
      const res = curr.find(r => r.id===id)
      const updated = curr.map(r => r.id===id ? {...r, status:'checked-in' as ResStatus} : r)
      saveLS('reservations', updated)
      if (res) {
        setRoomStatus(res.room, 'occupied')
        setSelectedGuest({...res, status:'checked-in'})
        audit('Check-in', `${res.guest} — Hab. ${res.room}`)
      }
      return updated
    })
  }, [setResRaw, setRoomStatus, audit])
  const checkOut = useCallback((id: number) => {
    setResRaw(curr => {
      const res = curr.find(r => r.id===id)
      const updated = curr.map(r => r.id===id ? {...r, status:'completed' as ResStatus} : r)
      saveLS('reservations', updated)
      if (res) {
        setRoomStatus(res.room, 'cleaning')
        setSelectedGuest(null)
        audit('Check-out', `${res.guest} — Hab. ${res.room}`)
      }
      return updated
    })
  }, [setResRaw, setRoomStatus, audit])
  const cancelReservation = useCallback((id: number) => {
    setResRaw(curr => {
      const res = curr.find(r => r.id===id)
      const updated = curr.map(r => r.id===id ? {...r, status:'cancelled' as ResStatus} : r)
      saveLS('reservations', updated)
      if (res) {
        if (['checked-in','confirmed','pending'].includes(res.status)) setRoomStatus(res.room, 'available')
        setSelectedGuest(null)
        audit('Cancelación', `${res.guest} — Hab. ${res.room}`)
      }
      return updated
    })
  }, [setResRaw, setRoomStatus, audit])
  const addExtra = useCallback((reservationId: number, extraId: number, name: string, price: number, qty: number, note?: string) => {
    const e: ReservationExtra = {
      instanceId: Date.now(), reservationId, extraId, name,
      quantity: qty, unitPrice: price, total: price * qty, note,
    }
    setExtras(p => [...p, e])
    setResRaw(curr => {
      const res = curr.find(r => r.id===reservationId)
      if (res) audit('Extra agregado', `${name} x${qty} — ${res.guest}`)
      return curr
    })
  }, [setExtras, setResRaw, audit])
  const removeExtra = useCallback((instanceId: number) =>
    setExtras(p => p.filter(e => e.instanceId !== instanceId)), [setExtras])
  const getExtrasForReservation = useCallback((id: number) =>
    extras.filter(e => e.reservationId === id), [extras])
  const updateGuestProfile = useCallback((name: string, profile: Partial<GuestProfile>) => {
    setProfilesRaw(p => {
      const n = {...p, [name]: {...p[name], ...profile, name}}
      saveLS('profiles', n); return n
    })
  }, [])
  const recordPayment = useCallback((p: Payment) => {
    setPayments(prev => [p, ...prev])
    audit('Pago registrado', `$${p.totalAmount} — ${p.guest} · ${p.method}${p.authCode ? ` · Auth: ${p.authCode}` : ''}`)
  }, [setPayments, audit])
  const closeCaja = useCallback((payload: CloseCajaPayload) => {
    const closing: CashClosing = {
      id: Date.now(),
      date: new Date().toLocaleDateString('es-CL'),
      closedAt: new Date().toLocaleTimeString('es-CL'),
      user: 'Recepcionista',
      checkoutsCount: payload.checkoutsCount,
      checkinsCount: payload.checkinsCount,
      newReservations: payload.newReservations,
      roomsTotal: payload.roomsTotal,
      extrasTotal: payload.extrasTotal,
      grandTotal: payload.grandTotal,
      notes: payload.notes,
    }
    setCashClosings(p => [closing, ...p])
    audit('Cierre de caja', `Total: $${payload.grandTotal.toLocaleString()}`)
  }, [setCashClosings, audit])
  const resetDashboard = useCallback(() => {
    const freshRooms = initRooms.map(r => ({...r, status: 'available' as Room['status']}))
    setRooms(freshRooms)
    setReservations([])
    setExtras([])
    setPayments([])
    setCashClosings([])
    setAuditRaw([])
    saveLS('audit', [])
    audit('Reset', 'Dashboard limpiado — todos los datos borrados')
  }, [setRooms, setReservations, setExtras, setPayments, setCashClosings, audit])
  const setHotelLogo = useCallback((logo: string | null) => {
    setHotelLogoRaw(logo)
    saveLS('hotelLogo', logo)
  }, [])
  return (
    <Ctx.Provider value={{
      rooms, reservations, extras, auditLog,
      cashClosings, payments, guestProfiles,
      selectedGuest, selectedRoomNumber,
      setSelectedGuest, setSelectedRoomNumber,
      addReservation, updateRoomStatus, updateRoom, setRooms, updateResStatus,
      checkIn, checkOut, cancelReservation,
      addExtra, removeExtra, getExtrasForReservation,
      updateGuestProfile, closeCaja, recordPayment,
      resetDashboard,
      hotelLogo, setHotelLogo,
    }}>
      {children}
    </Ctx.Provider>
  )
}
export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore fuera del StoreProvider')
  return ctx
}
