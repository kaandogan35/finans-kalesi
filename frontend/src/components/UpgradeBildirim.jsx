/**
 * UpgradeBildirim — Ücretsiz Plan Kullanım Bildirimleri
 *
 * 3 bildirim modu (öncelik sırasına göre):
 *   1. DOLU  (%100) — Kırmızı banner + otomatik PlanYukseltModal açılır (oturum başına 1 kez)
 *   2. UYARI (%80+) — Sarı uyarı banner'ı (kapatılamaz, kullanım bilgisi gösterir)
 *   3. Genel — Upgrade daveti banner'ı (oturum başına 1 kez kapatılabilir)
 *
 * Tema uyumlu: Banking / Earthy / Dark için ayrı renk haritası.
 * Sadece ücretsiz plan kullanıcılarına gösterilir.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import useTemaStore from '../stores/temaStore'
import { useSinirler } from '../hooks/useSinirler'
import PlanYukseltModal from './PlanYukseltModal'

// ─── Tema Renk Haritası ─────────────────────────────────────────────────────
// Her tema için ayrı renk seti — Banking/Earthy açık arka plan, Dark koyu arka plan
const TEMA_RENKLER = {
  banking: {
    text:             '#4a5270',
    bgDolu:           'rgba(192,57,43,0.07)',
    bgUyari:          'rgba(184,134,11,0.07)',
    bgGenel:          'rgba(21,101,192,0.06)',
    borderDolu:       'rgba(192,57,43,0.18)',
    borderUyari:      'rgba(184,134,11,0.2)',
    borderGenel:      'rgba(21,101,192,0.15)',
    iconDolu:         '#c0392b',
    iconUyari:        '#b8860b',
    iconGenel:        '#1565c0',
    progressDolu:     '#c0392b',
    progressUyari:    '#b8860b',
    progressBg:       'rgba(26,31,54,0.08)',
    btnDoluBg:        'rgba(192,57,43,0.1)',
    btnDoluColor:     '#c0392b',
    btnDoluBorder:    'rgba(192,57,43,0.3)',
    btnUyariBg:       'rgba(184,134,11,0.1)',
    btnUyariColor:    '#b8860b',
    btnUyariBorder:   'rgba(184,134,11,0.3)',
    btnGenelBg:       'rgba(21,101,192,0.08)',
    btnGenelColor:    '#1565c0',
    btnGenelBorder:   'rgba(21,101,192,0.22)',
    kapatColor:       'rgba(26,31,54,0.3)',
    kapatHover:       'rgba(26,31,54,0.08)',
  },
  earthy: {
    text:             '#7a5030',
    bgDolu:           'rgba(192,57,43,0.07)',
    bgUyari:          'rgba(212,146,11,0.07)',
    bgGenel:          'rgba(160,96,64,0.06)',
    borderDolu:       'rgba(192,57,43,0.18)',
    borderUyari:      'rgba(212,146,11,0.2)',
    borderGenel:      'rgba(160,96,64,0.15)',
    iconDolu:         '#c0392b',
    iconUyari:        '#d4920b',
    iconGenel:        '#a06040',
    progressDolu:     '#c0392b',
    progressUyari:    '#d4920b',
    progressBg:       'rgba(58,32,16,0.08)',
    btnDoluBg:        'rgba(192,57,43,0.1)',
    btnDoluColor:     '#c0392b',
    btnDoluBorder:    'rgba(192,57,43,0.3)',
    btnUyariBg:       'rgba(212,146,11,0.1)',
    btnUyariColor:    '#d4920b',
    btnUyariBorder:   'rgba(212,146,11,0.3)',
    btnGenelBg:       'rgba(160,96,64,0.08)',
    btnGenelColor:    '#a06040',
    btnGenelBorder:   'rgba(160,96,64,0.22)',
    kapatColor:       'rgba(58,32,16,0.3)',
    kapatHover:       'rgba(58,32,16,0.07)',
  },
  dark: {
    text:             'rgba(255,255,255,0.72)',
    bgDolu:           'linear-gradient(90deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.06) 100%)',
    bgUyari:          'linear-gradient(90deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)',
    bgGenel:          'linear-gradient(90deg, rgba(59,130,246,0.07) 0%, rgba(99,102,241,0.04) 100%)',
    borderDolu:       'rgba(239,68,68,0.25)',
    borderUyari:      'rgba(245,158,11,0.22)',
    borderGenel:      'rgba(59,130,246,0.15)',
    iconDolu:         '#f87171',
    iconUyari:        '#f59e0b',
    iconGenel:        '#60a5fa',
    progressDolu:     '#f87171',
    progressUyari:    '#f59e0b',
    progressBg:       'rgba(255,255,255,0.08)',
    btnDoluBg:        'rgba(239,68,68,0.15)',
    btnDoluColor:     '#f87171',
    btnDoluBorder:    'rgba(239,68,68,0.35)',
    btnUyariBg:       'rgba(245,158,11,0.15)',
    btnUyariColor:    '#f59e0b',
    btnUyariBorder:   'rgba(245,158,11,0.35)',
    btnGenelBg:       'rgba(59,130,246,0.12)',
    btnGenelColor:    '#60a5fa',
    btnGenelBorder:   'rgba(59,130,246,0.3)',
    kapatColor:       'rgba(255,255,255,0.3)',
    kapatHover:       'rgba(255,255,255,0.07)',
  },
}

export default function UpgradeBildirim() {
  const { kullanici }  = useAuthStore()
  const { aktifTema }  = useTemaStore()
  const { sinirler, uyariDurum } = useSinirler()
  const navigate = useNavigate()

  const [bannerKapatildi, setBannerKapatildi] = useState(false)
  const [modalGosterildi, setModalGosterildi] = useState(false)
  const [modalAcik, setModalAcik]             = useState(false)
  const [modalOzellik, setModalOzellik]       = useState('Kullanım Limiti')

  const plan = kullanici?.plan || 'ucretsiz'
  const renk = TEMA_RENKLER[aktifTema] || TEMA_RENKLER.banking

  const cariDurum = uyariDurum('cari')
  const cekDurum  = uyariDurum('cek_aylik')

  // Limit dolu → oturum başına 1 kez modal aç
  useEffect(() => {
    if (plan !== 'ucretsiz' || modalGosterildi || !sinirler) return
    if (cariDurum === 'dolu') {
      setModalOzellik('Cari Hesap Limiti')
      setModalAcik(true)
      setModalGosterildi(true)
    } else if (cekDurum === 'dolu') {
      setModalOzellik('Aylık Çek/Senet Limiti')
      setModalAcik(true)
      setModalGosterildi(true)
    }
  }, [cariDurum, cekDurum, sinirler, plan, modalGosterildi])

  if (plan !== 'ucretsiz') return null

  const limitDolu  = cariDurum === 'dolu'  || cekDurum === 'dolu'
  const limitUyari = cariDurum === 'uyari' || cekDurum === 'uyari'

  const aktifLimit = (() => {
    if (cariDurum === 'dolu' || cariDurum === 'uyari') return 'cari'
    if (cekDurum  === 'dolu' || cekDurum  === 'uyari') return 'cek_aylik'
    return null
  })()
  const aktifBilgi  = aktifLimit ? sinirler?.[aktifLimit] : null
  const aktifEtiket = aktifLimit === 'cari' ? 'cari hesap' : 'aylık çek/senet'

  const goster = limitDolu || limitUyari || !bannerKapatildi
  if (!goster) return null

  // ─── Durum bazlı değerler ─────────────────────────────────────────────────
  let bg, border, iconColor, icon, mesaj, butonLabel
  let btnBg, btnColor, btnBorder

  if (limitDolu) {
    bg         = renk.bgDolu
    border     = renk.borderDolu
    iconColor  = renk.iconDolu
    icon       = 'bi-exclamation-triangle-fill'
    mesaj      = aktifBilgi
      ? `${aktifEtiket.charAt(0).toUpperCase() + aktifEtiket.slice(1)} limitinize ulaştınız (${aktifBilgi.mevcut}/${aktifBilgi.sinir}). Yeni kayıt ekleyemezsiniz.`
      : 'Kullanım limitinize ulaştınız. Yeni kayıt ekleyemezsiniz.'
    butonLabel = 'Planı Yükselt'
    btnBg = renk.btnDoluBg; btnColor = renk.btnDoluColor; btnBorder = renk.btnDoluBorder
  } else if (limitUyari) {
    bg         = renk.bgUyari
    border     = renk.borderUyari
    iconColor  = renk.iconUyari
    icon       = 'bi-exclamation-circle-fill'
    mesaj      = aktifBilgi
      ? `${aktifEtiket.charAt(0).toUpperCase() + aktifEtiket.slice(1)} limitinize yaklaşıyorsunuz — ${aktifBilgi.mevcut}/${aktifBilgi.sinir} kullanıldı (%${aktifBilgi.yuzde}).`
      : 'Kullanım limitinize yaklaşıyorsunuz.'
    butonLabel = 'Planı İncele'
    btnBg = renk.btnUyariBg; btnColor = renk.btnUyariColor; btnBorder = renk.btnUyariBorder
  } else {
    bg         = renk.bgGenel
    border     = renk.borderGenel
    iconColor  = renk.iconGenel
    icon       = 'bi-stars'
    mesaj      = 'Ücretsiz plandaki özellikleri keşfediyorsunuz. Standart plana geçerek PDF rapor, Excel dışa aktarma ve çok kullanıcı özelliklerini açın.'
    butonLabel = 'Planları Gör'
    btnBg = renk.btnGenelBg; btnColor = renk.btnGenelColor; btnBorder = renk.btnGenelBorder
  }

  const kapatilabilir = !limitDolu && !limitUyari

  return (
    <>
      <style>{`
        .fk-upgrade-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 20px;
          font-size: 12.5px;
          font-weight: 500;
          line-height: 1.4;
          flex-shrink: 0;
          border-bottom: 1px solid;
          animation: fkBannerIn 0.3s ease;
        }
        @keyframes fkBannerIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fk-upgrade-banner-btn {
          white-space: nowrap;
          padding: 5px 12px;
          border-radius: 7px;
          border: 1px solid;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .fk-upgrade-banner-btn:hover { opacity: 0.8; }
        .fk-upgrade-banner-close {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px; height: 24px;
          border-radius: 6px;
          flex-shrink: 0;
          transition: background 0.15s;
          padding: 0;
        }
      `}</style>

      <div
        className="fk-upgrade-banner"
        style={{ background: bg, borderColor: border }}
      >
        <i className={`bi ${icon}`} style={{ color: iconColor, fontSize: 14, flexShrink: 0 }} />

        <span style={{ color: renk.text, flexGrow: 1 }}>{mesaj}</span>

        {/* İlerleme çubuğu */}
        {aktifBilgi && (limitDolu || limitUyari) && (
          <div style={{
            width: 80, height: 4, borderRadius: 3,
            background: renk.progressBg,
            flexShrink: 0, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(aktifBilgi.yuzde, 100)}%`,
              background: limitDolu ? renk.progressDolu : renk.progressUyari,
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
        )}

        <button
          className="fk-upgrade-banner-btn"
          onClick={() => navigate('/abonelik')}
          style={{ background: btnBg, borderColor: btnBorder, color: btnColor }}
        >
          <i className="bi bi-arrow-up-circle me-1" />
          {butonLabel}
        </button>

        {kapatilabilir && (
          <button
            className="fk-upgrade-banner-close"
            onClick={() => setBannerKapatildi(true)}
            title="Kapat"
            style={{ color: renk.kapatColor }}
            onMouseEnter={e => { e.currentTarget.style.background = renk.kapatHover }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: 11 }} />
          </button>
        )}
      </div>

      <PlanYukseltModal
        goster={modalAcik}
        kapat={() => setModalAcik(false)}
        ozellikAdi={modalOzellik}
        mevcutPlan={plan}
        kampanyaAktif={false}
      />
    </>
  )
}
