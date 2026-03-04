// FIX [A-01] Standardized room numbering: Floor+2-digit (101-110, 201-210, 301-310)
// FIX [C-06] Fixed invalid date 29/02/2026 → 01/03/2026
export type RoomStatus   = 'available' | 'occupied' | 'cleaning' | 'maintenance'
export type RoomType     = 'single' | 'double'
export type ResStatus    = 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled'
export type ExtraCategory = 'food' | 'drink' | 'service' | 'transport' | 'other'

export interface Room {
  id: number; number: string; floor: number
  type: RoomType; status: RoomStatus; price: number
  name?: string; enabled: boolean
}
export interface Reservation {
  id: number; guest: string; room: string
  checkIn: string; checkOut: string
  status: ResStatus; amount: number; nights: number
}
export interface ExtraCatalogItem {
  id: number; name: string; category: ExtraCategory; price: number; icon: string
}
export interface ReservationExtra {
  instanceId: number; reservationId: number; extraId: number
  name: string; quantity: number; unitPrice: number; total: number; note?: string
}
export interface GuestProfile {
  name: string; email?: string; phone?: string; document?: string; notes?: string
}
export interface AuditEntry {
  id: number; action: string; detail: string; user: string; timestamp: string
}

// FIX [A-01] [A-03/A-04] 30 rooms: floors 1-3, rooms X01-X05 single, X06-X10 double
const buildRooms = (): Room[] => {
  const r: Room[] = []
  let id = 1
  for (let f = 1; f <= 3; f++) {
    for (let i = 1; i <= 5; i++)
      r.push({ id: id++, number: `${f}0${i}`, floor: f, type:'single', status:'available', price:89, enabled:true })
    for (let i = 1; i <= 5; i++) {
      const n = (i + 5).toString().padStart(2,'0')
      r.push({ id: id++, number: `${f}${n}`,  floor: f, type:'double', status:'available', price:129, enabled:true })
    }
  }
  return r
}
export const rooms: Room[] = (() => {
  const r = buildRooms()
  const setS = (num: string, s: RoomStatus) => { const x = r.find(rm=>rm.number===num); if(x) x.status=s }
  setS('101','occupied'); setS('102','occupied'); setS('103','cleaning')
  setS('106','occupied'); setS('107','maintenance')
  setS('201','occupied'); setS('202','occupied')
  setS('206','occupied')
  setS('301','occupied')
  return r
})()

// FIX [C-06] No more 29/02/2026
export const reservations: Reservation[] = [
  { id:1, guest:'María González',  room:'101', checkIn:'28/02', checkOut:'01/03', status:'checked-in', amount:89,  nights:1 },
  { id:2, guest:'Carlos Ruiz',     room:'102', checkIn:'28/02', checkOut:'02/03', status:'checked-in', amount:267, nights:3 },
  { id:3, guest:'Ana López',       room:'106', checkIn:'28/02', checkOut:'01/03', status:'checked-in', amount:129, nights:1 },
  { id:4, guest:'Lucía Morales',   room:'107', checkIn:'28/02', checkOut:'01/03', status:'pending',    amount:129, nights:1 },
  { id:5, guest:'Roberto Silva',   room:'201', checkIn:'26/02', checkOut:'03/03', status:'checked-in', amount:903, nights:7 },
  { id:6, guest:'Pedro Martínez',  room:'202', checkIn:'28/02', checkOut:'03/03', status:'confirmed',  amount:645, nights:5 },
  { id:7, guest:'Valentina Ríos',  room:'206', checkIn:'27/02', checkOut:'01/03', status:'checked-in', amount:258, nights:2 },
  { id:8, guest:'Diego Castro',    room:'301', checkIn:'28/02', checkOut:'02/03', status:'confirmed',  amount:356, nights:4 },
]
export const extrasCatalog: ExtraCatalogItem[] = [
  { id:1,  name:'Desayuno continental', category:'food',      price:15, icon:'🥐'  },
  { id:2,  name:'Cena romántica',       category:'food',      price:65, icon:'🍽️' },
  { id:3,  name:'Torta de cumpleaños',  category:'food',      price:35, icon:'🎂'  },
  { id:4,  name:'Botella de vino',      category:'drink',     price:35, icon:'🍷'  },
  { id:5,  name:'Champagne',            category:'drink',     price:55, icon:'🥂'  },
  { id:6,  name:'Mini bar premium',     category:'drink',     price:40, icon:'🥃'  },
  { id:7,  name:'Servicio de spa',      category:'service',   price:80, icon:'💆'  },
  { id:8,  name:'Late check-out',       category:'service',   price:30, icon:'⏰'  },
  { id:9,  name:'Servicio de cama',     category:'service',   price:20, icon:'🛏️' },
  { id:10, name:'Transfer aeropuerto',  category:'transport', price:45, icon:'🚗'  },
  { id:11, name:'Flores en habitación', category:'other',     price:25, icon:'💐'  },
  { id:12, name:'Decoración romántica', category:'other',     price:45, icon:'❤️'  },
]
export interface CashClosing {
  id: number; date: string; closedAt: string; user: string
  checkoutsCount: number; checkinsCount: number; newReservations: number
  roomsTotal: number; extrasTotal: number; grandTotal: number; notes: string
}
export interface Payment {
  id: number; reservationId: number; guest: string; room: string
  roomAmount: number; extrasAmount: number; totalAmount: number
  method: 'card_credit' | 'card_debit' | 'cash' | 'pos'
  cardLast4?: string; cardType?: 'visa' | 'mastercard' | 'amex' | 'redcompra'
  authCode?: string; status: 'approved' | 'rejected'
  date: string; time: string; boletaNum?: string
}
