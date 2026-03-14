/**
 * GirisYap — Obsidian Vault Login Sayfası
 * Koyu glassmorphism kart, amber gradient vurgular
 * Bootstrap 5 + Bootstrap Icons — harici bağımlılık yok
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'

export default function GirisYap() {
  const navigate = useNavigate()
  const { girisYap } = useAuthStore()

  const [form, setForm]               = useState({ email: '', sifre: '' })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor]   = useState(false)
  const [hata, setHata]               = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (hata) setHata('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.sifre) {
      setHata('E-posta ve şifre zorunludur.')
      return
    }

    setYukleniyor(true)
    setHata('')

    try {
      await girisYap(form.email, form.sifre)
      toast.success('Hoş geldiniz!')
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const mesaj  = err.response?.data?.hata

      if (status === 429) {
        setHata(mesaj || 'Çok fazla hatalı deneme. Lütfen bekleyin.')
      } else if (status === 401) {
        setHata('E-posta adresi veya şifre hatalı.')
      } else if (status === 403) {
        setHata('Hesabınız askıya alınmış. Yöneticinizle iletişime geçin.')
      } else {
        setHata('Bağlantı hatası. Lütfen tekrar deneyin.')
      }
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div
      className="giris-root d-flex flex-column align-items-center justify-content-center min-vh-100"
      style={{ padding: '24px 16px', position: 'relative', zIndex: 1 }}
    >
      <style>{`
        .giris-root .giris-kart {
          background: rgba(13,27,46,0.95);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.4),
            0 2px 8px rgba(0,0,0,0.2);
          animation: slideUp 0.5s ease;
        }
        .giris-root .giris-ust-serit {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          padding: 40px 40px 52px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .giris-root .giris-ikon-kutu {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: rgba(13,27,46,0.4);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(13,27,46,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          position: relative;
          z-index: 1;
        }
        .giris-root .giris-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #ffffff;
          padding: 12px 16px;
          min-height: 44px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          transition: all 0.2s ease;
          width: 100%;
          outline: none;
        }
        .giris-root .giris-input:focus {
          background: rgba(255,255,255,0.08);
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .giris-root .giris-input::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .giris-root .giris-input-group {
          display: flex;
          align-items: stretch;
        }
        .giris-root .giris-input-ikon {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-right: none;
          border-radius: 10px 0 0 10px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          color: rgba(255,255,255,0.45);
          transition: all 0.2s ease;
        }
        .giris-root .giris-input-group:focus-within .giris-input-ikon {
          border-color: #f59e0b;
          color: #f59e0b;
          background: rgba(255,255,255,0.08);
        }
        .giris-root .giris-input-group:focus-within .giris-input {
          border-left-color: transparent;
        }
        .giris-root .giris-input-group .giris-input {
          border-radius: 0 10px 10px 0;
        }
        @media (max-width: 480px) {
          .giris-root .giris-ust-serit { padding: 32px 24px 44px; }
          .giris-root .giris-form-alan { padding: 28px 24px 24px !important; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* ─── Ana Kart ───────────────────────────────────────────────── */}
        <div className="giris-kart">

          {/* Üst Şerit — Amber Gradient */}
          <div className="giris-ust-serit">
            {/* Dekoratif arka plan ikonları */}
            <i className="bi bi-buildings" style={{
              position: 'absolute', right: -20, top: -20,
              fontSize: '10rem', color: '#0d1b2e', opacity: 0.15,
              pointerEvents: 'none', lineHeight: 1,
            }} />
            <i className="bi bi-shield-lock" style={{
              position: 'absolute', left: -15, bottom: -25,
              fontSize: '8rem', color: '#0d1b2e', opacity: 0.12,
              pointerEvents: 'none', lineHeight: 1,
            }} />

            {/* Merkez İkon */}
            <div className="giris-ikon-kutu">
              <i className="bi bi-shield-lock-fill" style={{ fontSize: 32, color: '#f59e0b' }} />
            </div>

            <h1 style={{
              fontSize: '1.7rem', fontWeight: 800,
              color: '#0d1b2e', marginBottom: 6,
              letterSpacing: '-0.02em', position: 'relative', zIndex: 1,
            }}>
              Finans Kalesi
            </h1>
            <p style={{
              fontSize: 13, color: 'rgba(13,27,46,0.6)',
              fontWeight: 600, margin: 0,
              position: 'relative', zIndex: 1,
            }}>
              Güvenli Giriş Portalı
            </p>
          </div>

          {/* Alt Form Alanı */}
          <div className="giris-form-alan" style={{ padding: '36px 40px 32px' }}>

            {/* Hata Mesajı */}
            {hata && (
              <div
                className="d-flex align-items-center gap-2 mb-4 p-3"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 12,
                }}
              >
                <i className="bi bi-shield-x-fill" style={{ color: '#ef4444', fontSize: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{hata}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* E-posta */}
              <div className="mb-3">
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                  E-posta Adresi
                </label>
                <div className="giris-input-group">
                  <div className="giris-input-ikon">
                    <i className="bi bi-person-fill" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="ornek@firma.com"
                    autoComplete="email"
                    autoFocus
                    className="giris-input"
                    required
                  />
                </div>
              </div>

              {/* Şifre */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    Güvenlik Şifresi
                  </label>
                  <Link
                    to="/sifremi-unuttum"
                    style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', textDecoration: 'none' }}
                  >
                    Şifremi unuttum
                  </Link>
                </div>
                <div className="giris-input-group" style={{ position: 'relative' }}>
                  <div className="giris-input-ikon">
                    <i className="bi bi-lock-fill" />
                  </div>
                  <input
                    type={sifreGoster ? 'text' : 'password'}
                    name="sifre"
                    value={form.sifre}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="giris-input"
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setSifreGoster((v) => !v)}
                    style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0,
                      zIndex: 10, background: 'none', border: 'none',
                      padding: '0 14px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f59e0b'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                  >
                    <i className={`bi ${sifreGoster ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>

              {/* Giriş Butonu */}
              <button
                type="submit"
                disabled={yukleniyor}
                className="btn-login"
                style={{ marginTop: 12 }}
              >
                {yukleniyor ? (
                  <>
                    <i className="bi bi-arrow-repeat me-2" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                    Kimlik Doğrulanıyor...
                  </>
                ) : (
                  <>
                    <i className="bi bi-unlock-fill me-2" />
                    Sisteme Giriş Yap
                  </>
                )}
              </button>

            </form>

            {/* Kayıt Linki */}
            <p className="text-center mt-4 mb-3" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Hesabınız yok mu?{' '}
              <Link
                to="/kayit"
                style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}
              >
                Ücretsiz deneyin
              </Link>
            </p>

            {/* AES Güvenlik Notu */}
            <div
              className="d-flex align-items-center justify-content-center gap-2"
              style={{
                padding: '10px 16px',
                background: 'rgba(245,158,11,0.06)',
                borderRadius: 10,
                border: '1px solid rgba(245,158,11,0.1)',
              }}
            >
              <i className="bi bi-shield-check" style={{ color: '#f59e0b', fontSize: 14 }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                AES-256-GCM şifreli güvenli bağlantı
              </span>
            </div>
          </div>
        </div>

        <p className="text-center mt-4" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          © 2026 Finans Kalesi · Tüm hakları saklıdır
        </p>

      </div>
    </div>
  )
}
