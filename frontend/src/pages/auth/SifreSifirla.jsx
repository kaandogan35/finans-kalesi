/**
 * SifreSifirla — ParamGo
 * Mobilde: Native tam ekran
 * Web'de: Mevcut split-screen
 */

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import useTemaStore from '../../stores/temaStore'
import { authApi } from '../../api/auth'
import ParamGoLogo from '../../logo/ParamGoLogo'

const isNative = Capacitor.isNativePlatform() || new URLSearchParams(window.location.search).has('native')
const prefixMap = { paramgo: 'p' }

export default function SifreSifirla() {
  const aktifTema          = useTemaStore((s) => s.aktifTema)
  const p                  = prefixMap[aktifTema] || 'p'
  const navigate           = useNavigate()
  const [searchParams]     = useSearchParams()
  const token              = searchParams.get('token')

  const [email, setEmail]       = useState('')
  const [gonderildi, setGonderildi] = useState(false)

  const [yeniSifre, setYeniSifre]     = useState('')
  const [sifre2, setSifre2]           = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  const [tamamlandi, setTamamlandi]   = useState(false)

  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata]             = useState('')

  const handleGonder = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setHata('E-posta zorunludur.'); return }
    setYukleniyor(true)
    setHata('')
    try {
      await authApi.sifreSifirlaIste(email.trim())
      setGonderildi(true)
    } catch {
      setGonderildi(true)
    } finally {
      setYukleniyor(false)
    }
  }

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
      if (err.response?.status === 400) setHata(mesaj || 'Bu bağlantının süresi dolmuş.')
      else setHata('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  /* ═══════ MOBİL — Native şifre sıfırlama ═══════ */
  if (isNative) {
    return (
      <div className="pm-login-root">
        <div className="pm-login-header">
          <div className="pm-login-logo-wrap">
            <ParamGoLogo size="sm" />
          </div>

          {/* Tamamlandı */}
          {tamamlandi && (
            <>
              <div className="pm-login-success-icon">
                <i className="bi bi-check-lg" />
              </div>
              <h1 className="pm-login-title">Şifre Güncellendi</h1>
              <p className="pm-login-subtitle">Yeni şifrenizle giriş yapabilirsiniz.</p>
            </>
          )}

          {/* Mail gönderildi */}
          {!tamamlandi && !token && gonderildi && (
            <>
              <div className="pm-login-success-icon" style={{ borderColor: '#10B981', background: '#ECFDF5' }}>
                <i className="bi bi-envelope-check" style={{ color: '#10B981' }} />
              </div>
              <h1 className="pm-login-title">Mail Gönderildi</h1>
              <p className="pm-login-subtitle">
                E-posta adresinize sıfırlama bağlantısı gönderdik. Gelen kutunuzu kontrol edin.
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>Bağlantı 30 dakika geçerlidir.</p>
            </>
          )}

          {/* Adım 1: E-posta gir */}
          {!tamamlandi && !token && !gonderildi && (
            <>
              <h1 className="pm-login-title">Şifre Sıfırlama</h1>
              <p className="pm-login-subtitle">E-posta adresinize sıfırlama bağlantısı göndereceğiz.</p>
            </>
          )}

          {/* Adım 2: Yeni şifre */}
          {!tamamlandi && token && (
            <>
              <h1 className="pm-login-title">Yeni Şifre Belirle</h1>
              <p className="pm-login-subtitle">En az 8 karakter, güçlü bir şifre seçin.</p>
            </>
          )}
        </div>

        <div className="pm-login-form-area">
          {hata && (
            <div className="pm-login-error">
              <i className="bi bi-exclamation-circle-fill" />
              <span>{hata}</span>
            </div>
          )}

          {/* Adım 1 Form */}
          {!tamamlandi && !token && !gonderildi && (
            <form onSubmit={handleGonder} noValidate>
              <div className="pm-login-field">
                <label className="pm-login-label">E-posta Adresi</label>
                <div className="pm-login-input-wrap">
                  <i className="bi bi-envelope pm-login-input-icon" />
                  <input
                    type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); setHata('') }}
                    placeholder="ornek@firma.com" autoComplete="email" autoFocus
                    className="pm-login-input"
                  />
                </div>
              </div>
              <button type="submit" className="pm-login-btn" disabled={yukleniyor}>
                {yukleniyor ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>
          )}

          {/* Adım 2 Form */}
          {!tamamlandi && token && (
            <form onSubmit={handleSifirla} noValidate>
              <div className="pm-login-field">
                <label className="pm-login-label">Yeni Şifre</label>
                <div className="pm-login-input-wrap">
                  <i className="bi bi-lock pm-login-input-icon" />
                  <input
                    type={sifreGoster ? 'text' : 'password'}
                    value={yeniSifre}
                    onChange={(e) => { setYeniSifre(e.target.value); setHata('') }}
                    placeholder="En az 8 karakter" autoFocus
                    className="pm-login-input pm-login-input-pwd"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setSifreGoster(v => !v)} className="pm-login-eye">
                    <i className={`bi ${sifreGoster ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>
              <div className="pm-login-field">
                <label className="pm-login-label">Şifre Tekrar</label>
                <div className="pm-login-input-wrap">
                  <i className="bi bi-lock-fill pm-login-input-icon" />
                  <input
                    type="password" value={sifre2}
                    onChange={(e) => { setSifre2(e.target.value); setHata('') }}
                    placeholder="Şifreyi tekrar girin"
                    className="pm-login-input"
                  />
                </div>
              </div>
              <button type="submit" className="pm-login-btn" disabled={yukleniyor}>
                {yukleniyor ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
              </button>
            </form>
          )}

          {/* Giriş sayfasına dön */}
          <Link to="/giris" className="pm-login-back-link">
            <i className="bi bi-arrow-left me-1" />
            Giriş sayfasına dön
          </Link>

          {/* Tamamlandı butonu */}
          {tamamlandi && (
            <button onClick={() => navigate('/giris')} className="pm-login-btn" style={{ marginTop: 16 }}>
              Giriş Sayfasına Git
            </button>
          )}
        </div>

        <div className="pm-login-footer">
          <i className="bi bi-shield-check" />
          <span>256-bit şifreli güvenli bağlantı</span>
        </div>
      </div>
    )
  }

  /* ═══════ WEB — Mevcut tasarım ═══════ */
  return (
    <div className={`${p}-giris-root`}>
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
          <a href="https://paramgo.com" className={`${p}-giris-marka-wrap`}>
            <ParamGoLogo size="md" variant="white" />
          </a>
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
          <p className={`${p}-giris-copyright`}>&copy; 2026 ParamGo &middot; Tüm hakları saklıdır</p>
        </div>
      </div>

      <div className={`${p}-giris-sag`}>
        <div className={`${p}-giris-sag-ic`}>
          <div className={`${p}-giris-kart`}>
            <div className={`${p}-giris-kart-serit`} />
            <div className={`${p}-giris-kart-ic`}>
              <a href="https://paramgo.com" className={`${p}-giris-anasayfa-link`}>
                <i className="bi bi-arrow-left me-1" />Ana Sayfa
              </a>
              <div className="d-flex d-lg-none align-items-center justify-content-center mb-4">
                <ParamGoLogo size="sm" />
              </div>

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
                  <h2 className={`${p}-giris-form-baslik`} style={{ marginBottom: 8 }}>Şifre Güncellendi</h2>
                  <p className={`${p}-giris-form-altbaslik`} style={{ marginBottom: 24 }}>Yeni şifrenizle giriş yapabilirsiniz.</p>
                  <button onClick={() => navigate('/giris')} className={`${p}-giris-btn`}>
                    <i className="bi bi-box-arrow-in-right me-2" />Giriş Sayfasına Git
                  </button>
                </div>
              )}

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
                  <h2 className={`${p}-giris-form-baslik`} style={{ marginBottom: 8 }}>Mail Gönderildi</h2>
                  <p className={`${p}-giris-form-altbaslik`} style={{ marginBottom: 8 }}>
                    E-posta adresinize sıfırlama bağlantısı gönderdik.
                  </p>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Bağlantı 30 dakika geçerlidir.</p>
                  <Link to="/giris" className={`${p}-giris-kayit-link`}>Giriş sayfasına dön</Link>
                </div>
              )}

              {!tamamlandi && !token && !gonderildi && (
                <>
                  <div className={`${p}-giris-form-baslik-wrap`}>
                    <div className={`${p}-giris-form-ikon`}><i className="bi bi-key" /></div>
                    <h1 className={`${p}-giris-form-baslik`}>Şifre Sıfırlama</h1>
                    <p className={`${p}-giris-form-altbaslik`}>E-posta adresinize sıfırlama bağlantısı göndereceğiz.</p>
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
                        <span className={`${p}-giris-alan-ikon`}><i className="bi bi-envelope" /></span>
                        <input type="email" value={email}
                          onChange={(e) => { setEmail(e.target.value); setHata('') }}
                          placeholder="ornek@firma.com" autoComplete="email" autoFocus
                          className={`${p}-giris-input`} required />
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

              {!tamamlandi && token && (
                <>
                  <div className={`${p}-giris-form-baslik-wrap`}>
                    <div className={`${p}-giris-form-ikon`}><i className="bi bi-shield-lock" /></div>
                    <h1 className={`${p}-giris-form-baslik`}>Yeni Şifre Belirle</h1>
                    <p className={`${p}-giris-form-altbaslik`}>En az 8 karakter, güçlü bir şifre seçin.</p>
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
                        <span className={`${p}-giris-alan-ikon`}><i className="bi bi-lock" /></span>
                        <input type={sifreGoster ? 'text' : 'password'} value={yeniSifre}
                          onChange={(e) => { setYeniSifre(e.target.value); setHata('') }}
                          placeholder="En az 8 karakter" autoFocus
                          className={`${p}-giris-input ${p}-giris-input-sifre`} required />
                        <button type="button" tabIndex={-1}
                          onClick={() => setSifreGoster(v => !v)} className={`${p}-giris-sifre-toggle`}>
                          <i className={`bi ${sifreGoster ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className={`${p}-giris-label`}>Şifre Tekrar</label>
                      <div className={`${p}-giris-alan`}>
                        <span className={`${p}-giris-alan-ikon`}><i className="bi bi-lock-fill" /></span>
                        <input type="password" value={sifre2}
                          onChange={(e) => { setSifre2(e.target.value); setHata('') }}
                          placeholder="Şifreyi tekrar girin"
                          className={`${p}-giris-input`} required />
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

              {!tamamlandi && (
                <p className={`${p}-giris-kayit-text text-center mt-4 mb-0`}>
                  <Link to="/giris" className={`${p}-giris-kayit-link`}>
                    <i className="bi bi-arrow-left me-1" />Giriş sayfasına dön
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
