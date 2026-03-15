/**
 * GirisYap — Finans Kalesi Premium Login
 * Split-screen: Sol dekoratif panel + Sağ glassmorphism form
 * Obsidian Vault koyu tema | Bootstrap 5 CSS only
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'

const OZELLIKLER = [
  { ikon: 'bi-people-fill',         baslik: 'Cari Hesaplar',    aciklama: 'Müşteri & tedarikçi takibi' },
  { ikon: 'bi-file-earmark-text-fill', baslik: 'Çek & Senet',   aciklama: 'Vade takibi, otomatik uyarı' },
  { ikon: 'bi-cash-stack',          baslik: 'Kasa Yönetimi',    aciklama: 'Anlık nakit akış kontrolü'   },
]

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
    if (!form.email || !form.sifre) { setHata('E-posta ve şifre zorunludur.'); return }
    setYukleniyor(true)
    setHata('')
    try {
      await girisYap(form.email, form.sifre)
      toast.success('Hoş geldiniz!')
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const mesaj  = err.response?.data?.hata
      if      (status === 429) setHata(mesaj || 'Çok fazla hatalı deneme. Lütfen bekleyin.')
      else if (status === 401) setHata('E-posta adresi veya şifre hatalı.')
      else if (status === 403) setHata('Hesabınız askıya alınmış. Yöneticinizle iletişime geçin.')
      else                     setHata('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally { setYukleniyor(false) }
  }

  return (
    <div className="fk-giris-root">
      <style>{`
        /* ── Temel Yapı ─────────────────────────────────────── */
        .fk-giris-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Outfit', sans-serif;
          background: linear-gradient(160deg, #0d1b2e 0%, #0a1628 50%, #0d1f35 100%);
          background-attachment: fixed;
          overflow: hidden;
          position: relative;
        }

        /* Arka plan ışık topu */
        .fk-giris-root::before {
          content: '';
          position: fixed;
          width: 800px; height: 800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 60%);
          top: -200px; right: -200px;
          pointer-events: none;
        }

        /* ── Sol Dekoratif Panel ────────────────────────────── */
        .fk-sol {
          flex: 0 0 44%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 44px 48px;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(245,158,11,0.07);
        }

        /* Izgara desen */
        .fk-sol::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Alt sağ ışık */
        .fk-sol::after {
          content: '';
          position: absolute;
          width: 480px; height: 480px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%);
          bottom: -160px; right: -120px;
          pointer-events: none;
        }

        /* Köşegen aksan çizgisi */
        .fk-sol-cizgi {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(245,158,11,0.3) 30%,
            rgba(245,158,11,0.15) 70%,
            transparent 100%
          );
        }

        /* ── Sağ Form Paneli ────────────────────────────────── */
        .fk-sag {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          position: relative;
        }

        /* Form arkası glow */
        .fk-sag::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 60%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        /* ── Form Kart ──────────────────────────────────────── */
        .fk-kart {
          width: 100%; max-width: 440px;
          background: rgba(255,255,255,0.038);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(245,158,11,0.04),
            0 24px 64px rgba(0,0,0,0.45),
            0 4px 16px rgba(0,0,0,0.2);
          animation: fkKartGir 0.55s cubic-bezier(0.22,1,0.36,1) both;
          position: relative; z-index: 1;
        }

        /* Amber üst şerit */
        .fk-kart-serit {
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #f59e0b 25%, #f59e0b 75%, transparent 100%);
        }

        .fk-kart-ic { padding: 36px 40px 32px; }

        /* ── Input Sistemi ──────────────────────────────────── */
        .fk-alan {
          position: relative;
          display: flex;
          align-items: center;
        }

        .fk-alan-ikon {
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 48px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.3);
          font-size: 15px;
          pointer-events: none;
          transition: color 0.2s;
          z-index: 1;
        }

        .fk-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          padding: 13px 48px;
          min-height: 48px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 500;
          transition: all 0.2s;
          outline: none;
        }
        .fk-input:focus {
          background: rgba(255,255,255,0.07);
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .fk-input::placeholder { color: rgba(255,255,255,0.22); }

        .fk-alan:focus-within .fk-alan-ikon { color: #f59e0b; }

        /* ── Giriş Butonu ───────────────────────────────────── */
        .fk-btn-giris {
          width: 100%; min-height: 50px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: none; border-radius: 12px;
          color: #0d1b2e;
          font-family: 'Outfit', sans-serif;
          font-size: 15px; font-weight: 800;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.22s;
          box-shadow: 0 4px 20px rgba(245,158,11,0.3);
          position: relative; overflow: hidden;
        }
        .fk-btn-giris::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent 60%);
          opacity: 0; transition: opacity 0.2s;
        }
        .fk-btn-giris:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(245,158,11,0.45);
        }
        .fk-btn-giris:hover:not(:disabled)::before { opacity: 1; }
        .fk-btn-giris:active:not(:disabled) { transform: translateY(0); }
        .fk-btn-giris:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ── Özellik Kartları (Sol Panel) ───────────────────── */
        .fk-ozellik {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 16px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 14px;
          transition: all 0.22s;
        }
        .fk-ozellik:hover {
          background: rgba(255,255,255,0.045);
          border-color: rgba(245,158,11,0.18);
          transform: translateX(5px);
        }

        /* ── Yüzen Noktalar ─────────────────────────────────── */
        .fk-nokta {
          position: absolute;
          border-radius: 50%;
          background: rgba(245,158,11,0.5);
          animation: fkNokta linear infinite;
          pointer-events: none;
        }

        /* ── Animasyonlar ───────────────────────────────────── */
        @keyframes fkKartGir {
          from { transform: translateY(28px) scale(0.98); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }

        @keyframes fkSolGir {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes fkNokta {
          0%   { transform: translateY(0);     opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-70px); opacity: 0; }
        }

        @keyframes fkDon {
          to { transform: rotate(360deg); }
        }

        @keyframes fkNabiz {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.9;  transform: scale(1.04); }
        }

        @keyframes fkHataGir {
          from { transform: translateY(-6px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* ── Responsive ─────────────────────────────────────── */
        @media (max-width: 991px) {
          .fk-sol { display: none !important; }
        }
        @media (max-width: 480px) {
          .fk-kart-ic { padding: 28px 22px 24px; }
          .fk-kart { border-radius: 20px; }
        }
      `}</style>

      {/* ───── Sol Dekoratif Panel ───────────────────────────────────── */}
      <div className="fk-sol">
        <div className="fk-sol-cizgi" />

        {/* Yüzen noktalar */}
        {[
          { s: 4, l: '12%', t: '18%', dur: '9s',  del: '0s'  },
          { s: 3, l: '68%', t: '28%', dur: '12s', del: '2.5s' },
          { s: 5, l: '35%', t: '55%', dur: '8s',  del: '1.5s' },
          { s: 3, l: '82%', t: '65%', dur: '14s', del: '4s'   },
          { s: 4, l: '22%', t: '78%', dur: '10s', del: '3s'   },
        ].map((d, i) => (
          <div key={i} className="fk-nokta" style={{
            width: d.s, height: d.s, left: d.l, top: d.t,
            animationDuration: d.dur, animationDelay: d.del,
          }} />
        ))}

        {/* Marka logosu */}
        <div style={{ position: 'relative', zIndex: 1,
          animation: 'fkSolGir 0.5s ease 0.1s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(245,158,11,0.35)',
            }}>
              <i className="bi bi-shield-lock-fill" style={{ color: '#0d1b2e', fontSize: 21 }} />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff',
                letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Finans Kalesi
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(245,158,11,0.65)',
                textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                KOBİ Finans Yönetimi
              </div>
            </div>
          </div>
        </div>

        {/* Merkez vizyon alanı */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center',
          animation: 'fkSolGir 0.5s ease 0.2s both' }}>

          {/* Büyük ikon */}
          <div style={{
            width: 116, height: 116, borderRadius: 30,
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            position: 'relative',
            animation: 'fkNabiz 3.5s ease-in-out infinite',
          }}>
            {/* Dış halkalar */}
            <div style={{
              position: 'absolute', inset: -14, borderRadius: 44,
              border: '1px solid rgba(245,158,11,0.07)',
            }} />
            <div style={{
              position: 'absolute', inset: -28, borderRadius: 58,
              border: '1px solid rgba(245,158,11,0.035)',
            }} />
            <i className="bi bi-bank" style={{ fontSize: 50, color: '#f59e0b' }} />
          </div>

          <h2 style={{
            fontSize: '1.9rem', fontWeight: 800, color: '#fff',
            letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 14,
          }}>
            Finansal Gücünüzü<br />
            <span style={{ color: '#f59e0b' }}>Tek Yerden</span> Yönetin
          </h2>
          <p style={{
            fontSize: 13.5, color: 'rgba(255,255,255,0.42)',
            fontWeight: 500, lineHeight: 1.65,
            maxWidth: 300, margin: '0 auto',
          }}>
            Nakit akışı, çek-senet takibi ve cari hesaplarınızı
            güvenli bir platformdan kontrol edin.
          </p>
        </div>

        {/* Özellik kartları */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {OZELLIKLER.map((o, i) => (
              <div key={i} className="fk-ozellik" style={{
                animation: `fkSolGir 0.5s ease ${0.3 + i * 0.1}s both`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(245,158,11,0.09)',
                  border: '1px solid rgba(245,158,11,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bi ${o.ikon}`} style={{ color: '#f59e0b', fontSize: 15 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 1 }}>
                    {o.baslik}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    {o.aciklama}
                  </div>
                </div>
                <i className="bi bi-check-circle-fill"
                   style={{ color: '#10b981', fontSize: 14, flexShrink: 0 }} />
              </div>
            ))}
          </div>

          <p style={{
            fontSize: 11, color: 'rgba(255,255,255,0.25)',
            textAlign: 'center', fontWeight: 500, margin: 0,
          }}>
            © 2026 Finans Kalesi · Tüm hakları saklıdır
          </p>
        </div>
      </div>

      {/* ───── Sağ Form Paneli ──────────────────────────────────────── */}
      <div className="fk-sag">
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Form Kart */}
          <div className="fk-kart">
            <div className="fk-kart-serit" />

            <div className="fk-kart-ic">

              {/* Mobil logo (lg altında görünür) */}
              <div className="d-flex d-lg-none align-items-center justify-content-center gap-2 mb-4">
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi bi-shield-lock-fill" style={{ color: '#0d1b2e', fontSize: 15 }} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                  Finans Kalesi
                </span>
              </div>

              {/* Form başlığı */}
              <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 15,
                  background: 'rgba(245,158,11,0.09)',
                  border: '1px solid rgba(245,158,11,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <i className="bi bi-person-lock" style={{ color: '#f59e0b', fontSize: 23 }} />
                </div>
                <h1 style={{
                  fontSize: '1.4rem', fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.025em', marginBottom: 6,
                }}>
                  Hesabınıza Giriş Yapın
                </h1>
                <p style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.38)',
                  fontWeight: 500, margin: 0,
                }}>
                  E-posta ve şifrenizle devam edin
                </p>
              </div>

              {/* Hata mesajı */}
              {hata && (
                <div className="d-flex align-items-center gap-2 mb-4 p-3" style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.22)',
                  borderRadius: 12,
                  animation: 'fkHataGir 0.3s ease',
                }}>
                  <i className="bi bi-exclamation-triangle-fill"
                     style={{ color: '#ef4444', fontSize: 14, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{hata}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>

                {/* E-posta */}
                <div className="mb-3">
                  <label style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
                    letterSpacing: '0.08em', marginBottom: 8,
                  }}>
                    E-posta Adresi
                  </label>
                  <div className="fk-alan">
                    <span className="fk-alan-ikon">
                      <i className="bi bi-envelope" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="ornek@firma.com"
                      autoComplete="email"
                      autoFocus
                      className="fk-input"
                      required
                    />
                  </div>
                </div>

                {/* Şifre */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label style={{
                      fontSize: 11, fontWeight: 700,
                      color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
                      letterSpacing: '0.08em', margin: 0,
                    }}>
                      Güvenlik Şifresi
                    </label>
                    <Link to="/sifremi-unuttum" style={{
                      fontSize: 12, fontWeight: 600, color: '#f59e0b', textDecoration: 'none',
                    }}>
                      Şifremi unuttum
                    </Link>
                  </div>
                  <div className="fk-alan" style={{ position: 'relative' }}>
                    <span className="fk-alan-ikon">
                      <i className="bi bi-lock" />
                    </span>
                    <input
                      type={sifreGoster ? 'text' : 'password'}
                      name="sifre"
                      value={form.sifre}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="fk-input"
                      style={{ paddingRight: 48 }}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setSifreGoster(v => !v)}
                      style={{
                        position: 'absolute', right: 0, top: 0, bottom: 0,
                        background: 'none', border: 'none',
                        padding: '0 14px',
                        color: 'rgba(255,255,255,0.28)',
                        cursor: 'pointer', zIndex: 2,
                        fontSize: 15, borderRadius: '0 12px 12px 0',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
                    >
                      <i className={`bi ${sifreGoster ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>

                {/* Giriş Butonu */}
                <button type="submit" className="fk-btn-giris" disabled={yukleniyor}>
                  {yukleniyor ? (
                    <>
                      <i className="bi bi-arrow-repeat me-2" style={{
                        display: 'inline-block',
                        animation: 'fkDon 0.8s linear infinite',
                      }} />
                      Kimlik Doğrulanıyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2" />
                      Sisteme Giriş Yap
                    </>
                  )}
                </button>

              </form>

              {/* Kayıt linki */}
              <p className="text-center mt-4 mb-3" style={{
                fontSize: 13, color: 'rgba(255,255,255,0.42)', fontWeight: 500,
              }}>
                Hesabınız yok mu?{' '}
                <Link to="/kayit" style={{
                  color: '#f59e0b', fontWeight: 700, textDecoration: 'none',
                }}>
                  Ücretsiz deneyin
                </Link>
              </p>

              {/* Güvenlik notu */}
              <div className="d-flex align-items-center justify-content-center gap-2" style={{
                padding: '9px 14px',
                background: 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.1)',
                borderRadius: 10,
              }}>
                <i className="bi bi-shield-check" style={{ color: '#f59e0b', fontSize: 13 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                  AES-256-GCM şifreli güvenli bağlantı
                </span>
              </div>
            </div>
          </div>

          {/* Mobil alt not */}
          <p className="d-lg-none text-center mt-4" style={{
            fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500,
          }}>
            © 2026 Finans Kalesi · Tüm hakları saklıdır
          </p>
        </div>
      </div>
    </div>
  )
}
