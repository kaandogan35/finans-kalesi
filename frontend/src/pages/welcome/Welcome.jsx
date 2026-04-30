/**
 * Welcome — ParamGo Yeni Kullanıcı Tanıtım Ekranı
 *
 * Kayıt sonrası ilk kez açılan 3 swipe ekranı.
 * Her ekran: büyük illustration + başlık + alt metin.
 * Son ekran → "Hemen Başla" butonu PaywallModal'i açar.
 *
 * Native platformda: Welcome → Paywall → Dashboard
 * Web platformda: Welcome → Dashboard (paywall yok)
 *
 * Tasarım: Mevcut p-ob-* sınıflarını temel alır, swipe mantığı için inline style.
 * İllustration: Inline SVG (modüller temalı, yeşil gradient paleti).
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import ParamGoLogo from '../../logo/ParamGoLogo'
import PaywallModal from '../../components/PaywallModal'

// ════════════════════════════════════════════════════════════════
// İLLUSTRASYONLAR — Inline SVG (hafif, ölçeklenebilir)
// ════════════════════════════════════════════════════════════════

/** Çek/Senet illustration — banka çeki görseli */
function CekIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 280, height: 'auto' }}>
      <defs>
        <linearGradient id="cekBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ECFDF5" />
          <stop offset="1" stopColor="#D1FAE5" />
        </linearGradient>
        <linearGradient id="cekTop" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#10B981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Arka plan para desenleri */}
      <circle cx="40" cy="30" r="12" fill="#10B981" opacity="0.08" />
      <circle cx="250" cy="40" r="18" fill="#10B981" opacity="0.08" />
      <circle cx="30" cy="170" r="14" fill="#10B981" opacity="0.08" />
      <circle cx="240" cy="170" r="10" fill="#10B981" opacity="0.08" />

      {/* Arka plandaki ikinci çek (gölge efekti) */}
      <rect x="50" y="30" width="180" height="110" rx="10" fill="#A7F3D0" opacity="0.4" transform="rotate(-4 140 85)" />

      {/* Ana çek kartı */}
      <rect x="40" y="40" width="200" height="120" rx="12" fill="url(#cekBg)" stroke="#10B981" strokeWidth="1.5" />

      {/* Çek üst bant */}
      <rect x="40" y="40" width="200" height="28" rx="12" fill="url(#cekTop)" />
      <rect x="40" y="56" width="200" height="12" fill="url(#cekTop)" />

      {/* ₺ simgeli daire */}
      <circle cx="60" cy="54" r="9" fill="#fff" />
      <text x="60" y="58" fontSize="11" fontWeight="800" fill="#059669" textAnchor="middle">₺</text>

      {/* Başlık: Tüm bankalar tek ekran */}
      <text x="75" y="58" fontSize="10" fontWeight="700" fill="#fff">TÜM BANKALAR TEK EKRAN</text>

      {/* TUTAR YAZISI */}
      <text x="60" y="96" fontSize="8" fontWeight="600" fill="#059669">TUTAR</text>
      <text x="60" y="115" fontSize="18" fontWeight="800" fill="#047857">₺25.000,00</text>

      {/* Vade */}
      <text x="60" y="132" fontSize="7" fontWeight="600" fill="#6B7280">VADE: 15.05.2026</text>

      {/* Çizgi alt */}
      <line x1="60" y1="144" x2="220" y2="144" stroke="#10B981" strokeWidth="0.5" strokeDasharray="2,2" />
      <text x="60" y="152" fontSize="6" fill="#9CA3AF">İMZA</text>

      {/* Check mark yeşil daire */}
      <circle cx="210" cy="110" r="14" fill="#10B981" />
      <path d="M204 110 L208 114 L216 106" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Kar/Zarar illustration — bar grafiği ve terazi */
function KarZararIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 280, height: 'auto' }}>
      <defs>
        <linearGradient id="greenBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10B981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="redBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F87171" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="panelBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F0FDF4" />
        </linearGradient>
      </defs>

      {/* Arka plan daireleri */}
      <circle cx="35" cy="30" r="15" fill="#10B981" opacity="0.08" />
      <circle cx="250" cy="170" r="20" fill="#10B981" opacity="0.08" />

      {/* Dashboard kart arka planı */}
      <rect x="35" y="30" width="210" height="140" rx="14" fill="url(#panelBg)" stroke="#10B981" strokeWidth="1.5" />

      {/* Başlık */}
      <text x="50" y="52" fontSize="10" fontWeight="800" fill="#047857">KAR / ZARAR ANALİZİ</text>

      {/* Y ekseni referans çizgisi */}
      <line x1="50" y1="140" x2="230" y2="140" stroke="#D1FAE5" strokeWidth="1" />
      <line x1="50" y1="120" x2="230" y2="120" stroke="#D1FAE5" strokeWidth="0.5" strokeDasharray="2,2" />
      <line x1="50" y1="100" x2="230" y2="100" stroke="#D1FAE5" strokeWidth="0.5" strokeDasharray="2,2" />
      <line x1="50" y1="80" x2="230" y2="80" stroke="#D1FAE5" strokeWidth="0.5" strokeDasharray="2,2" />

      {/* Barlar — Gelir/Gider çiftleri */}
      {/* Ay 1 */}
      <rect x="62" y="88" width="14" height="52" rx="2" fill="url(#greenBar)" />
      <rect x="78" y="104" width="14" height="36" rx="2" fill="url(#redBar)" />
      <text x="77" y="155" fontSize="6" fill="#6B7280" textAnchor="middle">Oca</text>

      {/* Ay 2 */}
      <rect x="102" y="78" width="14" height="62" rx="2" fill="url(#greenBar)" />
      <rect x="118" y="98" width="14" height="42" rx="2" fill="url(#redBar)" />
      <text x="117" y="155" fontSize="6" fill="#6B7280" textAnchor="middle">Şub</text>

      {/* Ay 3 */}
      <rect x="142" y="70" width="14" height="70" rx="2" fill="url(#greenBar)" />
      <rect x="158" y="92" width="14" height="48" rx="2" fill="url(#redBar)" />
      <text x="157" y="155" fontSize="6" fill="#6B7280" textAnchor="middle">Mar</text>

      {/* Ay 4 */}
      <rect x="182" y="62" width="14" height="78" rx="2" fill="url(#greenBar)" />
      <rect x="198" y="86" width="14" height="54" rx="2" fill="url(#redBar)" />
      <text x="197" y="155" fontSize="6" fill="#6B7280" textAnchor="middle">Nis</text>

      {/* KAR badge — büyük yukarı ok */}
      <rect x="145" y="164" width="90" height="22" rx="11" fill="#10B981" />
      <path d="M158 175 L164 169 L170 175" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="205" y="179" fontSize="10" fontWeight="800" fill="#fff" textAnchor="middle">+₺45.000 KAR</text>

      {/* Legend */}
      <circle cx="56" cy="172" r="3" fill="#10B981" />
      <text x="62" y="175" fontSize="7" fill="#374151">Gelir</text>
      <circle cx="90" cy="172" r="3" fill="#DC2626" />
      <text x="96" y="175" fontSize="7" fill="#374151">Gider</text>
    </svg>
  )
}

/** Kasa illustration — safe/kasa ve para akışı */
function KasaIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 280, height: 'auto' }}>
      <defs>
        <linearGradient id="safeBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="safeDoor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#059669" />
          <stop offset="1" stopColor="#065F46" />
        </linearGradient>
      </defs>

      {/* Arka plan daireleri */}
      <circle cx="40" cy="40" r="16" fill="#10B981" opacity="0.1" />
      <circle cx="245" cy="50" r="22" fill="#10B981" opacity="0.1" />
      <circle cx="35" cy="165" r="14" fill="#10B981" opacity="0.1" />

      {/* Dalga arka plan çizgileri */}
      <path d="M20 100 Q60 90 100 100 T180 100 T260 100" stroke="#10B981" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="3,3" />
      <path d="M20 110 Q60 100 100 110 T180 110 T260 110" stroke="#10B981" strokeWidth="1" fill="none" opacity="0.2" strokeDasharray="3,3" />

      {/* Sol: Giriş para oku */}
      <g transform="translate(30, 80)">
        <circle cx="14" cy="14" r="14" fill="#10B981" opacity="0.15" />
        <path d="M14 6 L14 22 M8 16 L14 22 L20 16" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="44" y="102" fontSize="8" fontWeight="700" fill="#059669">+₺15.000</text>

      {/* Sağ: Çıkış para oku */}
      <g transform="translate(222, 80)">
        <circle cx="14" cy="14" r="14" fill="#DC2626" opacity="0.12" />
        <path d="M14 22 L14 6 M8 12 L14 6 L20 12" stroke="#DC2626" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="238" y="118" fontSize="8" fontWeight="700" fill="#DC2626" textAnchor="middle">-₺5.000</text>

      {/* KASA (safe) gövdesi */}
      <rect x="95" y="50" width="90" height="110" rx="8" fill="url(#safeBg)" stroke="#065F46" strokeWidth="2" />

      {/* Kasa kapısı */}
      <rect x="103" y="60" width="74" height="90" rx="4" fill="url(#safeDoor)" />

      {/* Kasa kolu (kombinasyon) */}
      <circle cx="140" cy="105" r="16" fill="#10B981" stroke="#065F46" strokeWidth="2" />
      <circle cx="140" cy="105" r="10" fill="#065F46" />

      {/* Kol çubukları (4 yön) */}
      <rect x="138" y="85" width="4" height="8" rx="1" fill="#D1FAE5" />
      <rect x="138" y="117" width="4" height="8" rx="1" fill="#D1FAE5" />
      <rect x="120" y="103" width="8" height="4" rx="1" fill="#D1FAE5" />
      <rect x="152" y="103" width="8" height="4" rx="1" fill="#D1FAE5" />

      {/* Bakiye badge üstte */}
      <rect x="105" y="68" width="70" height="20" rx="10" fill="#FFFFFF" />
      <text x="140" y="81" fontSize="10" fontWeight="800" fill="#047857" textAnchor="middle">₺127.500</text>

      {/* Kasa altı gölge */}
      <ellipse cx="140" cy="167" rx="50" ry="4" fill="#000" opacity="0.1" />

      {/* Büyük KAR etiketi */}
      <rect x="90" y="168" width="100" height="24" rx="12" fill="#10B981" stroke="#065F46" strokeWidth="1.5" />
      <path d="M103 180 L108 175 L113 180" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="150" y="184" fontSize="10" fontWeight="800" fill="#fff" textAnchor="middle">KAR: +₺10.000</text>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════
