/**
 * useSinirler — Kullanım sınırı durumunu çeker.
 *
 * Dönüş:
 *   sinirler   — API'den gelen durum objesi (null = henüz yüklenmedi)
 *   yukleniyor — boolean
 *   uyariDurum — (tur) => null | 'uyari' (%80+) | 'dolu' (%100+)
 *   yenidenYukle — manuel yenileme
 */

import { useState, useEffect, useCallback } from 'react'
import { sinirApi } from '../api/sinir'
import useAuthStore from '../stores/authStore'

export function useSinirler() {
  const { girisYapildi } = useAuthStore()
  const [sinirler, setSinirler] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    if (!girisYapildi) { setYukleniyor(false); return }
    try {
      const res = await sinirApi.durum()
      setSinirler(res.data.veri)
    } catch {
      // sessiz — sinir bilgisi opsiyonel
    } finally {
      setYukleniyor(false)
    }
  }, [girisYapildi])

  useEffect(() => { yukle() }, [yukle])

  /**
   * uyariDurum('cari')      → null | 'uyari' | 'dolu'
   * uyariDurum('cek_aylik') → null | 'uyari' | 'dolu'
   */
  const uyariDurum = (tur) => {
    if (!sinirler) return null
    const bilgi = sinirler[tur]
    if (!bilgi || bilgi.sinirsiz) return null
    if (bilgi.yuzde >= 100) return 'dolu'
    if (bilgi.yuzde >= 80)  return 'uyari'
    return null
  }

  return { sinirler, yukleniyor, uyariDurum, yenidenYukle: yukle }
}
