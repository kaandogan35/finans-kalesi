/**
 * kasaUtils.js — Kasa modülü ortak sabitler ve yardımcı fonksiyonlar
 * Tüm kasa sekmeleri (Gösterge, Bilanço, Ortak, Yatırım) bu dosyayı kullanır.
 */

// ─── Para Biçimlendirme ─────────────────────────────────────────────────────
export const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

// ─── Tarih Yardımcıları ─────────────────────────────────────────────────────
export const tarihFmt = (s) => (s ? new Date(s).toLocaleDateString('tr-TR') : '—')
export const bugunTarih = () => new Date().toISOString().split('T')[0]

// ─── Para Input Biçimlendirme ───────────────────────────────────────────────
export const formatParaInput = (value) => {
  let v = value.replace(/[^0-9,]/g, '')
  const parts = v.split(',')
  if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = v.split(',')
  const formatted = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? formatted + ',' + kesir.slice(0, 2) : formatted
}
export const parseParaInput = (f) => parseFloat(String(f).replace(/\./g, '').replace(',', '.')) || 0

// ─── Tema Prefix Haritası ───────────────────────────────────────────────────
export const prefixMap = { paramgo: 'p' }

// ─── Renkler ────────────────────────────────────────────────────────────────
export const ORTAK_RENKLERI = ['#10B981', '#059669', '#3b82f6', '#7c3aed', '#0891b2', '#ef4444']

// ─── Aylar ──────────────────────────────────────────────────────────────────
export const AY_ADLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

// ─── Dönem Normalizasyonu — karşılaştırma ve sıralama için YYYY-MM'e çevirir
// Hem "03-2026" (eski MM-YYYY) hem "2026-03" (yeni YYYY-MM) desteklenir
export const donemNormalize = (d) => {
  if (!d) return ''
  const parts = d.split('-')
  if (parts[0].length === 4) return d               // Zaten YYYY-MM
  return `${parts[1]}-${parts[0]}`                  // MM-YYYY → YYYY-MM
}

// ─── Dönem Formatlayıcı — hem YYYY-MM hem MM-YYYY destekler ─────────────────
export const donemFmt = (d) => {
  if (!d) return '—'
  const parts = d.split('-')
  const [yil, ay] = parts[0].length === 4
    ? [parts[0], parts[1]]
    : [parts[1], parts[0]]
  return (AY_ADLARI[parseInt(ay) - 1]?.slice(0, 3) ?? '?') + ' ' + (yil?.slice(2) ?? '')
}