// EKRAN TANIMLARI
// ════════════════════════════════════════════════════════════════

const EKRANLAR = [
  {
    id: 1,
    illustration: CekIllustration,
    baslik: 'Tüm Banka Çeklerini Tek Yerde Topla',
    altMetin: 'Aldığın alacak çeklerini ve verdiğin borç çeklerini tüm bankalardan tek uygulamada takip et. Hiçbir vadeyi kaçırma, karşılıksız riskini önle.',
    vurguAnahtar: 'TEK UYGULAMA',
  },
  {
    id: 2,
    illustration: KarZararIllustration,
    baslik: 'Bu Ay Kazandın mı, Harcadın mı?',
    altMetin: 'Aylık kar ve zararını tek bakışta gör. Kazançların mı yoksa giderlerin mi öne geçiyor — net olarak bil, doğru kararları zamanında al.',
    vurguAnahtar: 'KAR / ZARAR',
  },
  {
    id: 3,
    illustration: KasaIllustration,
    baslik: 'Gerçek Kârını Anında Hesapla',
    altMetin: 'Kaç para kazandığını bilmek artık zor değil. Kasaya giren çıkan her kuruşu takip et, günlük ve aylık gerçek kârını öğren.',
    vurguAnahtar: 'GERÇEK KÂR',
  },
]

// ════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ════════════════════════════════════════════════════════════════

