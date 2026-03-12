/**
 * GirisYap — Login Sayfası
 * Bootstrap 5 + Premium CSS — KOBİ Bankacılığı kalitesinde
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'

export default function GirisYap() {
  const navigate = useNavigate()
  const { girisYap } = useAuthStore()

  const [form, setForm] = useState({ email: '', sifre: '' })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

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
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: '100vh', padding: '24px 16px' }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* ─── Logo & Başlık ──────────────────────────────────────────── */}
        <div className="text-center mb-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
            style={{
              width: 52, height: 52,
              borderRadius: 16,
              background: 'var(--brand-navy)',
              boxShadow: '0 6px 20px rgba(18,63,89,0.35)',
            }}
          >
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 900, letterSpacing: '-0.5px' }}>FK</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Finans Kalesi
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Hesabınıza giriş yapın
          </p>
        </div>

        {/* ─── Giriş Kartı ────────────────────────────────────────────── */}
        <div className="premium-card p-4">

          <form onSubmit={handleSubmit} noValidate>

            {/* Hata Mesajı */}
            {hata && (
              <div
                className="d-flex align-items-start gap-2 mb-3 p-3"
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 12,
                }}
              >
                <AlertCircle size={15} style={{ color: '#f43f5e', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#be123c' }}>{hata}</span>
              </div>
            )}

            {/* E-posta */}
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                E-posta adresi
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ornek@firma.com"
                autoComplete="email"
                autoFocus
                className="form-control"
                style={{ borderRadius: 10, fontSize: 14, height: 42, borderColor: '#e2e8f0' }}
              />
            </div>

            {/* Şifre */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0" style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  Şifre
                </label>
                <Link
                  to="/sifremi-unuttum"
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)', textDecoration: 'none' }}
                >
                  Şifremi unuttum
                </Link>
              </div>
              <div className="position-relative">
                <input
                  type={sifreGoster ? 'text' : 'password'}
                  name="sifre"
                  value={form.sifre}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="form-control"
                  style={{ borderRadius: 10, fontSize: 14, height: 42, paddingRight: 42, borderColor: '#e2e8f0' }}
                />
                <button
                  type="button"
                  onClick={() => setSifreGoster((v) => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: '#94a3b8', cursor: 'pointer', padding: 0,
                  }}
                >
                  {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={yukleniyor}
              className="btn btn-brand w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ height: 44, borderRadius: 12, fontSize: 14 }}
            >
              {yukleniyor && <Loader2 size={16} className="animate-spin" />}
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>

          </form>

          {/* Kayıt Linki */}
          <p className="text-center mt-4 mb-0" style={{ fontSize: 13, color: '#64748b' }}>
            Hesabınız yok mu?{' '}
            <Link
              to="/kayit"
              style={{ color: 'var(--brand-navy)', fontWeight: 600, textDecoration: 'none' }}
            >
              Ücretsiz deneyin
            </Link>
          </p>
        </div>

        {/* Alt bilgi */}
        <p className="text-center mt-4" style={{ fontSize: 11, color: '#94a3b8' }}>
          © 2026 Finans Kalesi · Tüm hakları saklıdır
        </p>
      </div>
    </div>
  )
}
