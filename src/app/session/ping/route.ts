import { NextResponse } from 'next/server'

// The browser calls this while the person is active. The request itself is what matters: src/proxy.ts
// renews the idle clock for every request that passes through it.
export function POST() {
  return new NextResponse(null, { status: 204 })
}
