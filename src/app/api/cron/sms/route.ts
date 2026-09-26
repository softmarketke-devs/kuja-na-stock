import type { NextRequest } from 'next/server'
import { runSweep } from '@/lib/cron'

// Retries failed SMS. Also usable from an external scheduler more often than
// Vercel Hobby's once-a-day cron allows.
export function GET(request: NextRequest) {
  return runSweep(request, null)
}
