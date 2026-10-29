import { MessageCircle, Phone } from 'lucide-react'
import { BRAND_NAME, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '@/lib/brand'
import { secondaryButton } from './ui'

/** Call and WhatsApp buttons. Renders nothing until the numbers are set in the environment. */
export function ContactButtons({ className }: { className?: string }) {
  if (!SUPPORT_PHONE && !SUPPORT_WHATSAPP) return null
  const text = encodeURIComponent(`Hello ${BRAND_NAME}, I have a question.`)
  return (
    <div className={className ?? 'flex flex-wrap gap-2'}>
      {SUPPORT_WHATSAPP && (
        <a href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`} className={secondaryButton} rel="noopener">
          <MessageCircle className="w-4 h-4" /> WhatsApp us
        </a>
      )}
      {SUPPORT_PHONE && (
        <a href={`tel:+${SUPPORT_PHONE}`} className={secondaryButton}>
          <Phone className="w-4 h-4" /> Call us
        </a>
      )}
    </div>
  )
}
