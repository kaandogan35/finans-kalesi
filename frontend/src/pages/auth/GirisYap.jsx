/**
 * GirisYap — ParamGo Login
 * Mobilde: Papara tarzı native tam ekran
 * Web'de: Mevcut split-screen banking teması
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import useAuthStore from '../../stores/authStore'
import useTemaStore from '../../stores/temaStore'
import ParamGoLogo from '../../logo/ParamGoLogo'
import { authApi } from '../../api/auth'

const isNative = Capacitor.isNativePlatform() || new URLSearchParams(window.location.search).has('native')
const prefixMap = { paramgo: 'p' }

const OZELLIKLER = [
  { ikon: 'bi-people-fill',         baslik: 'Cari Hesaplar',    aciklama: 'Müşteri & tedarikçi takibi' },
  { ikon: 'bi-file-earmark-text-fill', baslik: 'Çek & Senet',   aciklama: 'Vade takibi, otomatik uyarı' },
  { ikon: 'bi-cash-stack',          baslik: 'Kasa Yönetimi',    aciklama: 'Anlık nakit akış kontrolü'   },
]

export default function GirisYap() {
  const navigate = useNavigate()
  const { girisYap } = useAuthStore()
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'p'

  const { sosyalGiris } = useAuthStore()

  const [form, setForm]               = useState({ email: '', sifre: '' })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor]   = useState(false)
  const [hata, setHata]               = useState('')
  const [sosyalYukleniyor, setSosyalYukleniyor] = useState('')

  // Auth ekranı koyu (#0B1120) — status bar ikonları beyaz olmalı (doğrudan import)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Light }).catch(() => {})
    }).catch(() => {})
  }, [])

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

  const handleAppleGiris = async () => {
    setSosyalYukleniyor('apple')
    setHata('')
    try {
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
      const result = await SignInWithApple.authorize({
        clientId: 'com.paramgo.app',
        redirectURI: 'https://paramgo.com',
        scopes: 'email name',
        state: '',
        nonce: '',
      })
      const r = result.response
      const yanit = await authApi.appleGiris(r.identityToken, r.givenName || '', r.familyName || '', r.email || '')
      const { kullanici, tokenlar } = yanit.data.veri
      sosyalGiris(kullanici, tokenlar)
      toast.success('Hoş geldiniz!')
      navigate('/dashboard')
    } catch (err) {
      if (err?.message?.includes('cancel') || err?.message?.includes('1001')) return
      setHata('Apple ile giriş yapılamadı. Tekrar deneyin.')
    } finally {
      setSosyalYukleniyor('')
    }
  }

  const handleGoogleGiris = async () => {
    setSosyalYukleniyor('google')
    setHata('')
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
      const user = await GoogleAuth.signIn()
      const yanit = await authApi.googleGiris(user.authentication.idToken)
      const { kullanici, tokenlar } = yanit.data.veri
      sosyalGiris(kullanici, tokenlar)
      toast.success('Hoş geldiniz!')
      navigate('/dashboard')
    } catch (err) {
      if (err?.message?.includes('cancel') || err?.message?.includes('12501')) return
      setHata('Google ile giriş yapılamadı. Tekrar deneyin.')
    } finally {
      setSosyalYukleniyor('')
    }
  }

  /* ═══════ MOBİL — Dark native giriş ekranı ═══════ */
  if (isNative) {
    return (
      <div className="pm-auth-screen">
        {/* Dekoratif arka plan */}
        <div className="pm-auth-bg-glow" />
        <div className="pm-auth-bg-glow2" />

        {/* Üst alan — Logo + Karşılama */}
        <div className="pm-auth-hero">
          <ParamGoLogo size="lg" variant="dark" />
          <h1 className="pm-auth-title">Hoş Geldiniz</h1>
          <p className="pm-auth-desc">Finansal kontrolünüz burada başlıyor</p>
        </div>

        {/* Form kartı */}
        <div className="pm-auth-card">
          {hata && (
            <div className="pm-auth-error">
              <i className="bi bi-exclamation-circle-fill" />
              <span>{hata}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="pm-auth-field">
              <div className="pm-auth-input-wrap">
                <i className="bi bi-envelope pm-auth-input-icon" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="E-posta adresi"
                  autoComplete="email"
                  className="pm-auth-input"
                />
              </div>
            </div>

            <div className="pm-auth-field">
              <div className="pm-auth-input-wrap">
                <i className="bi bi-lock pm-auth-input-icon" />
                <input
                  type={sifreGoster ? 'text' : 'password'}
                  name="sifre"
                  value={form.sifre}
                  onChange={handleChange}
                  placeholder="Şifre"
                  autoComplete="current-password"
                  className="pm-auth-input pm-auth-input-pwd"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setSifreGoster(v => !v)}
                  className="pm-auth-eye"
                >
                  <i className={`bi ${sifreGoster ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <div className="pm-auth-actions-row">
              <Link to="/sifre-sifirla" className="pm-auth-forgot">Şifremi unuttum</Link>
            </div>

            <button type="submit" className="pm-auth-btn-primary" disabled={yukleniyor}>
              {yukleniyor ? (
                <><i className="bi bi-arrow-repeat pm-spin" style={{marginRight:8}} />Giriş yapılıyor...</>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <div className="pm-auth-divider">
            <span>veya</span>
          </div>

          <Link to="/kayit" className="pm-auth-btn-ghost">
            Yeni Hesap Oluştur
          </Link>

          {/* Sosyal Giriş */}
          <div className="pm-auth-divider" style={{ marginTop: 20 }}>
            <span>veya sosyal ile giriş</span>
          </div>

          <div className="pm-auth-social-row">
            <button
              type="button"
              className="pm-auth-btn-social pm-auth-btn-apple"
              onClick={handleAppleGiris}
              disabled={!!sosyalYukleniyor}
            >
              {sosyalYukleniyor === 'apple' ? (
                <i className="bi bi-arrow-repeat pm-spin" />
              ) : (
                <i className="bi bi-apple" />
              )}
              <span>Apple ile Giriş</span>
            </button>

            <button
              type="button"
              className="pm-auth-btn-social pm-auth-btn-google"
              onClick={handleGoogleGiris}
              disabled={!!sosyalYukleniyor}
            >
              {sosyalYukleniyor === 'google' ? (
                <i className="bi bi-arrow-repeat pm-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>Google ile Giriş</span>
            </button>
          </div>
        </div>

        {/* Alt güvenlik notu */}
        <div className="pm-auth-footer">
          <i className="bi bi-shield-lock-fill" />
          <span>256-bit AES şifreli bağlantı</span>
        </div>
      </div>
    )
  }

  /* ═══════ WEB — Mevcut split-screen banking teması ═══════ */
  return (
    <div className={`${p}-giris-root`}>

      {/* ───── Sol Dekoratif Panel ───────────────────────────────────── */}
      <div className={`${p}-giris-sol`}>
        <div className={`${p}-giris-sol-cizgi`} />

        {/* Yuzen noktalar */}
        {[
          { s: 4, l: '12%', t: '18%', dur: '9s',  del: '0s'  },
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

        {/* Marka logosu */}
        <div className={`${p}-giris-sol-anim-1`}>
          <a href="https://paramgo.com" className={`${p}-giris-marka-wrap`}>
            <ParamGoLogo size="md" variant="white" />
          </a>
        </div>

        {/* Merkez vizyon alani */}
        <div className={`${p}-giris-sol-anim-2`}>
          <div className={`${p}-giris-buyuk-ikon`}>
            <div className={`${p}-giris-halka-1`} />
            <div className={`${p}-giris-halka-2`} />
            <i className={`bi bi-bank ${p}-giris-bank-ikon`} />
          </div>
          <h2 className={`${p}-giris-vizyon-baslik`}>
            Finansal Gücünüzü<br />
            <span className={`${p}-giris-vizyon-vurgu`}>Tek Yerden</span> Yönetin
          </h2>
          <p className={`${p}-giris-vizyon-aciklama`}>
            Nakit akışı, çek-senet takibi ve cari hesaplarınızı
            güvenli bir platformdan kontrol edin.
          </p>
        </div>

        {/* Ozellik kartlari */}
        <div className={`${p}-giris-ozellik-wrap`}>
          <div className={`${p}-giris-ozellik-liste`}>
            {OZELLIKLER.map((o, i) => (
              <div key={i} className={`${p}-giris-ozellik`} style={{
                animationDelay: `${0.3 + i * 0.1}s`,
              }}>
                <div className={`${p}-giris-ozellik-ikon`}>
                  <i className={`bi ${o.ikon}`} />
                </div>
                <div className={`${p}-giris-ozellik-metin`}>
                  <div className={`${p}-giris-ozellik-baslik`}>
                    {o.baslik}
                  </div>
                  <div className={`${p}-giris-ozellik-aciklama`}>
                    {o.aciklama}
                  </div>
                </div>
                <i className={`bi bi-check-circle-fill ${p}-giris-ozellik-check`} />
              </div>
            ))}
          </div>

          <p className={`${p}-giris-copyright`}>
            &copy; 2026 ParamGo &middot; Tüm hakları saklıdır
          </p>
        </div>
      </div>

      {/* ───── Sag Form Paneli ──────────────────────────────────────── */}
      <div className={`${p}-giris-sag`}>
        <div className={`${p}-giris-sag-ic`}>

          {/* Form Kart */}
          <div className={`${p}-giris-kart`}>
            <div className={`${p}-giris-kart-serit`} />

            <div className={`${p}-giris-kart-ic`}>

              {/* Ana sayfaya dönüş */}
              <a href="https://paramgo.com" className={`${p}-giris-anasayfa-link`}>
                <i className="bi bi-arrow-left me-1" />
                Ana Sayfa
              </a>

              {/* Mobil logo (lg altinda gorunur) */}
              <div className={`d-flex d-lg-none align-items-center justify-content-center mb-4`}>
                <ParamGoLogo size="sm" />
              </div>

              {/* Form basligi */}
              <div className={`${p}-giris-form-baslik-wrap`}>
                <div className={`${p}-giris-form-ikon`}>
                  <i className="bi bi-person-lock" />
                </div>
                <h1 className={`${p}-giris-form-baslik`}>
                  Hesabınıza Giriş Yapın
                </h1>
                <p className={`${p}-giris-form-altbaslik`}>
                  E-posta ve şifrenizle devam edin
                </p>
              </div>

              {/* Hata mesaji */}
              {hata && (
                <div className={`${p}-giris-hata d-flex align-items-center gap-2 mb-4 p-3`}>
                  <i className={`bi bi-exclamation-triangle-fill ${p}-giris-hata-ikon`} />
                  <span className={`${p}-giris-hata-metin`}>{hata}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>

                {/* E-posta */}
                <div className="mb-3">
                  <label className={`${p}-giris-label`}>
                    E-posta Adresi
                  </label>
                  <div className={`${p}-giris-alan`}>
                    <span className={`${p}-giris-alan-ikon`}>
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
                      className={`${p}-giris-input`}
                      required
                    />
                  </div>
                </div>

                {/* Sifre */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className={`${p}-giris-label`} style={{ margin: 0 }}>
                      Şifre
                    </label>
                    <Link to="/sifre-sifirla" className={`${p}-giris-link-sifre`}>
                      Şifremi unuttum
                    </Link>
                  </div>
                  <div className={`${p}-giris-alan`} style={{ position: 'relative' }}>
                    <span className={`${p}-giris-alan-ikon`}>
                      <i className="bi bi-lock" />
                    </span>
                    <input
                      type={sifreGoster ? 'text' : 'password'}
                      name="sifre"
                      value={form.sifre}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
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

                {/* Giris Butonu */}
                <button type="submit" className={`${p}-giris-btn`} disabled={yukleniyor}>
                  {yukleniyor ? (
                    <>
                      <i className={`bi bi-arrow-repeat me-2 ${p}-giris-spin`} />
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

              {/* Kayit linki */}
              <p className={`${p}-giris-kayit-text text-center mt-4 mb-3`}>
                Hesabınız yok mu?{' '}
                <Link to="/kayit" className={`${p}-giris-kayit-link`}>
                  Ücretsiz deneyin
                </Link>
              </p>

              {/* Guvenlik notu */}
              <div className={`${p}-giris-guvenlik d-flex align-items-center justify-content-center gap-2`}>
                <i className={`bi bi-shield-check ${p}-giris-guvenlik-ikon`} />
                <span className={`${p}-giris-guvenlik-metin`}>
                  AES-256-GCM şifreli güvenli bağlantı
                </span>
              </div>
            </div>
          </div>

          {/* Mobil alt not */}
          <p className={`${p}-giris-mobil-copyright d-lg-none text-center mt-4`}>
            &copy; 2026 ParamGo &middot; Tüm hakları saklıdır
          </p>
        </div>
      </div>
    </div>
  )
}
