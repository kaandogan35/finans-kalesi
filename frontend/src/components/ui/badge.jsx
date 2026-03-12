/**
 * Badge — Shadcn-uyumlu rozet/etiket bileşeni
 * Durum rozetleri için: portföyde, tahsil edildi, bekliyor, vb.
 */

import { cn } from '../../lib/utils'

const varyantlar = {
  default:   'bg-slate-100 text-slate-600 border border-slate-200',
  primary:   'bg-indigo-50 text-indigo-700 border border-indigo-200',
  success:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning:   'bg-amber-50 text-amber-700 border border-amber-200',
  danger:    'bg-red-50 text-red-700 border border-red-200',
  info:      'bg-blue-50 text-blue-700 border border-blue-200',
}

export function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold',
        varyantlar[variant] || varyantlar.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Durum → varyant eşlemesi (CekSenet, OdemeTakip, vb. modüllerde kullanılır)
export const durumVaryanti = {
  portfoyde:       'info',
  tahsile_verildi: 'warning',
  tahsil_edildi:   'success',
  karsiliksiz:     'danger',
  bekliyor:        'warning',
  tamamlandi:      'success',
  iptal:           'default',
  aktif:           'success',
  pasif:           'default',
}

export const durumEtiket = {
  portfoyde:       'Portföyde',
  tahsile_verildi: 'Tahsile Verildi',
  tahsil_edildi:   'Tahsil Edildi',
  karsiliksiz:     'Karşılıksız',
  bekliyor:        'Bekliyor',
  tamamlandi:      'Tamamlandı',
  iptal:           'İptal',
  aktif:           'Aktif',
  pasif:           'Pasif',
}

// Kullanım kolaylığı: <DurumBadge durum="portfoyde" />
export function DurumBadge({ durum, className }) {
  const variant = durumVaryanti[durum] || 'default'
  const etiket  = durumEtiket[durum]   || durum
  return (
    <Badge variant={variant} className={className}>
      {etiket}
    </Badge>
  )
}
