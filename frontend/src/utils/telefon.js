/**
 * Türk cep telefonu formatı: 0XXX XXX XX XX (11 rakam)
 * Kullanıcı yazarken otomatik biçimlendirilir.
 */
export function formatTelefon(deger) {
  const sayilar = String(deger ?? '').replace(/\D/g, '').slice(0, 11)
  const len = sayilar.length
  if (len === 0) return ''
  if (len <= 4) return sayilar
  if (len <= 7) return sayilar.slice(0, 4) + ' ' + sayilar.slice(4)
  if (len <= 9) return sayilar.slice(0, 4) + ' ' + sayilar.slice(4, 7) + ' ' + sayilar.slice(7)
  return sayilar.slice(0, 4) + ' ' + sayilar.slice(4, 7) + ' ' + sayilar.slice(7, 9) + ' ' + sayilar.slice(9, 11)
}

/** Sadece rakamları döndürür (11 karakter max) — backend'e gönderilirken kullan. */
export function telefonHam(deger) {
  return String(deger ?? '').replace(/\D/g, '').slice(0, 11)
}

/** 11 rakamlı 05 ile başlayan geçerli mi? */
export function telefonGecerliMi(deger) {
  const ham = telefonHam(deger)
  return ham.length === 11 && ham.startsWith('0')
}
