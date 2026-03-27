/**
 * GirisYap — ParamGo Premium Login
 * Split-screen: Sol dekoratif panel + Sag glassmorphism form
 * Tek tema: ParamGo
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'
import useTemaStore from '../../stores/temaStore'
import ParamGoLogo from '../../logo/ParamGoLogo'

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

          {/* Buyuk ikon */}
          <div className={`${p}-giris-buyuk-ikon`}>
            {/* Dis halkalar */}
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
                <a href="https://paramgo.com">
                  <ParamGoLogo size="sm" />
                </a>
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
                      Güvenlik Şifresi
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
