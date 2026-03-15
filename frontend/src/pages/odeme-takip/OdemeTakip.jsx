import { useState, useEffect, useMemo } from 'react'

/* ═══════════════════════════════════════════════════════════════
   YARDIMCI FONKSİYONLAR
   ═══════════════════════════════════════════════════════════════ */

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)

const tarihStr = (t) => {
  if (!t) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(t + 'T00:00:00'))
}

const gunFarki = (t) => {
  if (!t) return null
  const b = new Date(); b.setHours(0, 0, 0, 0)
  return Math.floor((new Date(t + 'T00:00:00') - b) / 86400000)
}

const bugunStr = (offset = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

/* ═══════════════════════════════════════════════════════════════
   SABİTLER
   ═══════════════════════════════════════════════════════════════ */

const ONCELIK_META = {
  kritik: { bg: '#fdf1f1', color: '#b41c1c', label: 'Kritik' },   // bankacı kırmızı
  yuksek: { bg: '#fffbeb', color: '#d97706', label: 'Yüksek' },
  normal: { bg: '#ebf3ff', color: '#3034ff', label: 'Normal' },
  dusuk:  { bg: '#f6f7fb', color: '#697586', label: 'Düşük' },
}

// ikas-tasarim.md: success=#0a6e52/#e8f5ef, danger=#b41c1c/#fdf1f1
const ARAMA_DURUM_META = {
  aranmadi:  { label: 'Aranmadı',   bg: '#fffbeb', color: '#d97706', icon: 'bi-telephone' },
  cevap_yok: { label: 'Cevap Yok',  bg: '#fdf1f1', color: '#b41c1c', icon: 'bi-telephone-x' },
  soz_alindi:{ label: 'Söz Alındı', bg: '#ebf3ff', color: '#3034ff', icon: 'bi-check2' },
  tamamlandi:{ label: 'Tamamlandı', bg: '#e8f5ef', color: '#0a6e52', icon: 'bi-check-circle-fill' },
}

const ARAMA_SECENEKLERI = [
  { id: 'cevap_yok',  emoji: '📵', label: 'Cevap Vermedi' },
  { id: 'soz_alindi', emoji: '💬', label: 'Görüştüm — Söz Verdi' },
  { id: 'tamamlandi', emoji: '✅', label: 'Ödedi / Tahsil Ettim' },
  { id: 'ertelendi',  emoji: '⏰', label: 'Ertele (Tarih Seç)' },
]

const ONCELIK_SIRA = { kritik: 0, yuksek: 1, normal: 2, dusuk: 3 }

/* ═══════════════════════════════════════════════════════════════
   MOCK VERİ — Gerçek API bağlantısı hazır olduğunda kaldırılacak
   GET /api/odemeler?yon=tahsilat&sadece_gecmis=0
   GET /api/odemeler/ozet
   ═══════════════════════════════════════════════════════════════ */

const MOCK_ODEMELER = [
  {
    id: 1, firma_adi: 'Demir-Çelik San. A.Ş.', cari_ad: 'Ahmet Yılmaz',
    telefon: '0532 123 4567', tutar: 87500, vade_tarihi: bugunStr(-1),
    oncelik: 'kritik', yon: 'tahsilat', durum: 'bekliyor',
    arama_durumu: 'aranmadi', son_arama_tarihi: null, son_not: null, arama_gecmisi: [],
  },
  {
    id: 2, firma_adi: 'Hırdavat Merkezi Ltd.', cari_ad: 'Mehmet Kaya',
    telefon: '0555 987 6543', tutar: 34250, vade_tarihi: bugunStr(0),
    oncelik: 'yuksek', yon: 'tahsilat', durum: 'bekliyor',
    arama_durumu: 'cevap_yok', son_arama_tarihi: bugunStr(0),
    son_not: 'Telefonu açmadı, SMS attım',
    arama_gecmisi: [{ tarih: bugunStr(0), sonuc: 'cevap_yok', not: 'Telefonu açmadı, SMS attım' }],
  },
  {
    id: 3, firma_adi: 'İnşaat Malz. Co.', cari_ad: 'Fatma Demir',
    telefon: '0543 456 7890', tutar: 52000, vade_tarihi: bugunStr(2),
    oncelik: 'yuksek', yon: 'tahsilat', durum: 'bekliyor',
    arama_durumu: 'soz_alindi', son_arama_tarihi: bugunStr(-1),
    son_not: 'Hafta sonuna kadar yatırır dedi',
    arama_gecmisi: [
      { tarih: bugunStr(-1), sonuc: 'soz_alindi', not: 'Hafta sonuna kadar yatırır dedi' },
      { tarih: bugunStr(-3), sonuc: 'cevap_yok', not: '' },
    ],
  },
  {
    id: 4, firma_adi: 'Yapı Malz. Tic.', cari_ad: 'Ali Şahin',
    telefon: '0530 222 3344', tutar: 18750, vade_tarihi: bugunStr(5),
    oncelik: 'normal', yon: 'tahsilat', durum: 'bekliyor',
    arama_durumu: 'aranmadi', son_arama_tarihi: null, son_not: null, arama_gecmisi: [],
  },
  {
    id: 5, firma_adi: 'Çelik Konstr. A.Ş.', cari_ad: 'Zeynep Aydın',
    telefon: '0542 111 2233', tutar: 145000, vade_tarihi: bugunStr(-5),
    oncelik: 'kritik', yon: 'tahsilat', durum: 'bekliyor',
    arama_durumu: 'cevap_yok', son_arama_tarihi: bugunStr(-2),
    son_not: 'Muhasebe ile görüşeceğiz dedi',
    arama_gecmisi: [
      { tarih: bugunStr(-2), sonuc: 'cevap_yok', not: 'Muhasebe ile görüşeceğiz dedi' },
      { tarih: bugunStr(-4), sonuc: 'cevap_yok', not: '' },
    ],
  },
  {
    id: 6, firma_adi: 'Genel Ticaret Ltd.', cari_ad: 'Hasan Çelik',
    telefon: '0532 444 5566', tutar: 28000, vade_tarihi: bugunStr(7),
    oncelik: 'dusuk', yon: 'tahsilat', durum: 'bekliyor',
    arama_durumu: 'aranmadi', son_arama_tarihi: null, son_not: null, arama_gecmisi: [],
  },
  {
    id: 7, firma_adi: 'Elçi İnşaat', cari_ad: 'Selma Öztürk',
    telefon: '0555 333 7788', tutar: 67500, vade_tarihi: bugunStr(-7),
    oncelik: 'kritik', yon: 'tahsilat', durum: 'ertelendi',
    arama_durumu: 'soz_alindi', son_arama_tarihi: bugunStr(-1),
    son_not: "20 Mart'a erteledi, söz verdi",
    arama_gecmisi: [{ tarih: bugunStr(-1), sonuc: 'soz_alindi', not: "20 Mart'a erteledi, söz verdi" }],
  },
  {
    id: 8, firma_adi: 'Mert Yapı Malz.', cari_ad: 'Emre Yıldız',
    telefon: '0543 999 0011', tutar: 12400, vade_tarihi: bugunStr(10),
    oncelik: 'normal', yon: 'tahsilat', durum: 'tamamlandi',
    arama_durumu: 'tamamlandi', son_arama_tarihi: bugunStr(-1),
    son_not: 'Ödemeyi banka üzerinden yaptı',
    arama_gecmisi: [{ tarih: bugunStr(-1), sonuc: 'tamamlandi', not: 'Ödemeyi banka üzerinden yaptı' }],
  },
  {
    id: 9, firma_adi: 'Doğan Hırd. San.', cari_ad: 'Kadir Doğan',
    telefon: '0530 777 8899', tutar: 43200, vade_tarihi: bugunStr(1),
    oncelik: 'yuksek', yon: 'tahsilat', durum: 'bekliyor',
    arama_durumu: 'aranmadi', son_arama_tarihi: null, son_not: null, arama_gecmisi: [],
  },
  {
    id: 10, firma_adi: 'Akça Demir Çelik', cari_ad: 'Nurcan Akça',
    telefon: '0555 100 2030', tutar: 198000, vade_tarihi: bugunStr(3),
    oncelik: 'kritik', yon: 'tahsilat', durum: 'bekliyor',
    arama_durumu: 'soz_alindi', son_arama_tarihi: bugunStr(0),
    son_not: 'Genel müdür onayı bekleniyor',
    arama_gecmisi: [{ tarih: bugunStr(0), sonuc: 'soz_alindi', not: 'Genel müdür onayı bekleniyor' }],
  },
]

const MOCK_KPI = { bu_hafta_vadeli: 7, bekleyen_tutar: 686100, bu_hafta_aranan: 5, gecikmus: 3 }

/* ═══════════════════════════════════════════════════════════════
   STILLER — ikas-tasarim.md + tasarim-sistemi-v3.md uyumlu
   ═══════════════════════════════════════════════════════════════ */

const STILLER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* Animasyonlar */
  @keyframes odmFadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes odmSlideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  @keyframes odmSlideIn { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
  @keyframes odmSpinAnim  { to { transform: rotate(360deg) } }
  @keyframes odmPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(180,28,28,0.0) }
    50%       { box-shadow: 0 0 0 4px rgba(180,28,28,0.15) }
  }
  @keyframes odmBottomUp {
    from { transform: translateY(100%) }
    to   { transform: translateY(0) }
  }

  .odm-page {
    font-family: 'Inter', sans-serif;
    font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
    background: #f6f7fb;
    min-height: 100vh;
  }

  /* ─── KPI Grid ─── */
  .odm-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  @media (max-width: 991px) { .odm-kpi-grid { grid-template-columns: repeat(2, 1fr) } }
  @media (max-width: 480px)  { .odm-kpi-grid { grid-template-columns: 1fr } }

  .odm-kpi-kart {
    background: #ffffff;
    border: 1px solid #e3e8ef;
    border-radius: 10px;
    padding: 18px 20px;
    box-shadow: 0px 2px 1px 0px rgba(38,69,109,0.01), 0px 1px 1px 0px rgba(38,69,109,0.02);
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .odm-kpi-ikon {
    width: 44px; height: 44px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .odm-kpi-deger {
    font-size: 26px; font-weight: 700;
    letter-spacing: -0.52px;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 768px) { .odm-kpi-deger { font-size: 20px } }
  .odm-kpi-etiket { font-size: 12px; font-weight: 500; color: #697586; letter-spacing: -0.24px; margin-top: 3px }

  /* ─── Filtre Bar ─── */
  .odm-filtre-bar {
    background: #ffffff;
    border: 1px solid #e3e8ef;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .odm-arama-wrap { position: relative; flex: 1; min-width: 200px }
  .odm-arama-ikon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: #9aa4b2; font-size: 14px; pointer-events: none;
  }
  .odm-arama-input {
    width: 100%; padding: 10px 14px 10px 36px;
    border-radius: 8px; border: 1px solid #e3e8ef;
    background: #fff; color: #121926;
    font-size: 14px; font-family: 'Inter', sans-serif;
    min-height: 44px; outline: none; transition: border-color 200ms;
  }
  .odm-arama-input:focus { border-color: #3034ff; box-shadow: 0 0 0 2px rgba(48,52,255,0.2) }
  .odm-arama-input::placeholder { color: #9aa4b2 }

  /* ─── Tab ─── */
  .fk-tab-container {
    display: inline-flex; background: #eef2f6;
    border-radius: 10px; padding: 4px; overflow-x: auto; flex-shrink: 0;
  }
  .fk-tab {
    padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    color: #697586; background: transparent; border: none; cursor: pointer;
    min-height: 36px; transition: all 200ms; white-space: nowrap;
    font-family: 'Inter', sans-serif; letter-spacing: -0.26px;
  }
  .fk-tab:hover { color: #121926 }
  .fk-tab.active {
    background: #ffffff; color: #121926; font-weight: 600;
    box-shadow: 0px 2px 4px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04);
  }

  /* ─── Ek Filtre Paneli ─── */
  .odm-filtre-panel {
    background: #f6f7fb; border: 1px solid #e3e8ef;
    border-radius: 8px; padding: 16px; margin-bottom: 14px;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  }
  @media (max-width: 767px) { .odm-filtre-panel { grid-template-columns: 1fr } }
  .odm-filtre-label { font-size: 12px; font-weight: 500; color: #697586; margin-bottom: 6px }
  .odm-select {
    width: 100%; padding: 8px 12px; border-radius: 8px;
    border: 1px solid #e3e8ef; background: #fff; color: #121926;
    font-size: 14px; font-family: 'Inter', sans-serif;
    min-height: 40px; outline: none; cursor: pointer;
  }
  .odm-select:focus { border-color: #3034ff }
  .odm-date-input {
    width: 100%; padding: 8px 12px; border-radius: 8px;
    border: 1px solid #e3e8ef; background: #fff; color: #121926;
    font-size: 14px; font-family: 'Inter', sans-serif;
    min-height: 40px; outline: none;
  }
  .odm-date-input:focus { border-color: #3034ff }

  /* ─── Layout ─── */
  .odm-layout { display: flex; gap: 20px; align-items: flex-start }
  .odm-main   { flex: 1; min-width: 0 }

  /* ─── Tablo ─── */
  .odm-tablo-wrap { background: #ffffff; border: 1px solid #e3e8ef; border-radius: 10px; overflow: hidden }
  .fk-table { width: 100%; border-collapse: separate; border-spacing: 0 }
  .fk-table thead th {
    font-size: 11px; font-weight: 600; color: #9aa4b2;
    padding: 10px 14px; text-align: left; border-bottom: 1px solid #e3e8ef;
    background: #f6f7fb; white-space: nowrap; letter-spacing: -0.22px;
  }
  .fk-table tbody td {
    font-size: 13px; color: #121926; padding: 12px 14px;
    border-bottom: 1px solid #eef2f6; vertical-align: middle; letter-spacing: -0.26px;
  }
  .fk-table tbody tr { transition: background 200ms ease; cursor: pointer }
  .fk-table tbody tr:hover { background: #f6f7fb }
  .fk-table tbody tr:last-child td { border-bottom: none }
  .odm-td-border { width: 4px; padding: 0 !important; border-right: 1px solid #eef2f6 }

  /* ─── Eylem Butonları ─── */
  .odm-btn {
    width: 34px; height: 34px; border-radius: 7px; border: 1px solid #e3e8ef;
    background: #ffffff; display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; color: #697586; transition: all 200ms;
  }
  .odm-btn:hover { border-color: #cdd5df; color: #121926; background: #f6f7fb }
  .odm-btn.tel  { border-color: #bed2ff; background: #ebf3ff; color: #3034ff }
  .odm-btn.tel:hover { background: #3034ff; color: #fff; border-color: #3034ff }
  .odm-btn.ok   { border-color: #a7f0d2; background: #e8f5ef; color: #0a6e52 }
  .odm-btn.ok:hover { background: #0a6e52; color: #fff; border-color: #0a6e52 }

  /* ─── Badge ─── */
  .odm-badge {
    padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
    letter-spacing: -0.22px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
  }

  /* ─── Mobil Kart ─── */
  .odm-mobil-kart {
    background: #ffffff; border: 1px solid #e3e8ef; border-radius: 10px;
    padding: 14px 16px; margin-bottom: 10px; transition: all 200ms ease;
    cursor: pointer; border-left-width: 4px;
  }
  .odm-mobil-kart:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #cdd5df }
  .odm-mobil-kart:hover { border-left-color: inherit }

  /* ─── Kritik Pulse ─── */
  .odm-kritik-pulse { animation: odmPulse 2.5s ease-in-out infinite }

  /* ─── Sağ Drawer ─── */
  .odm-drawer {
    flex: 0 0 355px; width: 355px;
    background: #ffffff; border: 1px solid #e3e8ef; border-radius: 10px;
    overflow: hidden; animation: odmSlideIn 0.25s ease;
    position: sticky; top: 20px;
    max-height: calc(100vh - 40px); overflow-y: auto;
  }
  .odm-drawer-header {
    background: #14141a; color: #ffffff;
    padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 5;
  }
  .odm-drawer-body { padding: 20px }
  @media (max-width: 767px) {
    .odm-drawer {
      position: fixed; bottom: 0; left: 0; right: 0; width: 100%; flex: none;
      height: 85vh; border-radius: 16px 16px 0 0; z-index: 1500;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.12); animation: odmBottomUp 0.3s ease;
      top: auto; max-height: 85vh;
    }
  }
  .odm-drawer-overlay {
    display: none;
    position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1499;
  }
  @media (max-width: 767px) { .odm-drawer-overlay { display: block } }

  /* ─── Timeline ─── */
  .odm-timeline { list-style: none; padding: 0; margin: 0 }
  .odm-tl-item {
    display: flex; gap: 12px; padding-bottom: 16px; position: relative;
  }
  .odm-tl-item:not(:last-child)::before {
    content: ''; position: absolute; left: 15px; top: 32px; bottom: 0;
    width: 1px; background: #eef2f6;
  }
  .odm-tl-dot {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; flex-shrink: 0;
  }

  /* ─── Modal ─── */
  .fk-modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000; animation: odmFadeIn 0.2s ease;
  }
  .fk-modal {
    background: #ffffff; border-radius: 12px;
    max-width: 520px; width: 92%; max-height: 90vh;
    display: flex; flex-direction: column;
    box-shadow: 0px 24px 48px rgba(0,0,0,0.14), 0px 8px 16px rgba(0,0,0,0.08);
    animation: odmSlideUp 0.25s ease; overflow: hidden;
  }
  .fk-modal-header {
    background: #14141a; color: #ffffff;
    padding: 18px 24px; display: flex; align-items: center; justify-content: space-between;
  }
  .fk-modal-body  { padding: 24px; overflow-y: auto; flex: 1 }
  .fk-modal-footer {
    padding: 16px 24px; border-top: 1px solid #e3e8ef;
    display: flex; justify-content: flex-end; gap: 10px;
  }
  @media (max-width: 767px) {
    .fk-modal-backdrop { align-items: flex-end }
    .fk-modal { border-radius: 16px 16px 0 0; max-height: 85vh; width: 100%; max-width: 100% }
  }

  /* ─── Radio Kart (modal) ─── */
  .odm-radio-kart {
    border: 2px solid #e3e8ef; border-radius: 10px; padding: 13px 16px;
    cursor: pointer; transition: all 200ms; display: flex; align-items: center; gap: 12px;
    font-size: 14px; font-weight: 500; color: #121926; background: #ffffff;
    user-select: none;
  }
  .odm-radio-kart:hover { border-color: #bed2ff; background: #f8fbff }
  .odm-radio-kart.selected { border-color: #3034ff; background: #ebf3ff; color: #3034ff }

  /* ─── Genel Butonlar ─── */
  .fk-btn-primary {
    border: 1px solid #6e87ff; background: #3034ff; color: #ffffff;
    border-radius: 8px; font-size: 14px; font-weight: 600; padding: 10px 20px;
    cursor: pointer; transition: all 300ms; display: inline-flex; align-items: center;
    gap: 6px; min-height: 44px; font-family: 'Inter', sans-serif; letter-spacing: -0.28px;
    box-shadow: 0px -3px 2px 0px rgba(19,20,83,0.25) inset;
  }
  .fk-btn-primary:hover { background: #2020e2 }
  .fk-btn-secondary {
    border: 1px solid #e3e8ef; background: #ffffff; color: #121926;
    border-radius: 8px; font-size: 14px; font-weight: 600; padding: 10px 20px;
    cursor: pointer; transition: all 300ms; display: inline-flex; align-items: center;
    gap: 6px; min-height: 44px; font-family: 'Inter', sans-serif; letter-spacing: -0.28px;
    box-shadow: 0px -3px 1px 0px rgba(238,242,246,0.5) inset;
  }
  .fk-btn-secondary:hover { background: #f6f7fb; border-color: #cdd5df }

  /* ─── Kapat Butonu (beyaz bg üstünde) ─── */
  .odm-kapat-btn {
    width: 32px; height: 32px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.08); color: #ffffff; display: flex; align-items: center;
    justify-content: center; cursor: pointer; font-size: 16px; transition: background 200ms;
  }
  .odm-kapat-btn:hover { background: rgba(255,255,255,0.18) }

  /* ─── Input ─── */
  .fk-input {
    display: block; width: 100%; padding: 10px 14px;
    border-radius: 8px; border: 1px solid #e3e8ef;
    background: #fff; color: #121926;
    font-size: 14px; font-family: 'Inter', sans-serif;
    min-height: 44px; outline: none; transition: border-color 200ms;
  }
  .fk-input:focus { border-color: #3034ff; box-shadow: 0 0 0 2px rgba(48,52,255,0.2) }
  .fk-input::placeholder { color: #9aa4b2 }

  /* ─── Spinner ─── */
  .odm-spinner {
    width: 36px; height: 36px; border: 3px solid #e3e8ef;
    border-top-color: #3034ff; border-radius: 50%; animation: odmSpinAnim 0.8s linear infinite;
  }

  /* ─── Küçük yardımcı ─── */
  .odm-firma { font-weight: 600; font-size: 14px; color: #121926; letter-spacing: -0.28px }
  .odm-cari  { font-size: 12px; color: #697586; margin-top: 2px }
  .odm-aksiyon-grup { display: flex; align-items: center; gap: 6px }

  @media (max-width: 767px) {
    .odm-filtre-bar { gap: 10px }
    .odm-arama-wrap { min-width: 100%; order: -1 }
    .fk-tab-container { overflow-x: auto; max-width: 100% }
  }
`

/* ═══════════════════════════════════════════════════════════════
   YARDIMCI: Sol kenarlık rengi (vade durumuna göre)
   ═══════════════════════════════════════════════════════════════ */

function kenariRenk(tarih, durum) {
  if (durum === 'tamamlandi') return '#0a6e52'  // bankacı yeşil
  const fark = gunFarki(tarih)
  if (fark === null) return '#e3e8ef'
  if (fark < 0)  return '#b41c1c'  // gecikmiş — bankacı kırmızı
  if (fark === 0) return '#3034ff' // bugün
  if (fark <= 3)  return '#f59e0b' // yakın
  return '#e3e8ef'
}

function vadeBadge(tarih, durum) {
  if (durum === 'tamamlandi') return { text: 'Tamamlandı', bg: '#e8f5ef', color: '#0a6e52' }
  const fark = gunFarki(tarih)
  if (fark === null) return null
  if (fark === 0)  return { text: 'Bugün', bg: '#ebf3ff', color: '#3034ff' }
  if (fark > 0)   return { text: `${fark} gün kaldı`, bg: '#e8f5ef', color: '#0a6e52' }
  return { text: `${Math.abs(fark)} gün geçti`, bg: '#fdf1f1', color: '#b41c1c' }
}

function isPulse(k) {
  // Kritik + gecikmiş + hiç aranmamış → yanıp sönsün
  return k.oncelik === 'kritik' && gunFarki(k.vade_tarihi) < 0 && k.arama_durumu === 'aranmadi'
}

/* ═══════════════════════════════════════════════════════════════
   ANA BILEŞEN
   ═══════════════════════════════════════════════════════════════ */

export default function OdemeTakip() {
  const [liste, setListe] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifFiltre, setAktifFiltre] = useState('bu_hafta')
  const [aramaTerm, setAramaTerm] = useState('')
  const [debouncedArama, setDebouncedArama] = useState('')
  const [secilenKayitId, setSecilenKayitId] = useState(null)
  const [aramaModaliId, setAramaModaliId] = useState(null)
  const [kpiVerisi, setKpiVerisi] = useState(null)
  const [filtrePaneli, setFiltrePaneli] = useState(false)
  const [oncelikFiltre, setOncelikFiltre] = useState('')
  const [baslangicTarihi, setBaslangicTarihi] = useState('')
  const [bitisTarihi, setBitisTarihi] = useState('')
  const [menuAcikId, setMenuAcikId] = useState(null)

  // Arama modalı form state
  const [aramaSonucu, setAramaSonucu] = useState(null)
  const [aramaNotText, setAramaNotText] = useState('')
  const [hatirlaticiTarihi, setHatirlaticiTarihi] = useState('')

  // Seçili kayıt ve modal — listeden türetilir (her zaman güncel)
  const secilenKayit = useMemo(
    () => liste.find(k => k.id === secilenKayitId) || null,
    [liste, secilenKayitId]
  )
  const aramaModali = useMemo(
    () => liste.find(k => k.id === aramaModaliId) || null,
    [liste, aramaModaliId]
  )

  // ─── Veri Yükle ───────────────────────────────────────────────
  useEffect(() => {
    // Gerçek API: GET /api/odemeler?yon=tahsilat + GET /api/odemeler/ozet
    const timer = setTimeout(() => {
      setListe(MOCK_ODEMELER)
      setKpiVerisi(MOCK_KPI)
      setYukleniyor(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [])

  // ─── Debounce Arama ───────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedArama(aramaTerm), 300)
    return () => clearTimeout(t)
  }, [aramaTerm])

  // ─── ESC Kapatma ──────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Escape') return
      if (aramaModaliId) { setAramaModaliId(null); resetModal() }
      else if (menuAcikId) setMenuAcikId(null)
      else if (secilenKayitId) setSecilenKayitId(null)
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [aramaModaliId, menuAcikId, secilenKayitId])

  // ─── Body Scroll Lock (modal açıkken) ─────────────────────────
  useEffect(() => {
    document.body.style.overflow = aramaModaliId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aramaModaliId])

  // ─── Dışarı Tıklayınca Menüyü Kapat ──────────────────────────
  useEffect(() => {
    if (!menuAcikId) return
    const fn = () => setMenuAcikId(null)
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [menuAcikId])

  // ─── Filtre Mantığı ───────────────────────────────────────────
  const filtreliListe = useMemo(() => {
    let s = [...liste]

    // Tab filtresi
    if (aktifFiltre === 'bu_hafta') {
      // Mevcut haftanın Pazartesi'sinden Pazar'ına kadar
      const bugun = new Date(); bugun.setHours(0, 0, 0, 0)
      const gun = bugun.getDay()
      const pzt = new Date(bugun)
      pzt.setDate(bugun.getDate() - (gun === 0 ? 6 : gun - 1))
      const pzr = new Date(pzt); pzr.setDate(pzt.getDate() + 6); pzr.setHours(23, 59, 59, 999)
      s = s.filter(k => {
        const v = new Date(k.vade_tarihi + 'T00:00:00')
        return v >= pzt && v <= pzr
      })
    } else if (aktifFiltre === 'gecikmus') {
      const bugun = new Date(); bugun.setHours(0, 0, 0, 0)
      s = s.filter(k => new Date(k.vade_tarihi + 'T00:00:00') < bugun && k.durum !== 'tamamlandi')
    } else if (aktifFiltre === 'arandi') {
      s = s.filter(k => k.arama_durumu !== 'aranmadi')
    } else if (aktifFiltre === 'soz_alindi') {
      s = s.filter(k => k.arama_durumu === 'soz_alindi')
    }

    // Arama filtresi (debounced)
    if (debouncedArama.trim()) {
      const q = debouncedArama.toLowerCase()
      s = s.filter(k =>
        k.firma_adi.toLowerCase().includes(q) ||
        k.cari_ad.toLowerCase().includes(q) ||
        (k.telefon && k.telefon.includes(q))
      )
    }

    // Öncelik filtresi
    if (oncelikFiltre) s = s.filter(k => k.oncelik === oncelikFiltre)

    // Tarih aralığı filtresi
    if (baslangicTarihi) s = s.filter(k => k.vade_tarihi >= baslangicTarihi)
    if (bitisTarihi)     s = s.filter(k => k.vade_tarihi <= bitisTarihi)

    // Sıralama: öncelik (kritik→düşük) sonra vade tarihi (yakın önce)
    return s.sort((a, b) => {
      const d = ONCELIK_SIRA[a.oncelik] - ONCELIK_SIRA[b.oncelik]
      if (d !== 0) return d
      return a.vade_tarihi.localeCompare(b.vade_tarihi)
    })
  }, [liste, aktifFiltre, debouncedArama, oncelikFiltre, baslangicTarihi, bitisTarihi])

  // ─── Handlers ─────────────────────────────────────────────────

  const modalAc = (kayit) => {
    resetModal()
    setAramaModaliId(kayit.id)
  }

  const resetModal = () => {
    setAramaSonucu(null)
    setAramaNotText('')
    setHatirlaticiTarihi('')
  }

  const aramaKaydet = () => {
    if (!aramaSonucu || !aramaModaliId) return

    const yeniGecmis = {
      tarih: bugunStr(0),
      sonuc: aramaSonucu === 'ertelendi' ? 'soz_alindi' : aramaSonucu,
      not: aramaNotText,
    }

    const yeniAramaDurumu =
      aramaSonucu === 'tamamlandi' ? 'tamamlandi' :
      aramaSonucu === 'ertelendi'  ? 'soz_alindi' :
      aramaSonucu

    const yeniDurum =
      aramaSonucu === 'tamamlandi' ? 'tamamlandi' :
      aramaSonucu === 'ertelendi'  ? 'ertelendi'  :
      undefined // değişmez

    setListe(prev => prev.map(k => {
      if (k.id !== aramaModaliId) return k
      return {
        ...k,
        arama_durumu: yeniAramaDurumu,
        ...(yeniDurum ? { durum: yeniDurum } : {}),
        son_arama_tarihi: bugunStr(0),
        son_not: aramaNotText || null,
        arama_gecmisi: [yeniGecmis, ...k.arama_gecmisi],
      }
    }))

    setAramaModaliId(null)
    resetModal()
  }

  const tamamlaKayit = (id, e) => {
    e.stopPropagation()
    setListe(prev => prev.map(k =>
      k.id === id ? { ...k, durum: 'tamamlandi', arama_durumu: 'tamamlandi' } : k
    ))
  }

  /* ═══════════════════════════════════════════════════════════════
     KPI KARTALRI
     ═══════════════════════════════════════════════════════════════ */

  const KPI_TANIM = [
    {
      key: 'bu_hafta_vadeli',
      label: 'Bu Hafta Vadeli',
      icon: 'bi-calendar-week',
      iconBg: '#ebf3ff', iconColor: '#3034ff',
      format: (v) => v,
      numColor: '#3034ff',
    },
    {
      key: 'bekleyen_tutar',
      label: 'Toplam Bekleyen',
      icon: 'bi-hourglass-split',
      iconBg: '#fffbeb', iconColor: '#d97706',
      format: (v) => TL(v) + ' ₺',
      numColor: '#d97706',
    },
    {
      key: 'bu_hafta_aranan',
      label: 'Bu Hafta Aranan',
      icon: 'bi-telephone-outbound',
      iconBg: '#e8f5ef', iconColor: '#0a6e52',   // bankacı yeşil
      format: (v) => v,
      numColor: '#0a6e52',
    },
    {
      key: 'gecikmus',
      label: 'Gecikmiş (Kritik)',
      icon: 'bi-exclamation-triangle',
      iconBg: '#fdf1f1', iconColor: '#b41c1c',   // bankacı kırmızı
      format: (v) => v,
      numColor: '#b41c1c',
    },
  ]

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="odm-page">
      <style>{STILLER}</style>

      {/* ── Sayfa Başlığı ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#121926', margin: 0, letterSpacing: '-0.44px' }}>
            <i className="bi bi-credit-card-2-fill me-2" style={{ color: '#3034ff' }} />
            Tahsilat Takip
          </h1>
          <p style={{ fontSize: 13, color: '#697586', margin: '4px 0 0', letterSpacing: '-0.26px' }}>
            Bu hafta kimler aranacak? Söz alanlar takip edilir.
          </p>
        </div>
        <button className="fk-btn-primary" style={{ gap: 8 }}>
          <i className="bi bi-plus-lg" />
          Yeni Ekle
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────
          BÖLÜM 1 — KPI Bandı
          ───────────────────────────────────────────────────────── */}
      <div className="odm-kpi-grid">
        {KPI_TANIM.map(kpi => (
          <div key={kpi.key} className="odm-kpi-kart">
            <div className="odm-kpi-ikon" style={{ background: kpi.iconBg, color: kpi.iconColor }}>
              <i className={`bi ${kpi.icon}`} />
            </div>
            <div>
              <div className="odm-kpi-deger" style={{ color: kpi.numColor }}>
                {yukleniyor ? '—' : kpi.format(kpiVerisi?.[kpi.key] ?? 0)}
              </div>
              <div className="odm-kpi-etiket">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────
          BÖLÜM 2 — Filtre + Arama
          ───────────────────────────────────────────────────────── */}
      <div className="odm-filtre-bar">
        {/* Arama */}
        <div className="odm-arama-wrap">
          <i className="bi bi-search odm-arama-ikon" />
          <input
            className="odm-arama-input"
            placeholder="Firma adı, müşteri veya telefon..."
            value={aramaTerm}
            onChange={e => setAramaTerm(e.target.value)}
          />
        </div>

        {/* Tab Filtreleri */}
        <div className="fk-tab-container">
          {[
            { id: 'tumuu',     label: 'Tümü' },
            { id: 'bu_hafta', label: 'Bu Hafta' },
            { id: 'gecikmus', label: 'Gecikmiş' },
            { id: 'arandi',   label: 'Arandı' },
            { id: 'soz_alindi', label: 'Söz Alındı' },
          ].map(t => (
            <button
              key={t.id}
              className={`fk-tab${aktifFiltre === t.id ? ' active' : ''}`}
              onClick={() => setAktifFiltre(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Ek Filtre Butonu */}
        <button
          className="fk-btn-secondary"
          style={{ minHeight: 40, padding: '8px 14px', fontSize: 13 }}
          onClick={() => setFiltrePaneli(p => !p)}
        >
          <i className="bi bi-funnel" />
          {filtrePaneli ? 'Filtreleri Kapat' : 'Filtrele'}
        </button>
      </div>

      {/* Ek Filtre Collapse Paneli */}
      {filtrePaneli && (
        <div className="odm-filtre-panel">
          <div>
            <div className="odm-filtre-label">Öncelik</div>
            <select className="odm-select" value={oncelikFiltre} onChange={e => setOncelikFiltre(e.target.value)}>
              <option value="">Tüm Öncelikler</option>
              <option value="kritik">Kritik</option>
              <option value="yuksek">Yüksek</option>
              <option value="normal">Normal</option>
              <option value="dusuk">Düşük</option>
            </select>
          </div>
          <div>
            <div className="odm-filtre-label">Vade Başlangıç</div>
            <input
              type="date"
              className="odm-date-input"
              value={baslangicTarihi}
              onChange={e => setBaslangicTarihi(e.target.value)}
            />
          </div>
          <div>
            <div className="odm-filtre-label">Vade Bitiş</div>
            <input
              type="date"
              className="odm-date-input"
              value={bitisTarihi}
              onChange={e => setBitisTarihi(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          BÖLÜM 3 + 5 — Ana Liste + Sağ Drawer (yan yana)
          ───────────────────────────────────────────────────────── */}
      <div className="odm-layout">

        {/* ── Ana İçerik ── */}
        <div className="odm-main">
          {yukleniyor ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <div className="odm-spinner" />
            </div>

          ) : filtreliListe.length === 0 ? (
            /* Empty State */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: '40vh', textAlign: 'center', padding: 40,
              background: '#fff', borderRadius: 10, border: '1px solid #e3e8ef'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12, background: '#ebf3ff',
                border: '1px solid #bed2ff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 16
              }}>
                <i className="bi bi-inbox" style={{ fontSize: 24, color: '#3034ff' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#121926', marginBottom: 4 }}>
                Kayıt bulunamadı
              </h3>
              <p style={{ fontSize: 13, color: '#9aa4b2', margin: 0 }}>
                Bu filtreye uyan tahsilat kaydı yok.
              </p>
            </div>

          ) : (
            <>
              {/* ── Desktop Tablo (md ve üzeri) ── */}
              <div className="d-none d-md-block">
                <div className="odm-tablo-wrap">
                  <div className="table-responsive">
                    <table className="fk-table">
                      <thead>
                        <tr>
                          <th className="odm-td-border" />
                          <th>Firma / Müşteri</th>
                          <th>Tutar</th>
                          <th>Vade Tarihi</th>
                          <th>Öncelik</th>
                          <th>Arama Durumu</th>
                          <th style={{ width: 130 }}>İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtreliListe.map(k => {
                          const vb = vadeBadge(k.vade_tarihi, k.durum)
                          const ad = ARAMA_DURUM_META[k.arama_durumu] || ARAMA_DURUM_META.aranmadi
                          const om = ONCELIK_META[k.oncelik] || ONCELIK_META.normal
                          const kenari = kenariRenk(k.vade_tarihi, k.durum)
                          const pulse = isPulse(k)

                          return (
                            <tr
                              key={k.id}
                              className={pulse ? 'odm-kritik-pulse' : ''}
                              onClick={() => setSecilenKayitId(k.id === secilenKayitId ? null : k.id)}
                              style={secilenKayitId === k.id ? { background: '#f0f4ff' } : {}}
                            >
                              {/* Sol kenarlık rengi */}
                              <td className="odm-td-border" style={{ background: kenari }} />

                              {/* Firma */}
                              <td>
                                <div className="odm-firma">{k.firma_adi}</div>
                                <div className="odm-cari">{k.cari_ad}</div>
                              </td>

                              {/* Tutar — bankacı yeşil (tahsilat = alacak) */}
                              <td>
                                <span style={{
                                  color: k.durum === 'tamamlandi' ? '#0a6e52' : '#121926',
                                  fontWeight: 600, fontSize: 14, letterSpacing: '-0.28px',
                                  fontVariantNumeric: 'tabular-nums',
                                }}>
                                  {TL(k.tutar)} ₺
                                </span>
                              </td>

                              {/* Vade */}
                              <td>
                                <div style={{ fontSize: 13, color: '#121926' }}>{tarihStr(k.vade_tarihi)}</div>
                                {vb && (
                                  <span className="odm-badge" style={{ background: vb.bg, color: vb.color, marginTop: 3 }}>
                                    {vb.text}
                                  </span>
                                )}
                              </td>

                              {/* Öncelik */}
                              <td>
                                <span className="odm-badge" style={{ background: om.bg, color: om.color }}>
                                  {om.label}
                                </span>
                              </td>

                              {/* Arama Durumu */}
                              <td>
                                <span className="odm-badge" style={{ background: ad.bg, color: ad.color }}>
                                  <i className={`bi ${ad.icon}`} />
                                  {ad.label}
                                </span>
                                {k.son_not && (
                                  <div style={{ fontSize: 11, color: '#9aa4b2', marginTop: 3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {k.son_not}
                                  </div>
                                )}
                              </td>

                              {/* Aksiyonlar */}
                              <td onClick={e => e.stopPropagation()}>
                                <div className="odm-aksiyon-grup">
                                  {/* Aradım */}
                                  <button
                                    className="odm-btn tel"
                                    title="Arama Kaydı"
                                    onClick={() => modalAc(k)}
                                  >
                                    <i className="bi bi-telephone" />
                                  </button>

                                  {/* Tamamlandı */}
                                  {k.durum !== 'tamamlandi' && (
                                    <button
                                      className="odm-btn ok"
                                      title="Tahsil Edildi"
                                      onClick={(e) => tamamlaKayit(k.id, e)}
                                    >
                                      <i className="bi bi-check-circle" />
                                    </button>
                                  )}

                                  {/* Üç nokta menüsü */}
                                  <div style={{ position: 'relative' }}>
                                    <button
                                      className="odm-btn"
                                      title="Daha Fazla"
                                      onClick={(e) => { e.stopPropagation(); setMenuAcikId(menuAcikId === k.id ? null : k.id) }}
                                    >
                                      <i className="bi bi-three-dots-vertical" />
                                    </button>
                                    {menuAcikId === k.id && (
                                      <div style={{
                                        position: 'absolute', right: 0, top: 'calc(100% + 4px)',
                                        zIndex: 200, background: '#fff', border: '1px solid #e3e8ef',
                                        borderRadius: 8, padding: 4, minWidth: 140,
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                      }}>
                                        {[
                                          { icon: 'bi-pencil', label: 'Düzenle', color: '#121926' },
                                          { icon: 'bi-trash',  label: 'Sil',     color: '#b41c1c' },
                                        ].map(mi => (
                                          <button key={mi.label} style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            width: '100%', padding: '9px 12px', border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            fontSize: 13, color: mi.color, borderRadius: 6,
                                            fontFamily: 'Inter, sans-serif', fontWeight: 500,
                                          }}
                                          onMouseEnter={e => e.currentTarget.style.background = '#f6f7fb'}
                                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                          >
                                            <i className={`bi ${mi.icon}`} />
                                            {mi.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Mobil Kart Görünümü (md altı) ── */}
              <div className="d-md-none">
                {filtreliListe.map(k => {
                  const vb = vadeBadge(k.vade_tarihi, k.durum)
                  const ad = ARAMA_DURUM_META[k.arama_durumu] || ARAMA_DURUM_META.aranmadi
                  const om = ONCELIK_META[k.oncelik] || ONCELIK_META.normal
                  const kenari = kenariRenk(k.vade_tarihi, k.durum)
                  const pulse = isPulse(k)

                  return (
                    <div
                      key={k.id}
                      className={`odm-mobil-kart${pulse ? ' odm-kritik-pulse' : ''}`}
                      style={{ borderLeftColor: kenari }}
                      onClick={() => setSecilenKayitId(k.id === secilenKayitId ? null : k.id)}
                    >
                      {/* Üst satır: firma + tutar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div className="odm-firma">{k.firma_adi}</div>
                          <div className="odm-cari">{k.cari_ad}</div>
                        </div>
                        <div style={{
                          fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px',
                          color: k.durum === 'tamamlandi' ? '#0a6e52' : '#121926',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {TL(k.tutar)} ₺
                        </div>
                      </div>

                      {/* Badge satırı */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {vb && (
                          <span className="odm-badge" style={{ background: vb.bg, color: vb.color }}>{vb.text}</span>
                        )}
                        <span className="odm-badge" style={{ background: om.bg, color: om.color }}>{om.label}</span>
                        <span className="odm-badge" style={{ background: ad.bg, color: ad.color }}>
                          <i className={`bi ${ad.icon}`} />{ad.label}
                        </span>
                      </div>

                      {/* Aksiyon butonları */}
                      <div className="odm-aksiyon-grup" onClick={e => e.stopPropagation()}>
                        <button
                          className="odm-btn tel"
                          style={{ width: 40, height: 40 }}
                          onClick={() => modalAc(k)}
                        >
                          <i className="bi bi-telephone" />
                        </button>
                        {k.durum !== 'tamamlandi' && (
                          <button
                            className="odm-btn ok"
                            style={{ width: 40, height: 40 }}
                            onClick={(e) => tamamlaKayit(k.id, e)}
                          >
                            <i className="bi bi-check-circle" />
                          </button>
                        )}
                        <button className="odm-btn" style={{ width: 40, height: 40 }}>
                          <i className="bi bi-pencil" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────
            BÖLÜM 5 — Sağ Drawer (Detay Paneli)
            ───────────────────────────────────────────────────────── */}
        {secilenKayit && (
          <>
            {/* Mobil overlay */}
            <div className="odm-drawer-overlay" onClick={() => setSecilenKayitId(null)} />

            <div className="odm-drawer">
              {/* Drawer Header */}
              <div className="odm-drawer-header">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.28px' }}>
                    {secilenKayit.firma_adi}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                    {secilenKayit.cari_ad}
                  </div>
                </div>
                <button className="odm-kapat-btn" onClick={() => setSecilenKayitId(null)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="odm-drawer-body">
                {/* Bakiye Özeti */}
                <div style={{
                  background: '#f6f7fb', border: '1px solid #e3e8ef', borderRadius: 8,
                  padding: '14px 16px', marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, color: '#9aa4b2', marginBottom: 4 }}>Bekleyen Tutar</div>
                  <div style={{
                    fontSize: 24, fontWeight: 700, color: '#121926',
                    letterSpacing: '-0.48px', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {TL(secilenKayit.tutar)} ₺
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(() => {
                      const vb = vadeBadge(secilenKayit.vade_tarihi, secilenKayit.durum)
                      const ad = ARAMA_DURUM_META[secilenKayit.arama_durumu] || ARAMA_DURUM_META.aranmadi
                      return (
                        <>
                          {vb && <span className="odm-badge" style={{ background: vb.bg, color: vb.color }}>{vb.text}</span>}
                          <span className="odm-badge" style={{ background: ad.bg, color: ad.color }}>
                            <i className={`bi ${ad.icon}`} />{ad.label}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Vade Tarihi */}
                <div style={{ fontSize: 13, color: '#697586', marginBottom: 4 }}>
                  <i className="bi bi-calendar3 me-1" />
                  Vade: <strong style={{ color: '#121926' }}>{tarihStr(secilenKayit.vade_tarihi)}</strong>
                </div>
                {secilenKayit.telefon && (
                  <div style={{ fontSize: 13, color: '#697586', marginBottom: 16 }}>
                    <i className="bi bi-telephone me-1" />
                    <a href={`tel:${secilenKayit.telefon}`} style={{ color: '#3034ff', textDecoration: 'none' }}>
                      {secilenKayit.telefon}
                    </a>
                  </div>
                )}

                {/* "Aradım" butonu */}
                <button
                  className="fk-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}
                  onClick={() => modalAc(secilenKayit)}
                >
                  <i className="bi bi-telephone-outbound" />
                  Arama Kaydı Ekle
                </button>

                {/* Arama Geçmişi Timeline */}
                <div style={{ fontSize: 13, fontWeight: 600, color: '#121926', marginBottom: 12, letterSpacing: '-0.26px' }}>
                  <i className="bi bi-clock-history me-2" style={{ color: '#697586' }} />
                  Arama Geçmişi
                </div>

                {secilenKayit.arama_gecmisi.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '24px 16px', background: '#f6f7fb',
                    borderRadius: 8, border: '1px dashed #e3e8ef',
                  }}>
                    <i className="bi bi-telephone-minus" style={{ fontSize: 24, color: '#cdd5df', display: 'block', marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: '#9aa4b2' }}>Henüz arama yapılmadı</div>
                  </div>
                ) : (
                  <ul className="odm-timeline">
                    {secilenKayit.arama_gecmisi.map((a, i) => {
                      const meta = ARAMA_DURUM_META[a.sonuc] || ARAMA_DURUM_META.aranmadi
                      return (
                        <li key={i} className="odm-tl-item">
                          <div className="odm-tl-dot" style={{ background: meta.bg, color: meta.color }}>
                            <i className={`bi ${meta.icon}`} style={{ fontSize: 13 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: meta.color }}>
                                {meta.label}
                              </span>
                              <span style={{ fontSize: 11, color: '#9aa4b2' }}>
                                {tarihStr(a.tarih)}
                              </span>
                            </div>
                            {a.not && (
                              <div style={{
                                fontSize: 12, color: '#697586', marginTop: 4,
                                background: '#f6f7fb', borderRadius: 6, padding: '6px 10px',
                              }}>
                                {a.not}
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────
          BÖLÜM 4 — "Aradım" Modalı
          ───────────────────────────────────────────────────────── */}
      {aramaModali && (
        <div className="fk-modal-backdrop">
          <div className="fk-modal">

            {/* Modal Header */}
            <div className="fk-modal-header">
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>
                  Arama Kaydı
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {aramaModali.firma_adi} — {aramaModali.cari_ad}
                </div>
              </div>
              <button
                className="odm-kapat-btn"
                onClick={() => { setAramaModaliId(null); resetModal() }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="fk-modal-body">

              {/* Arama Sonucu — Radio Kart Seçimi */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#121926', marginBottom: 12, letterSpacing: '-0.26px' }}>
                Arama Sonucu
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {ARAMA_SECENEKLERI.map(s => (
                  <button
                    key={s.id}
                    className={`odm-radio-kart${aramaSonucu === s.id ? ' selected' : ''}`}
                    onClick={() => setAramaSonucu(s.id)}
                  >
                    <span style={{ fontSize: 20 }}>{s.emoji}</span>
                    <span>{s.label}</span>
                    {aramaSonucu === s.id && (
                      <i className="bi bi-check-circle-fill ms-auto" style={{ fontSize: 16, color: '#3034ff' }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Hatırlatıcı Tarihi (sadece "Ertele" seçilince) */}
              {aramaSonucu === 'ertelendi' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#697586', display: 'block', marginBottom: 6 }}>
                    Hatırlatıcı Tarihi
                  </label>
                  <input
                    type="date"
                    className="fk-input"
                    value={hatirlaticiTarihi}
                    onChange={e => setHatirlaticiTarihi(e.target.value)}
                    min={bugunStr(1)}
                  />
                </div>
              )}

              {/* Not */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#697586', display: 'block', marginBottom: 6 }}>
                  Not <span style={{ color: '#9aa4b2', fontWeight: 400 }}>(isteğe bağlı)</span>
                </label>
                <textarea
                  className="fk-input"
                  style={{ minHeight: 88, resize: 'vertical' }}
                  placeholder="Söylediği şeyi buraya yaz..."
                  value={aramaNotText}
                  onChange={e => setAramaNotText(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="fk-modal-footer">
              <button
                className="fk-btn-secondary"
                onClick={() => { setAramaModaliId(null); resetModal() }}
              >
                İptal
              </button>
              <button
                className="fk-btn-primary"
                disabled={!aramaSonucu}
                style={!aramaSonucu ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                onClick={aramaKaydet}
              >
                <i className="bi bi-check-lg" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
