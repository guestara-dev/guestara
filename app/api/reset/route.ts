import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST() {
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0')
    await pool.query('TRUNCATE TABLE reservation_extras')
    await pool.query('TRUNCATE TABLE payments')
    await pool.query('TRUNCATE TABLE cash_closings')
    await pool.query('TRUNCATE TABLE audit_log')
    await pool.query('DELETE FROM reservations')
    await pool.query('UPDATE rooms SET status = ?', ['available'])
    await pool.query('SET FOREIGN_KEY_CHECKS = 1')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
