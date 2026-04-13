/**
 * KayitOl — Ücretsiz Hesap Oluşturma
 * Mobilde: Dark native ekran
 * Web'de: Mevcut split-screen
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import { Capacitor } from '@capacitor/core'
import { authApi } from '../../api/auth'
import useAuthStore from '../../stores/authStore'
import useTemaStore from '../../stores/temaStore'
import ParamGoLogo from '../../logo/ParamGoLogo'

const isNative = Capacitor.isNativePlatform() || new URLSearchParams(window.location.search).has('native')
const isIOS = Capacitor.getPlatform() === 'ios'
const prefixMap = { paramgo: 'p' }
const GOOGLE_CLIENT_ID = '505947540272-fuvn80vu0q2bjcgbihea1sm7b4jininv.apps.googleusercontent.com'

const AVANTAJLAR = [
  { ikon: 'bi-people-fill',            baslik: 'Cari Hesaplar',     aciklama: '25 cari — ücretsiz sonsuza kadar' },
  { ikon: 'bi-file-earmark-text-fill', baslik: 'Çek & Senet',       aciklama: 'Aylık 10 çek/senet takibi'       },
  { ikon: 'bi-cash-stack',             baslik: 'Kasa Yönetimi',     aciklama: '2 aylık nakit akış geçmişi'      },
  { ikon: 'bi-graph-up-arrow',         baslik: 'Ödeme Takibi',      aciklama: 'Vadesi geçen ödemeler, uyarılar' },
]

export default function KayitOl() {
  const navigate = useNavigate()
  const { girisYap, sosyalGiris } = useAuthStore()
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'p'

  // Auth ekranı koyu (#0B1120) — status bar ikonları beyaz olmalı
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    window.__statusBarSetDark?.()
  }, [])

  const [sosyalYukleniyor, setSosyalYukleniyor] = useState('')

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    import('@capgo/capacitor-social-login').then(({ SocialLogin }) => {
      SocialLogin.initialize({ google: { iOSClientId: GOOGLE_CLIENT_ID }, apple: {} }).catch(() => {})
    })
  }, [])

  const handleAppleGiris = async () => {
    if (sosyalYukleniyor) return
    setSosyalYukleniyor('apple')
    try {
      const { SocialLogin } = await import('@capgo/capacitor-social-login')
      const result = await SocialLogin.login({ provider: 'apple', options: { scopes: ['email', 'name'] } })
      const { idToken, profile } = result.result
      const res = await authApi.appleGiris(idToken, profile?.givenName || '', profile?.familyName || '', profile?.email || '')
      if (res.data?.basarili) {
        sosyalGiris(res.data.veri.kullanici, res.data.veri.tokenlar)
        toast.success('Apple ile giriş yapıldı!')
        // Yeni kullanıcıysa Welcome, mevcut kullanıcıysa Dashboard
        navigate(res.data.veri.kullanici?.yeni_kayit ? '/welcome' : '/dashboard')
      } else { toast.error(res.data?.hata || 'Apple ile giriş başarısız.') }
    } catch (err) {
      if (err?.message !== 'USER_CANCELLED') toast.error('Apple ile giriş yapılamadı.')
    } finally { setSosyalYukleniyor('') }
  }

  const handleGoogleGiris = async () => {
    if (sosyalYukleniyor) return
    setSosyalYukleniyor('google')
    try {
      const { SocialLogin } = await import('@capgo/capacitor-social-login')
      const result = await SocialLogin.login({ provider: 'google', options: { scopes: ['email', 'profile'] } })
      const { idToken } = result.result
      const res = await authApi.googleGiris(idToken)
      if (res.data?.basarili) {
        sosyalGiris(res.data.veri.kullanici, res.data.veri.tokenlar)
        toast.success('Google ile giriş yapıldı!')
        navigate(res.data.veri.kullanici?.yeni_kayit ? '/welcome' : '/dashboard')
      } else { toast.error(res.data?.hata || 'Google ile giriş başarısız.') }
    } catch (err) {
      if (err?.message !== 'USER_CANCELLED') toast.error('Google ile giriş yapılamadı.')
    } finally { setSosyalYukleniyor('') }
  }

  const [form, setForm] = useState({
    firma_adi: '', ad_soyad: '', email: '', sifre: '', sifre_tekrar: '',
  })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor]   = useState(false)
  const [hata, setHata]               = useState('')
  const [adim, setAdim]               = useState(1)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (hata) setHata('')
  }

  const adim1Gecerli = () => {
    if (!form.firma_adi.trim()) { setHata('Firma adı zorunludur.'); return false }
    if (!form.ad_soyad.trim())  { setHata('Ad soyad zorunludur.');  return false }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) { setHata('Geçerli bir e-posta girin.'); return false }
    return true
  }

  const ilerle = () => { if (adim1Gecerli()) { setHata(''); setAdim(2) } }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (adim === 1) { ilerle(); return }
    if (form.sifre.length < 8)           { setHata('Şifre en az 8 karakter olmalıdır.'); return }
    if (form.sifre !== form.sifre_tekrar) { setHata('Şifreler eşleşmiyor.'); return }
    setYukleniyor(true); setHata('')
    try {
      await authApi.kayit({ firma_adi: form.firma_adi, ad_soyad: form.ad_soyad, email: form.email, sifre: form.sifre })
      await girisYap(form.email, form.sifre)
      toast.success('Hesabınız oluşturuldu! Hoş geldiniz.')
      navigate('/welcome')  // Mail kayıt: yeni kullanıcı → Welcome
    } catch (err) {
      const status = err.response?.status
      const mesaj  = err.response?.data?.hata
      if      (status === 409) { setAdim(1); setHata('Bu e-posta adresi zaten kayıtlı.') }
      else if (status === 429) setHata(mesaj || 'Çok fazla deneme. Lütfen bekleyin.')
      else if (status === 422) setHata(mesaj || 'Lütfen tüm alanları doğru doldurun.')
      else                     setHata('Hesap oluşturulamadı. Lütfen tekrar deneyin.')
    } finally { setYukleniyor(false) }
  }

  /* ═══════ MOBİL — Dark native kayıt ═══════ */
  if (isNative) {
    return (
      <div className="pm-auth-screen">
        <div className="pm-auth-bg-glow" />
        <div className="pm-auth-bg-glow2" />

        <div className="pm-auth-hero">
          <ParamGoLogo size="md" variant="dark" />
          <h1 className="pm-auth-title">Ücretsiz Başlayın</h1>
          <p className="pm-auth-desc">
            {adim === 1 ? 'Firma ve iletişim bilgileriniz' : 'Hesap şifrenizi belirleyin'}
          </p>
        </div>

        <div className="pm-auth-steps">
          {[1, 2].map((a) => (
            <div key={a} className={`pm-auth-step-dot${a === adim ? ' active' : ''}`} />
          ))}
        </div>

        <div className="pm-auth-card">
          {hata && (
            <div className="pm-auth-error">
              <i className="bi bi-exclamation-circle-fill" />
              <span>{hata}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {adim === 1 ? (
              <>
                <div className="pm-auth-field">
                  <div className="pm-auth-input-wrap">
                    <i className="bi bi-building pm-auth-input-icon" />
                    <input type="text" name="firma_adi" value={form.firma_adi}
                      onChange={handleChange} placeholder="Firma / İşletme adı"
                      autoComplete="organization" autoFocus className="pm-auth-input" />
                  </div>
                </div>
                <div className="pm-auth-field">
                  <div className="pm-auth-input-wrap">
                    <i className="bi bi-person pm-auth-input-icon" />
                    <input type="text" name="ad_soyad" value={form.ad_soyad}
                      onChange={handleChange} placeholder="Ad Soyad"
                      autoComplete="name" className="pm-auth-input" />
                  </div>
                </div>
                <div className="pm-auth-field">
                  <div className="pm-auth-input-wrap">
                    <i className="bi bi-envelope pm-auth-input-icon" />
                    <input type="email" name="email" value={form.email}
                      onChange={handleChange} placeholder="E-posta adresi"
                      autoComplete="email" className="pm-auth-input" />
                  </div>
                </div>
                <button type="button" className="pm-auth-btn-primary" onClick={ilerle}>
                  Devam Et
                </button>
              </>
            ) : (
              <>
                <div className="pm-auth-field">
                  <div className="pm-auth-input-wrap">
                    <i className="bi bi-lock pm-auth-input-icon" />
                    <input type={sifreGoster ? 'text' : 'password'}
                      name="sifre" value={form.sifre}
                      onChange={handleChange} placeholder="Şifre (en az 8 karakter)"
                      autoComplete="new-password" autoFocus
                      className="pm-auth-input pm-auth-input-pwd" />
                    <button type="button" tabIndex={-1}
                      onClick={() => setSifreGoster(v => !v)} className="pm-auth-eye">
                      <i className={`bi ${sifreGoster ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>
                <div className="pm-auth-field">
                  <div className="pm-auth-input-wrap">
                    <i className="bi bi-lock-fill pm-auth-input-icon" />
                    <input type="password" name="sifre_tekrar" value={form.sifre_tekrar}
                      onChange={handleChange} placeholder="Şifre tekrarı"
                      autoComplete="new-password" className="pm-auth-input" />
                  </div>
                </div>
                <div className="pm-auth-btn-row">
                  <button type="button" onClick={() => { setAdim(1); setHata('') }} className="pm-auth-back-btn">
                    <i className="bi bi-arrow-left" />
                  </button>
                  <button type="submit" className="pm-auth-btn-primary" disabled={yukleniyor} style={{ flex: 1 }}>
                    {yukleniyor ? <><i className="bi bi-arrow-repeat pm-spin" style={{marginRight:8}} />Oluşturuluyor...</> : 'Hesabı Oluştur'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="pm-auth-divider"><span>veya</span></div>

          <Link to="/giris" className="pm-auth-btn-ghost">
            Zaten hesabım var — Giriş Yap
          </Link>

          <div className="pm-auth-divider"><span>sosyal giriş</span></div>

          <div className="pm-auth-social-row">
            <button type="button" className="pm-auth-btn-social pm-auth-btn-apple"
              onClick={handleAppleGiris} disabled={!!sosyalYukleniyor}>
              {sosyalYukleniyor === 'apple'
                ? <><i className="bi bi-arrow-repeat pm-spin" /> Bekleniyor...</>
                : <><i className="bi bi-apple" /> Apple ile Devam Et</>}
            </button>
            {!isIOS && (
              <button type="button" className="pm-auth-btn-social pm-auth-btn-google"
                onClick={handleGoogleGiris} disabled={!!sosyalYukleniyor}>
                {sosyalYukleniyor === 'google'
                  ? <><i className="bi bi-arrow-repeat pm-spin" /> Bekleniyor...</>
                  : <><i className="bi bi-google" /> Google ile Devam Et</>}
              </button>
            )}
          </div>
        </div>

        <div className="pm-auth-footer">
          <i className="bi bi-shield-lock-fill" />
          <span>Kart bilgisi gerekmez &middot; 256-bit şifreli</span>
        </div>
      </div>
    )
  }

  /* ═══════ WEB — Mevcut split-screen ═══════ */
  return (
    <div className={`${p}-giris-root`}>
      <div className={`${p}-giris-sol`}>
        <div className={`${p}-giris-sol-cizgi`} />
        {[
          { s: 4, l: '15%', t: '20%', dur: '10s', del: '0s' },
          { s: 3, l: '72%', t: '30%', dur: '13s', del: '2s' },
          { s: 5, l: '40%', t: '58%', dur: '9s',  del: '1s' },
          { s: 3, l: '85%', t: '68%', dur: '15s', del: '4s' },
          { s: 4, l: '25%', t: '80%', dur: '11s', del: '3s' },
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
            <i className={`bi bi-rocket-takeoff ${p}-giris-bank-ikon`} />
          </div>
          <h2 className={`${p}-giris-vizyon-baslik`}>
            Ücretsiz Başlayın,<br />
            <span className={`${p}-giris-vizyon-vurgu`}>Büyüyünce</span> Yükseltin
          </h2>
          <p className={`${p}-giris-vizyon-aciklama`}>
            Kart veya kredi bilgisi gerekmez. Hemen başlayın, işletmeniz büyüdükçe planınızı genişletin.
          </p>
        </div>
        <div className={`${p}-giris-ozellik-wrap`}>
          <div className={`${p}-giris-ozellik-liste`}>
            {AVANTAJLAR.map((o, i) => (
              <div key={i} className={`${p}-giris-ozellik`} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className={`${p}-giris-ozellik-ikon`}><i className={`bi ${o.ikon}`} /></div>
                <div className={`${p}-giris-ozellik-metin`}>
                  <div className={`${p}-giris-ozellik-baslik`}>{o.baslik}</div>
                  <div className={`${p}-giris-ozellik-aciklama`}>{o.aciklama}</div>
                </div>
                <i className={`bi bi-check-circle-fill ${p}-giris-ozellik-check`} />
              </div>
            ))}
          </div>
          <p className={`${p}-giris-copyright`}>&copy; 2026 ParamGo &middot; Tüm hakları saklıdır</p>
        </div>
      </div>

      <div className={`${p}-giris-sag`}>
        <div className={`${p}-giris-sag-ic`}>
          <div className={`${p}-giris-kart`}>
            <div className={`${p}-giris-kart-serit`} />
            <div className={`${p}-giris-kart-ic`}>
              <a href="https://paramgo.com" className={`d-flex d-lg-none align-items-center justify-content-center mb-4 ${p}-giris-marka-wrap`}>
                <ParamGoLogo size="sm" />
              </a>
              <div className={`${p}-giris-form-baslik-wrap`}>
                <div className={`${p}-giris-form-ikon`}><i className="bi bi-person-plus" /></div>
                <h1 className={`${p}-giris-form-baslik`}>Ücretsiz Hesap Oluşturun</h1>
                <p className={`${p}-giris-form-altbaslik`}>
                  {adim === 1 ? 'Firma ve iletişim bilgileriniz' : 'Hesap şifrenizi belirleyin'}
                </p>
              </div>
              <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                {[1, 2].map((a) => (
                  <div key={a} style={{
                    width: a === adim ? 28 : 8, height: 8, borderRadius: 4,
                    transition: 'all 0.3s',
                    background: a === adim ? '#10B981' : 'var(--p-border, #e5e8f0)',
                  }} />
                ))}
              </div>
              {hata && (
                <div className={`${p}-giris-hata d-flex align-items-center gap-2 mb-4 p-3`}>
                  <i className={`bi bi-exclamation-triangle-fill ${p}-giris-hata-ikon`} />
                  <span className={`${p}-giris-hata-metin`}>{hata}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                {adim === 1 ? (
                  <>
                    <div className="mb-3">
                      <label className={`${p}-giris-label`}>Firma / İşletme Adı</label>
                      <div className={`${p}-giris-alan`}>
                        <span className={`${p}-giris-alan-ikon`}><i className="bi bi-building" /></span>
                        <input type="text" name="firma_adi" value={form.firma_adi}
                          onChange={handleChange} placeholder="Örn: ABC Hırdavat Ltd. Şti."
                          autoComplete="organization" autoFocus className={`${p}-giris-input`} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className={`${p}-giris-label`}>Ad Soyad</label>
                      <div className={`${p}-giris-alan`}>
                        <span className={`${p}-giris-alan-ikon`}><i className="bi bi-person" /></span>
                        <input type="text" name="ad_soyad" value={form.ad_soyad}
                          onChange={handleChange} placeholder="Ahmet Yılmaz"
                          autoComplete="name" className={`${p}-giris-input`} />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className={`${p}-giris-label`}>E-posta Adresi</label>
                      <div className={`${p}-giris-alan`}>
                        <span className={`${p}-giris-alan-ikon`}><i className="bi bi-envelope" /></span>
                        <input type="email" name="email" value={form.email}
                          onChange={handleChange} placeholder="ornek@firma.com"
                          autoComplete="email" className={`${p}-giris-input`} />
                      </div>
                    </div>
                    <button type="button" className={`${p}-giris-btn`} onClick={ilerle}>
                      <i className="bi bi-arrow-right me-2" />Devam Et
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className={`${p}-giris-label`}>Şifre Oluşturun</label>
                      <div className={`${p}-giris-alan`} style={{ position: 'relative' }}>
                        <span className={`${p}-giris-alan-ikon`}><i className="bi bi-lock" /></span>
                        <input type={sifreGoster ? 'text' : 'password'} name="sifre" value={form.sifre}
                          onChange={handleChange} placeholder="En az 8 karakter"
                          autoComplete="new-password" autoFocus
                          className={`${p}-giris-input ${p}-giris-input-sifre`} />
                        <button type="button" tabIndex={-1} onClick={() => setSifreGoster(v => !v)}
                          className={`${p}-giris-sifre-toggle`}>
                          <i className={`bi ${sifreGoster ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className={`${p}-giris-label`}>Şifre Tekrarı</label>
                      <div className={`${p}-giris-alan`}>
                        <span className={`${p}-giris-alan-ikon`}><i className="bi bi-lock-fill" /></span>
                        <input type="password" name="sifre_tekrar" value={form.sifre_tekrar}
                          onChange={handleChange} placeholder="Şifreyi tekrar girin"
                          autoComplete="new-password" className={`${p}-giris-input`} />
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" onClick={() => { setAdim(1); setHata('') }}
                        className={`${p}-giris-btn`}
                        style={{ flex: '0 0 48px', background: 'transparent', border: '1px solid var(--p-border, #e5e8f0)' }}>
                        <i className="bi bi-arrow-left" />
                      </button>
                      <button type="submit" className={`${p}-giris-btn`} disabled={yukleniyor} style={{ flex: 1 }}>
                        {yukleniyor ? (
                          <><i className={`bi bi-arrow-repeat me-2 ${p}-giris-spin`} />Hesap Oluşturuluyor...</>
                        ) : (
                          <><i className="bi bi-person-check me-2" />Hesabı Oluştur</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
              <p className={`${p}-giris-kayit-text text-center mt-4 mb-3`}>
                Zaten hesabınız var mı?{' '}
                <Link to="/giris" className={`${p}-giris-kayit-link`}>Giriş yapın</Link>
              </p>
              <div className={`${p}-giris-guvenlik d-flex align-items-center justify-content-center gap-2`}>
                <i className={`bi bi-shield-check ${p}-giris-guvenlik-ikon`} />
                <span className={`${p}-giris-guvenlik-metin`}>AES-256-GCM şifreli &middot; Kart bilgisi gerekmez</span>
              </div>
            </div>
          </div>
          <p className={`${p}-giris-mobil-copyright d-lg-none text-center mt-4`}>&copy; 2026 ParamGo &middot; Tüm hakları saklıdır</p>
        </div>
      </div>
    </div>
  )
}
