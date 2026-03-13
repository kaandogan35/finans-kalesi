/**
 * Finans Kalesi — Ana Router
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
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'

// Layout
import KorunanSayfa from './components/layout/KorunanSayfa'
import AppLayout    from './components/layout/AppLayout'

// Auth sayfaları
import GirisYap from './pages/auth/GirisYap'

// Uygulama sayfaları
import Dashboard       from './pages/dashboard/Dashboard'
import CarilerListesi  from './pages/cariler/CarilerListesi'
import CariYonetimi   from './pages/cariler/CariYonetimi'
import VarlikKasa     from './pages/kasa/VarlikKasa'
import CekSenet       from './pages/cek-senet/CekSenet'

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
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{sayfa}</h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Bu modül yakında eklenecek.</p>
    </div>
  )
}

export default function App() {
  const baslat = useAuthStore((s) => s.baslat)

  // Uygulama açılırken mevcut token'dan kullanıcıyı yükle
  useEffect(() => { baslat() }, [baslat])

  return (
    <BrowserRouter>
      <AuthLogoutListener />
      <Routes>

        {/* ─── Public sayfalar ───────────────────────────────────────── */}
        <Route path="/giris" element={<GirisYap />} />
        <Route path="/kayit" element={<YakindaGeliyor sayfa="Kayıt Sayfası" />} />

        {/* ─── Korumalı sayfalar (JWT gerekli) ───────────────────────── */}
        <Route element={<KorunanSayfa />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cariler"   element={<CariYonetimi />} />
            <Route path="/cariler/*" element={<YakindaGeliyor sayfa="Cari Detay / Yeni" />} />
            <Route path="/cek-senet" element={<CekSenet />} />
            <Route path="/odemeler/*" element={<YakindaGeliyor sayfa="Ödeme Takip" />} />
            <Route path="/kasa" element={<VarlikKasa />} />
          </Route>
        </Route>

        {/* ─── Kök'ü dashboard'a yönlendir ───────────────────────────── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
