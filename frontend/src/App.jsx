/**
 * ParamGo — Ana Router
 *
 * Route yapısı:
 *   /giris                  → Giriş sayfası (public)
 *   /kayit                  → Kayıt sayfası (public)
 *   /* (korumalı)           → AppLayout içinde
 *     /dashboard            → Ana panel
 *     /cariler              → Cari hesaplar (Aşama 2.2)
 *     /cek-senet            → Çek/Senet (Aşama 2.3)
 *     /odemeler             → Ödemeler (Aşama 2.3)
 *     /kasa                 → Kozmik Oda (Aşama 2.3)
 */

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import ErrorBoundary from './components/ErrorBoundary'

// Layout
import KorunanSayfa      from './components/layout/KorunanSayfa'
import TemaLayout        from './components/layout/TemaLayout'
import ModulKoruma       from './components/layout/ModulKoruma'
import GuvenlikKoruyucu  from './components/GuvenlikKoruyucu'
import KvkkOnay          from './components/KvkkOnay'

// Auth sayfaları
import GirisYap     from './pages/auth/GirisYap'
import KayitOl      from './pages/auth/KayitOl'
import SifreSifirla from './pages/auth/SifreSifirla'

// Uygulama sayfaları
import Dashboard       from './pages/dashboard/Dashboard'
import CariYonetimi   from './pages/cariler/CariYonetimi'
import VarlikKasa     from './pages/kasa/VarlikKasa'
import CekSenet       from './pages/cek-senet/CekSenet'
import OdemeTakip       from './pages/odeme-takip/OdemeTakip'
import VadeHesaplayici  from './pages/vade-hesaplayici/VadeHesaplayici'
import TemaSecimi        from './pages/ayarlar/TemaSecimi'
import PlanSecim         from './pages/abonelik/PlanSecim'
import KullaniciYonetimi from './pages/kullanicilar/KullaniciYonetimi'
import GuvenlikEkrani      from './pages/guvenlik/GuvenlikEkrani'
import BildirimlerEkrani  from './pages/bildirimler/BildirimlerEkrani'
import VeresiyeListesi   from './pages/veresiye/VeresiyeListesi'
import VeresiyeDetay     from './pages/veresiye/VeresiyeDetay'
import RaporlarEkrani    from './pages/raporlar/RaporlarEkrani'
import Gelirler          from './pages/gelirler/Gelirler'
import Giderler          from './pages/giderler/Giderler'
import TekrarlayanIslemler from './pages/tekrarlayan-islemler/TekrarlayanIslemler'
import Onboarding          from './pages/onboarding/Onboarding'

// Onboarding tamamlanmamışsa /onboarding'e yönlendir
function OnboardingKoruma() {
  const { kullanici } = useAuthStore()
  if (kullanici && kullanici.onboarding_tamamlandi === 0) {
    return <Navigate to="/onboarding" replace />
  }
  return <Outlet />
}

