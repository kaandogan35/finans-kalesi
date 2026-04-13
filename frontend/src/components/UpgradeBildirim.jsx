/**
 * UpgradeBildirim — Ücretsiz Plan Kullanım Bildirimleri
 *
 * 3 bildirim modu (öncelik sırasına göre):
 *   1. DOLU  (%100) — Kırmızı banner + otomatik PlanYukseltModal açılır (oturum başına 1 kez)
 *   2. UYARI (%80+) — Sarı uyarı banner'ı (kapatılamaz, kullanım bilgisi gösterir)
 *   3. Genel — Upgrade daveti banner'ı (oturum başına 1 kez kapatılabilir)
 *
 * Tema uyumlu: ParamGo teması için renk haritası.
 * Sadece ücretsiz plan kullanıcılarına gösterilir.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import useTemaStore from '../stores/temaStore'
import { useSinirler } from '../hooks/useSinirler'
import PlanYukseltModal from './PlanYukseltModal'

// ─── Tema Renk Haritası ─────────────────────────────────────────────────────
const TEMA_RENKLER = {
  paramgo: {
    text:             '#111827',
    bgDolu:           'rgba(239,68,68,0.07)',
    bgUyari:          'rgba(245,158,11,0.07)',
    bgGenel:          'linear-gradient(135deg, #10B981, #059669)',
    borderDolu:       'rgba(239,68,68,0.18)',
    borderUyari:      'rgba(245,158,11,0.2)',
    borderGenel:      '#10B981',
    iconDolu:         '#EF4444',
    iconUyari:        '#F59E0B',
    iconGenel:        'rgba(255,255,255,0.85)',
    progressDolu:     '#EF4444',
    progressUyari:    '#F59E0B',
    progressBg:       'rgba(16,185,129,0.10)',
    btnDoluBg:        'rgba(239,68,68,0.1)',
    btnDoluColor:     '#EF4444',
    btnDoluBorder:    'rgba(239,68,68,0.3)',
    btnUyariBg:       'rgba(245,158,11,0.1)',
    btnUyariColor:    '#F59E0B',
    btnUyariBorder:   'rgba(245,158,11,0.3)',
    btnGenelBg:       'rgba(255,255,255,0.15)',
    btnGenelColor:    '#ffffff',
    btnGenelBorder:   'rgba(255,255,255,0.30)',
    kapatColor:       'rgba(255,255,255,0.50)',
    kapatHover:       'rgba(255,255,255,0.10)',
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

  const plan = kullanici?.plan || 'deneme'
  const renk = TEMA_RENKLER[aktifTema] || TEMA_RENKLER.paramgo

  // Kalan deneme günü hesapla
  // Not: iOS/Safari "2026-05-13 10:30:00" formatını Invalid Date olarak parse eder.
  // Bu yüzden boşluğu T ile değiştirip ISO 8601 formatına çeviriyoruz.
  const kalanDenemGun = (() => {
    if (plan !== 'deneme') return null
    if (!kullanici?.deneme_bitis) return -1  // null = tarih bilinmiyor (henüz yüklenmedi)
    const ham = kullanici.deneme_bitis.replace(' ', 'T')
    const bitis = new Date(ham)
    if (isNaN(bitis.getTime())) return -1    // geçersiz tarih — bilinmiyor say
    const bugun = new Date()
    const fark  = Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24))
    return fark > 0 ? fark : 0
  })()

  const cariDurum = uyariDurum('cari')
  const cekDurum  = uyariDurum('cek_aylik')

  // Limit dolu → oturum başına 1 kez modal aç
  useEffect(() => {
    if (plan !== 'deneme' || modalGosterildi || !sinirler) return
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

  if (plan !== 'deneme') return null

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
    mesaj      = kalanDenemGun === null || kalanDenemGun === -1
      ? 'Premium\'u 7 gün ücretsiz deneyin — kaç para kazandığınızı anında görün, hiçbir vadeyi kaçırmayın.'
      : kalanDenemGun === 0
        ? 'Ücretsiz erişim süreniz doldu. Premium\'a geçerek çek takibi, kar/zarar analizi ve verilerinize kesintisiz erişin.'
        : `${kalanDenemGun} gün ücretsiz erişiminiz kaldı. Premium ile kaç para kazandığınızı anında görün, vadesi yaklaşan çekleri otomatik takip edin.`
    butonLabel = 'Planları Gör'
    btnBg = renk.btnGenelBg; btnColor = renk.btnGenelColor; btnBorder = renk.btnGenelBorder
  }

  // Paramgo genel banner'ında metin beyaz olmalı (yeşil zemin üzerinde)
  const textColor = (!limitDolu && !limitUyari && aktifTema === 'paramgo') ? '#ffffff' : renk.text

  const kapatilabilir = !limitDolu && !limitUyari

  return (
    <>
      <div
        className="fk-upgrade-banner"
        style={{ background: bg, borderColor: border }}
      >
        <i className={`bi ${icon}`} style={{ color: iconColor, fontSize: 14, flexShrink: 0 }} />

        <span style={{ color: textColor, flexGrow: 1 }}>{mesaj}</span>

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
