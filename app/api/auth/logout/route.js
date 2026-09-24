import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' })
  response.cookies.set('admin_token', '', { maxAge: 0, path: '/' })
  return response
}
