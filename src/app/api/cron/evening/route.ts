import type { NextRequest } from 'next/server'
import { runSweep } from '@/lib/cron'

export function GET(request: NextRequest) {
  return runSweep(request, 'evening_sweep')
}
