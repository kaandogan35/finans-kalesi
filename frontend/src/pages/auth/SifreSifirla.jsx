/**
 * SifreSifirla — ParamGo
 * Adım 1: E-posta gir → mail gönderildi
 * Adım 2: URL'deki ?token= ile yeni şifre belirle
 */

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import useTemaStore from '../../stores/temaStore'
import { authApi } from '../../api/auth'
import ParamGoLogo from '../../logo/ParamGoLogo'

const prefixMap = { paramgo: 'p' }

export default function SifreSifirla() {
  const aktifTema          = useTemaStore((s) => s.aktifTema)
  const p                  = prefixMap[aktifTema] || 'p'
  const navigate           = useNavigate()
  const [searchParams]     = useSearchParams()
  const token              = searchParams.get('token')

  // Adım 1 — E-posta girme
  const [email, setEmail]       = useState('')
  const [gonderildi, setGonderildi] = useState(false)

  // Adım 2 — Yeni şifre
  const [yeniSifre, setYeniSifre]     = useState('')
  const [sifre2, setSifre2]           = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  const [tamamlandi, setTamamlandi]   = useState(false)

  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata]             = useState('')

  // ── Adım 1: E-posta gönder ────────────────────────────────────
  const handleGonder = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setHata('E-posta zorunludur.'); return }
    setYukleniyor(true)
    setHata('')
    try {
      await authApi.sifreSifirlaIste(email.trim())
      setGonderildi(true)
    } catch {
      // API hata döndürse bile kullanıcıya aynı mesajı göster (enumeration koruması)
      setGonderildi(true)
    } finally {
      setYukleniyor(false)
    }
  }

  // ── Adım 2: Yeni şifre kaydet ─────────────────────────────────
  const handleSifirla = async (e) => {
    e.preventDefault()
    if (!yeniSifre || !sifre2) { setHata('Her iki alan da zorunludur.'); return }
    if (yeniSifre.length < 8)  { setHata('Şifre en az 8 karakter olmalıdır.'); return }
    if (yeniSifre !== sifre2)  { setHata('Şifreler eşleşmiyor.'); return }
    setYukleniyor(true)
    setHata('')
    try {
      await authApi.sifreSifirla(token, yeniSifre)
      setTamamlandi(true)
    } catch (err) {
      const mesaj = err.response?.data?.hata
      if (err.response?.status === 400) setHata(mesaj || 'Bu bağlantının süresi dolmuş. Lütfen yeni bir talep oluşturun.')
      else setHata('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className={`${p}-giris-root`}>

      {/* Sol dekoratif panel — GirisYap ile aynı */}
      <div className={`${p}-giris-sol`}>
        <div className={`${p}-giris-sol-cizgi`} />
        {[
          { s: 4, l: '12%', t: '18%', dur: '9s',  del: '0s'   },
          { s: 3, l: '68%', t: '28%', dur: '12s', del: '2.5s' },
          { s: 5, l: '35%', t: '55%', dur: '8s',  del: '1.5s' },
          { s: 3, l: '82%', t: '65%', dur: '14s', del: '4s'   },
          { s: 4, l: '22%', t: '78%', dur: '10s', del: '3s'   },
        ].map((d, i) => (
          <div key={i} className={`${p}-giris-nokta`} style={{
            width: d.s, height: d.s, left: d.l, top: d.t,
            animationDuration: d.dur, animationDelay: d.del,
          }} />
        ))}

        <div className={`${p}-giris-sol-anim-1`}>
          <div className={`${p}-giris-marka-wrap`}>
            <ParamGoLogo size="md" variant="white" />
          </div>
        </div>

        <div className={`${p}-giris-sol-anim-2`}>
          <div className={`${p}-giris-buyuk-ikon`}>
            <div className={`${p}-giris-halka-1`} />
            <div className={`${p}-giris-halka-2`} />
            <i className={`bi bi-key ${p}-giris-bank-ikon`} />
          </div>
          <h2 className={`${p}-giris-vizyon-baslik`}>
            Şifrenizi <br />
            <span className={`${p}-giris-vizyon-vurgu`}>Güvenle</span> Sıfırlayın
          </h2>
          <p className={`${p}-giris-vizyon-aciklama`}>
            Birkaç adımda şifrenizi yenileyin ve hesabınıza yeniden erişin.
          </p>
        </div>

        <div className={`${p}-giris-ozellik-wrap`}>
          <p className={`${p}-giris-copyright`}>
            &copy; 2026 ParamGo &middot; Tüm hakları saklıdır
          </p>
        </div>
      </div>

      {/* Sağ form paneli */}
      <div className={`${p}-giris-sag`}>
        <div className={`${p}-giris-sag-ic`}>
          <div className={`${p}-giris-kart`}>
            <div className={`${p}-giris-kart-serit`} />
            <div className={`${p}-giris-kart-ic`}>

              {/* Mobil logo */}
              <div className="d-flex d-lg-none align-items-center justify-content-center mb-4">
                <ParamGoLogo size="sm" />
              </div>

              {/* ── DURUM: Tamamlandı ─────────────────────────── */}
              {tamamlandi && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#f0fdf4', border: '2px solid #16a34a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <i className="bi bi-check-lg" style={{ fontSize: 24, color: '#16a34a' }} />
                  </div>
                  <h2 className={`${p}-giris-form-baslik`} style={{ marginBottom: 8 }}>
                    Şifre Güncellendi
                  </h2>
                  <p className={`${p}-giris-form-altbaslik`} style={{ marginBottom: 24 }}>
                    Yeni şifrenizle giriş yapabilirsiniz.
                  </p>
                  <button
                    onClick={() => navigate('/giris')}
                    className={`${p}-giris-btn`}
                  >
                    <i className="bi bi-box-arrow-in-right me-2" />
                    Giriş Sayfasına Git
                  </button>
                </div>
              )}

              {/* ── DURUM: Mail gönderildi ───────────────────── */}
              {!tamamlandi && !token && gonderildi && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#ECFDF5', border: '2px solid #10B981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <i className="bi bi-envelope-check" style={{ fontSize: 22, color: '#10B981' }} />
                  </div>
                  <h2 className={`${p}-giris-form-baslik`} style={{ marginBottom: 8 }}>
                    Mail Gönderildi
                  </h2>
                  <p className={`${p}-giris-form-altbaslik`} style={{ marginBottom: 8 }}>
                    E-posta adresinize sıfırlama bağlantısı gönderdik.
                    Gelen kutunuzu kontrol edin (spam klasörünü de kontrol etmeyi unutmayın).
                  </p>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
                    Bağlantı 30 dakika geçerlidir.
                  </p>
                  <Link to="/giris" className={`${p}-giris-kayit-link`}>
                    Giriş sayfasına dön
                  </Link>
                </div>
              )}

              {/* ── ADIM 1: E-posta gir ─────────────────────── */}
              {!tamamlandi && !token && !gonderildi && (
                <>
                  <div className={`${p}-giris-form-baslik-wrap`}>
                    <div className={`${p}-giris-form-ikon`}>
                      <i className="bi bi-key" />
                    </div>
                    <h1 className={`${p}-giris-form-baslik`}>
                      Şifre Sıfırlama
                    </h1>
                    <p className={`${p}-giris-form-altbaslik`}>
                      E-posta adresinize sıfırlama bağlantısı göndereceğiz.
                    </p>
                  </div>

                  {hata && (
                    <div className={`${p}-giris-hata d-flex align-items-center gap-2 mb-4 p-3`}>
                      <i className={`bi bi-exclamation-triangle-fill ${p}-giris-hata-ikon`} />
                      <span className={`${p}-giris-hata-metin`}>{hata}</span>
                    </div>
                  )}

                  <form onSubmit={handleGonder} noValidate>
                    <div className="mb-4">
                      <label className={`${p}-giris-label`}>E-posta Adresi</label>
                      <div className={`${p}-giris-alan`}>
                        <span className={`${p}-giris-alan-ikon`}>
                          <i className="bi bi-envelope" />
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setHata('') }}
                          placeholder="ornek@firma.com"
                          autoComplete="email"
                          autoFocus
                          className={`${p}-giris-input`}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className={`${p}-giris-btn`} disabled={yukleniyor}>
                      {yukleniyor ? (
                        <><i className={`bi bi-arrow-repeat me-2 ${p}-giris-spin`} />Gönderiliyor...</>
                      ) : (
                        <><i className="bi bi-send me-2" />Sıfırlama Bağlantısı Gönder</>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* ── ADIM 2: Yeni şifre gir ──────────────────── */}
              {!tamamlandi && token && (
                <>
                  <div className={`${p}-giris-form-baslik-wrap`}>
                    <div className={`${p}-giris-form-ikon`}>
                      <i className="bi bi-shield-lock" />
                    </div>
                    <h1 className={`${p}-giris-form-baslik`}>
                      Yeni Şifre Belirle
                    </h1>
                    <p className={`${p}-giris-form-altbaslik`}>
                      En az 8 karakter, güçlü bir şifre seçin.
                    </p>
                  </div>

                  {hata && (
                    <div className={`${p}-giris-hata d-flex align-items-center gap-2 mb-4 p-3`}>
                      <i className={`bi bi-exclamation-triangle-fill ${p}-giris-hata-ikon`} />
                      <span className={`${p}-giris-hata-metin`}>{hata}</span>
                    </div>
                  )}

                  <form onSubmit={handleSifirla} noValidate>
                    <div className="mb-3">
                      <label className={`${p}-giris-label`}>Yeni Şifre</label>
                      <div className={`${p}-giris-alan`} style={{ position: 'relative' }}>
                        <span className={`${p}-giris-alan-ikon`}>
                          <i className="bi bi-lock" />
                        </span>
                        <input
                          type={sifreGoster ? 'text' : 'password'}
                          value={yeniSifre}
                          onChange={(e) => { setYeniSifre(e.target.value); setHata('') }}
                          placeholder="En az 8 karakter"
                          autoFocus
                          className={`${p}-giris-input ${p}-giris-input-sifre`}
                          required
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setSifreGoster(v => !v)}
                          className={`${p}-giris-sifre-toggle`}
                        >
                          <i className={`bi ${sifreGoster ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className={`${p}-giris-label`}>Şifre Tekrar</label>
                      <div className={`${p}-giris-alan`}>
                        <span className={`${p}-giris-alan-ikon`}>
                          <i className="bi bi-lock-fill" />
                        </span>
                        <input
                          type={sifreGoster ? 'text' : 'password'}
                          value={sifre2}
                          onChange={(e) => { setSifre2(e.target.value); setHata('') }}
                          placeholder="Şifrenizi tekrar girin"
                          className={`${p}-giris-input`}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className={`${p}-giris-btn`} disabled={yukleniyor}>
                      {yukleniyor ? (
                        <><i className={`bi bi-arrow-repeat me-2 ${p}-giris-spin`} />Güncelleniyor...</>
                      ) : (
                        <><i className="bi bi-check-circle me-2" />Şifremi Güncelle</>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* Geri dön linki */}
              {!tamamlandi && (
                <p className={`${p}-giris-kayit-text text-center mt-4 mb-0`}>
                  <Link to="/giris" className={`${p}-giris-kayit-link`}>
                    <i className="bi bi-arrow-left me-1" />
                    Giriş sayfasına dön
                  </Link>
                </p>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