// Yalnızca sahip rolü erişebilir — /kullanicilar gibi sayfalar için
function SahipKoruma() {
  const { kullanici } = useAuthStore()
  if (!kullanici) return null
  if (kullanici.rol !== 'sahip') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// axios.js → auth:logout olayını dinle, React Router ile yönlendir
function AuthLogoutListener() {
  const navigate = useNavigate()
  useEffect(() => {
    const handleLogout = () => navigate('/giris')
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [navigate])
  return null
}

// Henüz yazılmamış sayfalar için geçici bileşen
function YakindaGeliyor({ sayfa }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center px-4"
      style={{ minHeight: '60vh' }}>
      <div
        style={{
          width: 56, height: 56, borderRadius: 16,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16, fontSize: 24,
        }}
      >
        🚧
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{sayfa}</h2>
      <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Bu modül yakında eklenecek.</p>
    </div>
  )
}

export default function App() {
  const baslat = useAuthStore((s) => s.baslat)

  // Uygulama açılırken mevcut token'dan kullanıcıyı yükle
  useEffect(() => { baslat() }, [baslat])

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <KvkkOnay>
      <GuvenlikKoruyucu>
      <AuthLogoutListener />
      <Routes>

        {/* ─── Public sayfalar ───────────────────────────────────────── */}
        <Route path="/giris"        element={<GirisYap />} />
        <Route path="/kayit"        element={<KayitOl />} />
        <Route path="/sifre-sifirla" element={<SifreSifirla />} />

        {/* ─── Korumalı sayfalar (JWT gerekli) ───────────────────────── */}
        <Route element={<KorunanSayfa />}>

          {/* Onboarding — TemaLayout dışında, herhangi bir route önce */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Onboarding tamamlanmamışsa /onboarding'e yönlendir */}
          <Route element={<OnboardingKoruma />}>
          <Route element={<TemaLayout />}>
            <Route path="/dashboard"             element={<Dashboard />} />

            {/* Modül koruma — cari */}
            <Route element={<ModulKoruma modul="cari" />}>
              <Route path="/cariler"               element={<CariYonetimi />} />
              <Route path="/cariler/yeni"          element={<Navigate to="/cariler" replace />} />
              <Route path="/cariler/:id"           element={<Navigate to="/cariler" replace />} />
              <Route path="/cariler/:id/duzenle"   element={<Navigate to="/cariler" replace />} />
            </Route>

            {/* Modül koruma — cek_senet */}
            <Route element={<ModulKoruma modul="cek_senet" />}>
              <Route path="/cek-senet"             element={<CekSenet />} />
            </Route>

            {/* Modül koruma — odemeler */}
            <Route element={<ModulKoruma modul="odemeler" />}>
              <Route path="/odemeler"              element={<OdemeTakip />} />
            </Route>

            {/* Modül koruma — gelirler/giderler (kasa modülü) */}
            <Route element={<ModulKoruma modul="kasa" />}>
              <Route path="/gelirler"              element={<Gelirler />} />
              <Route path="/giderler"              element={<Giderler />} />
            </Route>

            {/* Modül koruma — kasa & varlık alt sayfaları */}
            <Route element={<ModulKoruma modul="kasa" />}>
              <Route path="/kasa"                  element={<VarlikKasa />} />
              <Route path="/kasa/bilanco"          element={<VarlikKasa />} />
              <Route path="/kasa/ortaklar"         element={<VarlikKasa />} />
              <Route path="/kasa/yatirimlar"       element={<VarlikKasa />} />
            </Route>

            {/* Modül koruma — tekrarlayan islemler (kasa modülü) */}
            <Route element={<ModulKoruma modul="kasa" />}>
              <Route path="/tekrarlayan-islemler"    element={<TekrarlayanIslemler />} />
            </Route>

            {/* Modül koruma — vade_hesaplayici */}
            <Route element={<ModulKoruma modul="vade_hesaplayici" />}>
              <Route path="/vade-hesaplayici"      element={<VadeHesaplayici />} />
            </Route>

            {/* Modül koruma — veresiye */}
            <Route element={<ModulKoruma modul="veresiye" />}>
              <Route path="/veresiye"              element={<VeresiyeListesi />} />
              <Route path="/veresiye/:cariId"      element={<VeresiyeDetay />} />
            </Route>

            {/* Sahip only */}
            <Route element={<SahipKoruma />}>
              <Route path="/kullanicilar"          element={<KullaniciYonetimi />} />
              <Route path="/guvenlik"              element={<GuvenlikEkrani />} />
              <Route path="/abonelik"              element={<PlanSecim />} />
            </Route>

            <Route path="/bildirimler"             element={<BildirimlerEkrani />} />
            <Route path="/raporlar"               element={<RaporlarEkrani />} />
            <Route path="/ayarlar/tema"            element={<TemaSecimi />} />
          </Route>
          </Route> {/* OnboardingKoruma */}
        </Route>

        {/* ─── Kök'ü dashboard'a yönlendir ───────────────────────────── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </GuvenlikKoruyucu>
    </KvkkOnay>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
