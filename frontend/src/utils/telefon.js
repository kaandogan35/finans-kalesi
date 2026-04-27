/**
 * Türk cep telefonu formatı: 0XXX XXX XXXX (11 rakam, 4+3+4 dağılım, 2 boşluk)
 * Önceki 4+3+2+2 (3 boşluk) bazı dar input'lara sığmıyordu — son rakam kesiliyordu.
 * 4+3+4 hem standart Türkçe yazım hem 1 karakter daha kısa, garantili sığar.
 */
export function formatTelefon(deger) {
  const ham = telefonHam(deger)
  const len = ham.length
  if (len === 0) return ''
  if (len <= 4) return ham
  if (len <= 7) return ham.slice(0, 4) + ' ' + ham.slice(4)
  return ham.slice(0, 4) + ' ' + ham.slice(4, 7) + ' ' + ham.slice(7, 11)
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