export default function Welcome() {
  const navigate = useNavigate()
  const [aktifEkran, setAktifEkran] = useState(0)
  const [paywallAcik, setPaywallAcik] = useState(false)
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  // Yeşil arka plan — status bar ikonlarını beyaz yap
  useEffect(() => {
    window.__statusBarSetLight?.()
  }, [])

  const ekranSayisi = EKRANLAR.length
  const sonEkran = aktifEkran === ekranSayisi - 1

  const sonrakiEkran = () => {
    if (sonEkran) {
      // Son ekran → platforma göre yönlen
      if (Capacitor.isNativePlatform()) {
        setPaywallAcik(true)
      } else {
        navigate('/dashboard')
      }
    } else {
      setAktifEkran(aktifEkran + 1)
    }
  }

  const oncekiEkran = () => {
    if (aktifEkran > 0) setAktifEkran(aktifEkran - 1)
  }

  const atla = () => {
    if (Capacitor.isNativePlatform()) {
      setPaywallAcik(true)
    } else {
      navigate('/dashboard')
    }
  }

  // Touch olayları — swipe desteği
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const mesafe = touchStartX.current - touchEndX.current
    if (mesafe > 50) sonrakiEkran()     // sola swipe → ileri
    else if (mesafe < -50) oncekiEkran() // sağa swipe → geri
    touchStartX.current = null
    touchEndX.current = null
  }

  const aktifIcerik = EKRANLAR[aktifEkran]
  const Illustration = aktifIcerik.illustration

  // Web: 520px mobile-frame içinde, beyaz kart şeklinde merkezi.
  // Mobil: full-width, frame yok (mevcut .p-ob-hero / .p-ob-content responsive davranışı korunur).
  const isMobil = typeof window !== 'undefined' && window.innerWidth < 640
  const frameStyle = isMobil
    ? {}
    : {
        width: '100%',
        maxWidth: 520,
        margin: '32px auto',
        background: '#ffffff',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 24px 60px -16px rgba(16,185,129,0.18), 0 8px 24px -8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }

  return (
    <div
      className="p-ob-root"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={isMobil ? undefined : { background: '#F8F9FA', justifyContent: 'flex-start' }}
    >
      <div style={frameStyle}>
        {/* ── Hero arka plan ── */}
        <div
          className="p-ob-hero"
          style={isMobil
            ? { paddingBottom: 20, minHeight: 'auto' }
            : {
                padding: '20px 24px 28px',
                minHeight: 'auto',
                width: '100%',
                borderRadius: 0,
              }
          }
        >
          <div className="p-ob-hero-blob-1" />
          <div className="p-ob-hero-blob-2" />
          <div className="p-ob-hero-blob-3" />

          {/* Logo + Atla butonu — üst bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: 440,
            margin: '0 auto',
            marginBottom: 14,
            position: 'relative',
            zIndex: 2,
          }}>
            <div className="p-ob-hero-logo" style={{ margin: 0 }}>
              <ParamGoLogo size="sm" variant="white" />
            </div>

            {!sonEkran && (
              <button
                type="button"
                onClick={atla}
                style={{
                  background: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.32)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '7px 14px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  letterSpacing: '0.2px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.26)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
              >
                Atla
                <i className="bi bi-arrow-right" style={{ fontSize: 13 }} />
              </button>
            )}
          </div>

          {/* Ekran numarası rozeti */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.32)',
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 800,
            padding: '5px 14px',
            borderRadius: 999,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            position: 'relative',
            zIndex: 2,
          }}>
            {aktifIcerik.vurguAnahtar}
          </div>
        </div>

        {/* ── İçerik ── */}
        <div
          className="p-ob-content"
          style={isMobil
            ? { paddingTop: 8 }
            : { paddingTop: 0, paddingBottom: 28, maxWidth: '100%' }
          }
        >
          <div
            key={aktifEkran}
            className="p-ob-card"
            style={isMobil
              ? { margin: '0 auto 24px', padding: '32px 24px 28px', textAlign: 'center' }
              : {
                  margin: '0',
                  padding: '28px 28px 24px',
                  textAlign: 'center',
                  borderRadius: 0,
                  boxShadow: 'none',
                }
            }
          >
          {/* İllustration */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            minHeight: 180,
          }}>
            <Illustration />
          </div>

          {/* Başlık */}
          <h2 style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#111827',
            margin: '0 0 12px',
            lineHeight: 1.25,
            letterSpacing: '-0.3px',
          }}>
            {aktifIcerik.baslik}
          </h2>

          {/* Alt metin */}
          <p style={{
            fontSize: 13.5,
            color: '#6B7280',
            margin: '0 0 8px',
            lineHeight: 1.65,
            padding: '0 8px',
          }}>
            {aktifIcerik.altMetin}
          </p>
        </div>

        {/* ── Progress noktaları ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
        }}>
          {EKRANLAR.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAktifEkran(i)}
              aria-label={`Ekran ${i + 1}`}
              style={{
                width: i === aktifEkran ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === aktifEkran ? '#10B981' : '#D1D5DB',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* ── Ana buton ── */}
        <button
          type="button"
          className="p-ob-btn-next"
          onClick={sonrakiEkran}
          style={{ marginBottom: 10 }}
        >
          {sonEkran ? (
            <>
              <i className="bi bi-rocket-takeoff-fill" />
              Hemen Başla
            </>
          ) : (
            <>
              <i className="bi bi-arrow-right" />
              Devam Et
            </>
          )}
        </button>

        {/* ── Geri butonu (2. ve 3. ekranda) ── */}
        {aktifEkran > 0 && (
          <button
            type="button"
            className="p-ob-btn-skip"
            onClick={oncekiEkran}
          >
            <i className="bi bi-arrow-left" /> Önceki
          </button>
        )}
        </div>
      </div>

      {/* ── Paywall Modal (sadece native) ── */}
      <PaywallModal
        goster={paywallAcik}
        onKapat={() => {
          setPaywallAcik(false)
          navigate('/dashboard')
        }}
        onBasarili={() => {
          setPaywallAcik(false)
          navigate('/dashboard')
        }}
      />
    </div>
  )
}
