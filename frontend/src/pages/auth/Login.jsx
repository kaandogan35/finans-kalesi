/**
 * Login.jsx — Giriş Sayfası
 * PHP varlik_hesabi.php tasarım diline sadık, açık/soft tema
 * Kurumsal Lacivert (#123F59) + Premium Light Glass
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'

export default function Login() {
  const navigate  = useNavigate()
  const { girisYap } = useAuthStore()

  const [form, setForm]               = useState({ email: '', sifre: '' })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor]   = useState(false)
  const [hata, setHata]               = useState('')

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    if (hata) setHata('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.sifre) { setHata('Kullanıcı adı ve şifre zorunludur.'); return }
    setYukleniyor(true); setHata('')
    try {
      await girisYap(form.email, form.sifre)
      toast.success('Hoş geldiniz!')
      navigate('/dashboard')
    } catch (err) {
      const s = err.response?.status, m = err.response?.data?.hata
      if (s === 429) setHata(m || 'Çok fazla hatalı deneme. Lütfen bekleyin.')
      else if (s === 401) setHata('Kullanıcı adı veya şifre hatalı.')
      else if (s === 403) setHata('Hesabınız askıya alınmış.')
      else setHata('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally { setYukleniyor(false) }
  }

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center min-vh-100"
      style={{ padding: '24px 16px' }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* ─── Ana Kart ───────────────────────────────────────────────── */}
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Üst Şerit — Brand Gradient */}
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-dark) 0%, #1a5b80 100%)',
            padding: '40px 40px 52px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Dekoratif büyük ikon (PHP glass-card köşe ikonuna benzer) */}
            <i className="bi bi-buildings" style={{
              position: 'absolute', right: -20, top: -20,
              fontSize: '10rem', color: '#fff', opacity: 0.06,
              pointerEvents: 'none', lineHeight: 1,
            }} />
            <i className="bi bi-shield-lock" style={{
              position: 'absolute', left: -15, bottom: -25,
              fontSize: '8rem', color: '#fff', opacity: 0.05,
              pointerEvents: 'none', lineHeight: 1,
            }} />

            {/* Merkez İkon */}
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                position: 'relative', zIndex: 1,
              }}
            >
              <i className="bi bi-buildings-fill" style={{ fontSize: 32, color: '#fff' }} />
            </div>

            <h1 style={{
              fontSize: '1.7rem', fontWeight: 800,
              color: '#ffffff', marginBottom: 6,
              letterSpacing: '-0.02em', position: 'relative', zIndex: 1,
            }}>
              Kurumsal Yönetim
            </h1>
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.7)',
              fontWeight: 500, margin: 0,
              position: 'relative', zIndex: 1,
            }}>
              Finans Kalesi — Güvenli Giriş Portalı
            </p>
          </div>

          {/* Alt Form Alanı */}
          <div style={{ padding: '36px 40px 32px' }}>

            {/* Hata Mesajı */}
            {hata && (
              <div
                className="d-flex align-items-center gap-2 mb-4 p-3"
                style={{
                  background: 'rgba(244,63,94,0.06)',
                  border: '1px solid rgba(244,63,94,0.2)',
                  borderRadius: 12,
                }}
              >
                <i className="bi bi-shield-x-fill" style={{ color: '#f43f5e', fontSize: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#be123c', fontWeight: 600 }}>{hata}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Kullanıcı Adı */}
              <div className="mb-3">
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  Kullanıcı Adı
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-person-fill" style={{ color: 'var(--brand-dark)' }} />
                  </span>
                  <input
                    id="email"
                    type="text"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="E-posta veya kullanıcı adı"
                    autoComplete="username"
                    autoFocus
                    className="form-control form-control-custom"
                    required
                  />
                </div>
              </div>

              {/* Güvenlik Şifresi */}
              <div className="mb-4">
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  Güvenlik Şifresi
                </label>
                <div className="input-group" style={{ position: 'relative' }}>
                  <span className="input-group-text">
                    <i className="bi bi-lock-fill" style={{ color: 'var(--brand-dark)' }} />
                  </span>
                  <input
                    id="sifre"
                    type={sifreGoster ? 'text' : 'password'}
                    name="sifre"
                    value={form.sifre}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="form-control form-control-custom"
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setSifreGoster(v => !v)}
                    style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0,
                      zIndex: 10, background: 'none', border: 'none',
                      padding: '0 14px', color: '#94a3b8', cursor: 'pointer',
                    }}
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
                style={{ marginTop: 4 }}
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

            {/* Güvenlik Notu */}
            <div
              className="d-flex align-items-center justify-content-center gap-2 mt-4"
              style={{
                padding: '10px 16px',
                background: 'rgba(18,63,89,0.04)',
                borderRadius: 10,
                border: '1px solid rgba(18,63,89,0.08)',
              }}
            >
              <i className="bi bi-shield-check" style={{ color: 'var(--brand-dark)', fontSize: 14 }} />
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                AES-256-GCM şifreli güvenli bağlantı
              </span>
            </div>
          </div>
        </div>

        <p className="text-center mt-4" style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
          © 2026 Finans Kalesi · Tüm hakları saklıdır
        </p>

      </div>
    </div>
  )
}
