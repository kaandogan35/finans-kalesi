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

/**
 * Sadece rakamları döndürür (11 karakter max).
 * Kullanıcı dostu normalleştirme:
 *   "+90 530 ..."  → "0530..."   (90 önekini at, başa 0 koy)
 *   "905 30 ..."   → "0530..."   (90 önekini at)
 *   "530 ..."      → "0530..."   (5 ile başlıyorsa başa 0 koy)
 *   "0530 ..."     → "0530..."   (zaten doğru)
 */
export function telefonHam(deger) {
  let sayilar = String(deger ?? '').replace(/\D/g, '')
  // Uluslararası önek: 90 ile başlıyorsa at, başına 0 koy
  if (sayilar.startsWith('90') && sayilar.length > 10) {
    sayilar = '0' + sayilar.slice(2)
  }
  // TR cep 5 ile başlıyorsa başa 0 koy
  else if (sayilar.length > 0 && sayilar[0] === '5') {
    sayilar = '0' + sayilar
  }
  return sayilar.slice(0, 11)
}

/** 11 rakamlı 05 ile başlayan geçerli mi? */
export function telefonGecerliMi(deger) {
  const ham = telefonHam(deger)
  return ham.length === 11 && ham.startsWith('0')
}
