/**
 * kasaUtils.js — Kasa modülü ortak sabitler ve yardımcı fonksiyonlar
 * Tüm kasa sekmeleri (Gösterge, Bilanço, Ortak, Yatırım) bu dosyayı kullanır.
 */

// ─── Para Biçimlendirme ─────────────────────────────────────────────────────
export const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

export const kTL = (n) => {
  const v = n ?? 0
  const decimals = Math.abs(v) >= 1_000_000 ? 2 : 0
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v)
}

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

// ─── Kategoriler ────────────────────────────────────────────────────────────
export const GIRIS_KAT = ['Günlük Çekmece Hasılatı', 'Açık Hesap', 'Havale / Çek Tahsil', 'POS İşlemi']
export const CIKIS_KAT = ['Tedarikçi / Toptancı Ödemesi', 'Personel, Vergi ve Sabit Giderler', 'Günlük İşletme Giderleri', 'Kredi Kartı ve Banka Kredisi Ödemeleri']

export const GIRIS_KAT_IKON = {
  'Günlük Çekmece Hasılatı': 'bi-cash-stack',
  'Açık Hesap':               'bi-person-lines-fill',
  'Havale / Çek Tahsil':      'bi-bank2',
  'POS İşlemi':               'bi-credit-card-2-front',
}
export const CIKIS_KAT_IKON = {
  'Tedarikçi / Toptancı Ödemesi':           'bi-truck',
  'Personel, Vergi ve Sabit Giderler':       'bi-people-fill',
  'Günlük İşletme Giderleri':               'bi-receipt',
  'Kredi Kartı ve Banka Kredisi Ödemeleri': 'bi-credit-card',
}

// ─── Sekmeler & Aylar ───────────────────────────────────────────────────────
export const SEKMELER = [
  { key: 'gosterge', label: 'Gösterge Paneli', icon: 'bi-speedometer2'     },
  { key: 'bilanco',  label: 'Aylık Bilanço',    icon: 'bi-bar-chart-line'   },
  { key: 'ortak',    label: 'Ortak Carisi',     icon: 'bi-people'           },
  { key: 'yatirim',  label: 'Yatırım Kalesi',   icon: 'bi-safe2'            },
]
export const AY_ADLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

// ─── Bağlantı Seçenekleri ───────────────────────────────────────────────────
export function baglantiSecenekleri(tur, kategori) {
  if (tur === 'giris') {
    if (kategori === 'Açık Hesap') return ['POS Cihazından Çekildi', 'Banka Havalesi']
    return []
  }
  const temel = ['Banka / Havale', 'Merkez Kasa', 'Günlük Çekmece Nakdi']
  if (kategori === 'Tedarikçi / Toptancı Ödemesi') return [...temel, 'Mail Order']
  return temel
}

// ─── Stil Yardımcıları ──────────────────────────────────────────────────────
export const ikonKutu   = (c, bg) => ({ width:42, height:42, borderRadius:14, background:bg || `${c}15`, display:'flex', alignItems:'center', justifyContent:'center' })
export const kartEtiket = (c)     => ({ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px' })

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

// ─── Ortak Hesaplama ────────────────────────────────────────────────────────
export function hesaplaOzet(hareketler, kapanislar = []) {
  const siraliKap = [...kapanislar].sort((a,b) => donemNormalize(a.donem).localeCompare(donemNormalize(b.donem)))
  const sonKapanis = siraliKap[siraliKap.length - 1] || null
  const oncekiAyBankaNakit = sonKapanis ? sonKapanis.banka_nakdi : 0
  const girisler = hareketler.filter(h => h.islem_tipi === 'giris')
  const cikislar  = hareketler.filter(h => h.islem_tipi === 'cikis')
  const mailOrderTutar = cikislar.filter(h => h.baglanti_turu === 'Mail Order').reduce((s, h) => s + (h.tutar ?? 0), 0)
  const toplamGiris = girisler.reduce((s, h) => s + (h.tutar ?? 0), 0) + mailOrderTutar
  const toplamCikis  = cikislar.reduce((s, h)  => s + (h.tutar ?? 0), 0)
  const bankaGiris  = girisler.filter(h => (h.baglanti_turu ?? '').startsWith('Banka')).reduce((s, h) => s + (h.tutar ?? 0), 0)
  const bankaCikis   = cikislar.filter(h => (h.baglanti_turu ?? '').startsWith('Banka')).reduce((s, h)  => s + (h.tutar ?? 0), 0)
  const bankaGuncel = oncekiAyBankaNakit + bankaGiris - bankaCikis
  const girisFark   = 0
  const cikisFark   = 0
  const girisDagilim = GIRIS_KAT.map(kat => ({ kat, tutar: girisler.filter(h => h.kategori === kat).reduce((s,h) => s+(h.tutar ?? 0), 0) }))
  const cikisDagilim  = CIKIS_KAT.map(kat  => ({ kat, tutar: cikislar.filter(h  => h.kategori === kat).reduce((s,h) => s+(h.tutar ?? 0), 0) }))
  const merkezGiris = girisler.filter(h => h.baglanti_turu === 'Merkez Kasa').reduce((s,h) => s+(h.tutar ?? 0), 0)
  const merkezCikis = cikislar.filter(h => h.baglanti_turu === 'Merkez Kasa').reduce((s,h) => s+(h.tutar ?? 0), 0)
  const merkezKasa = merkezGiris - merkezCikis
  return { toplamGiris, toplamCikis, bankaGuncel, oncekiAyBankaNakit, girisFark, cikisFark, girisDagilim, cikisDagilim, merkezKasa }
}
