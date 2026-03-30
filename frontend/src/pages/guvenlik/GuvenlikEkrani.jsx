/**
 * GuvenlikEkrani.jsx — Güvenlik Yönetim Paneli
 * ParamGo v2 tasarım sistemi
 * gvn- prefix ile modüle özel CSS class'ları
 *
 * 7 sekme: Aktif Oturumlar, Giriş Geçmişi, 2FA, Şifre Politikası, IP Kuralları, Denetim Logları, Hesabım
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { guvenlikApi } from '../../api/guvenlik'
import useAuthStore from '../../stores/authStore'

// ─── Yardımcılar ────────────────────────────────────────────────────────────────
const tarihFmt = (s) =>
  s ? new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const zamanOnce = (s) => {
  if (!s) return '—'
  const fark = Date.now() - new Date(s).getTime()
  const dk   = Math.floor(fark / 60000)
  if (dk < 1) return 'Az önce'
  if (dk < 60) return `${dk} dk önce`
  const saat = Math.floor(dk / 60)
  if (saat < 24) return `${saat} saat önce`
  const gun = Math.floor(saat / 24)
  return `${gun} gün önce`
}

const CIHAZ_IKON = {
  masaustu: 'bi-laptop',
  mobil:    'bi-phone',
  tablet:   'bi-tablet',
  bilinmiyor: 'bi-device-hdd',
}

const LOG_TIP_ETIKET = {
  giris_basarili:    { label: 'Giriş',           renk: '#10B981', bg: 'rgba(16,185,129,0.09)' },
  giris_basarisiz:   { label: 'Başarısız Giriş',  renk: '#ef4444', bg: 'rgba(239,68,68,0.09)' },
  kayit:             { label: 'Kayıt',            renk: '#0EA5E9', bg: 'rgba(14,165,233,0.09)' },
  cikis:             { label: 'Çıkış',            renk: '#6B7280', bg: 'rgba(107,114,128,0.09)' },
  token_yenile:      { label: 'Token Yenile',     renk: '#8B5CF6', bg: 'rgba(139,92,246,0.09)' },
  kasa_erisim:       { label: 'Kasa Erişimi',     renk: '#F59E0B', bg: 'rgba(245,158,11,0.09)' },
  yetkisiz_erisim:   { label: 'Yetkisiz Erişim',  renk: '#ef4444', bg: 'rgba(239,68,68,0.09)' },
}

const SEKMELER = [
  { id: 'oturumlar',     label: 'Aktif Oturumlar',  icon: 'bi-display' },
  { id: 'giris-gecmisi', label: 'Giriş Geçmişi',    icon: 'bi-clock-history' },
  { id: '2fa',           label: '2FA',               icon: 'bi-shield-lock' },
  { id: 'sifre',         label: 'Şifre Politikası',  icon: 'bi-key' },
  { id: 'ip',            label: 'IP Kuralları',       icon: 'bi-globe2' },
  { id: 'loglar',        label: 'Denetim Logları',    icon: 'bi-journal-text' },
  { id: 'hesabim',       label: 'Hesabım',            icon: 'bi-person-x' },
]


// ─── Aktif Oturumlar Sekmesi ────────────────────────────────────────────────────
function AktifOturumlar() {
  const [oturumlar, setOturumlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const res = await guvenlikApi.oturumlar()
      setOturumlar(res.data.veri.oturumlar || [])
    } catch { toast.error('Oturumlar yüklenemedi') }
    finally { setYukleniyor(false) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const sonlandir = async (id) => {
    try {
      await guvenlikApi.oturumSonlandir(id)
      toast.success('Oturum sonlandırıldı')
      yukle()
    } catch { toast.error('Oturum sonlandırılamadı') }
  }

  const hepsiniSonlandir = async () => {
    try {
      await guvenlikApi.tumOturumlariSonlandir()
      toast.success('Diğer tüm oturumlar sonlandırıldı')
      yukle()
    } catch { toast.error('İşlem başarısız') }
  }

  if (yukleniyor) return <div className="text-center py-5"><div className="spinner-border" style={{ color: '#10B981', width: 28, height: 28 }} /></div>

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            <i className="bi bi-info-circle me-1" />
            Hesabınıza bağlı aktif cihazlar ({oturumlar.length})
          </p>
        </div>
        {oturumlar.length > 1 && (
          <button className="gvn-btn-danger" onClick={hepsiniSonlandir}>
            <i className="bi bi-x-circle" style={{ fontSize: 12 }} />
            Diğerlerini Sonlandır
          </button>
        )}
      </div>

      {oturumlar.length === 0 ? (
        <div className="gvn-empty">
          <i className="bi bi-display" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', margin: 0 }}>Aktif oturum bulunamadı</p>
        </div>
      ) : oturumlar.map((o, i) => (
        <div key={o.id} className="gvn-session">
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: i === 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))' : '#F3F4F6',
              border: i === 0 ? '1px solid rgba(16,185,129,0.2)' : '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <i className={`bi ${CIHAZ_IKON[o.cihaz_turu] || CIHAZ_IKON.bilinmiyor}`}
                style={{ fontSize: 18, color: i === 0 ? '#10B981' : '#9CA3AF' }} />
            </div>

            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                  {o.tarayici || 'Bilinmiyor'} — {o.isletim_sistemi || 'Bilinmiyor'}
                </span>
                {i === 0 && (
                  <span className="gvn-badge" style={{ color: '#059669', background: 'rgba(16,185,129,0.09)' }}>
                    <i className="bi bi-circle-fill" style={{ fontSize: 6 }} /> Bu cihaz
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                <i className="bi bi-geo-alt me-1" style={{ fontSize: 10 }} />{o.ip_adresi}
                <span className="ms-2"><i className="bi bi-clock me-1" style={{ fontSize: 10 }} />{zamanOnce(o.son_kullanim)}</span>
              </div>
            </div>

            {i > 0 && (
              <button className="gvn-btn-outline" onClick={() => sonlandir(o.id)} style={{ flexShrink: 0 }}>
                <i className="bi bi-x-lg" style={{ fontSize: 11 }} /> Sonlandır
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Giriş Geçmişi Sekmesi ─────────────────────────────────────────────────────
function GirisGecmisi() {
  const [veri, setVeri] = useState({ kayitlar: [], toplam: 0, sayfa: 1, toplam_sayfa: 1 })
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async (sayfa = 1) => {
    setYukleniyor(true)
    try {
      const res = await guvenlikApi.girisGecmisi({ sayfa })
      setVeri(res.data.veri)
    } catch { toast.error('Giriş geçmişi yüklenemedi') }
    finally { setYukleniyor(false) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  if (yukleniyor) return <div className="text-center py-5"><div className="spinner-border" style={{ color: '#10B981', width: 28, height: 28 }} /></div>

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-hover align-middle p-table">
          <thead>
            <tr>
              <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'linear-gradient(90deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.01) 100%)', border: 'none', padding: '10px 14px' }}>Tarih</th>
              <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'linear-gradient(90deg, rgba(16,185,129,0.04) 0%, transparent 100%)', border: 'none', padding: '10px 14px' }}>Kullanıcı</th>
              <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'linear-gradient(90deg, rgba(16,185,129,0.03) 0%, transparent 100%)', border: 'none', padding: '10px 14px' }}>Cihaz</th>
              <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'transparent', border: 'none', padding: '10px 14px' }}>IP</th>
              <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'transparent', border: 'none', padding: '10px 14px' }}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {veri.kayitlar.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4" style={{ color: '#9CA3AF' }}>Kayıt bulunamadı</td></tr>
            ) : veri.kayitlar.map((k) => (
              <tr key={k.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 14px', border: 'none', color: '#374151', whiteSpace: 'nowrap' }}>{tarihFmt(k.tarih)}</td>
                <td style={{ padding: '10px 14px', border: 'none', fontWeight: 600, color: '#111827' }}>{k.ad_soyad || '—'}</td>
                <td style={{ padding: '10px 14px', border: 'none', color: '#6B7280' }}>
                  <i className={`bi ${CIHAZ_IKON[k.cihaz_turu] || CIHAZ_IKON.bilinmiyor} me-1`} style={{ fontSize: 13 }} />
                  {k.tarayici || '—'} · {k.isletim_sistemi || '—'}
                </td>
                <td style={{ padding: '10px 14px', border: 'none', color: '#9CA3AF', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{k.ip_adresi}</td>
                <td style={{ padding: '10px 14px', border: 'none' }}>
                  <span className="gvn-badge" style={{
                    color: k.basarili_mi ? '#059669' : '#ef4444',
                    background: k.basarili_mi ? 'rgba(16,185,129,0.09)' : 'rgba(239,68,68,0.09)',
                  }}>
                    <i className={`bi ${k.basarili_mi ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ fontSize: 10 }} />
                    {k.basarili_mi ? 'Başarılı' : (k.basarisizlik_nedeni || 'Başarısız')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {veri.toplam_sayfa > 1 && (
        <div className="gvn-pager">
          <button disabled={veri.sayfa <= 1} onClick={() => yukle(veri.sayfa - 1)}>
            <i className="bi bi-chevron-left" />
          </button>
          {Array.from({ length: Math.min(veri.toplam_sayfa, 5) }, (_, i) => i + 1).map(s => (
            <button key={s} className={s === veri.sayfa ? 'active' : ''} onClick={() => yukle(s)}>{s}</button>
          ))}
          <button disabled={veri.sayfa >= veri.toplam_sayfa} onClick={() => yukle(veri.sayfa + 1)}>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── 2FA Sekmesi ────────────────────────────────────────────────────────────────
function IkiFaktorAyar() {
  const [durum, setDurum] = useState('kontrol') // kontrol, kapali, kurulum, aktif
  const [qrUri, setQrUri]       = useState('')
  const [secret, setSecret]     = useState('')
  const [yedekKodlar, setYedekKodlar] = useState([])
  const [kod, setKod]           = useState('')
  const [sifre, setSifre]       = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const kontrol = useCallback(async () => {
    try {
      const res = await guvenlikApi.ayarlarGetir()
      // Kullanıcının 2FA durumu ayarlar endpoint'inden gelmez, ama
      // 2FA başlat endpoint'i zaten aktifse 409 dönecek
      // Basit yaklaşım: başlat dene, 409 ise aktif
      setDurum('kapali')
    } catch {
      setDurum('kapali')
    }
  }, [])

  useEffect(() => { kontrol() }, [kontrol])

  const baslat = async () => {
    setYukleniyor(true)
    try {
      const res = await guvenlikApi.ikiFaktorBaslat()
      const v = res.data.veri
      setQrUri(v.qr_uri)
      setSecret(v.secret)
      setYedekKodlar(v.yedek_kodlar || [])
      setDurum('kurulum')
    } catch (e) {
      if (e?.response?.status === 409) {
        setDurum('aktif')
      } else {
        toast.error(e?.response?.data?.hata || '2FA başlatılamadı')
      }
    } finally { setYukleniyor(false) }
  }

  const dogrula = async () => {
    if (!kod || kod.length !== 6) {
      toast.error('6 haneli doğrulama kodunu girin')
      return
    }
    setYukleniyor(true)
    try {
      await guvenlikApi.ikiFaktorDogrula(kod)
      toast.success('İki faktörlü doğrulama aktifleştirildi!')
      setDurum('aktif')
      setKod('')
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'Kod doğrulanamadı')
    } finally { setYukleniyor(false) }
  }

  const devreDisi = async () => {
    if (!sifre) { toast.error('Şifrenizi girin'); return }
    setYukleniyor(true)
    try {
      await guvenlikApi.ikiFaktorDevreDisi(sifre)
      toast.success('2FA devre dışı bırakıldı')
      setDurum('kapali')
      setSifre('')
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'İşlem başarısız')
    } finally { setYukleniyor(false) }
  }

  // Kapalı durum
  if (durum === 'kapali') {
    return (
      <div className="gvn-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <i className="bi bi-shield-exclamation" style={{ fontSize: 24, color: '#F59E0B' }} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
          İki Faktörlü Doğrulama Kapalı
        </p>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px', maxWidth: 400, marginInline: 'auto', lineHeight: 1.6 }}>
          Hesabınızı ek güvenlik katmanıyla koruyun. Google Authenticator veya Authy uygulamasını kullanarak giriş yaparken ek doğrulama kodu girersiniz.
        </p>
        <button className="gvn-btn-primary" onClick={baslat} disabled={yukleniyor}>
          <i className="bi bi-shield-lock-fill" style={{ fontSize: 14 }} />
          {yukleniyor ? 'Hazırlanıyor...' : '2FA Etkinleştir'}
        </button>
      </div>
    )
  }

  // Kurulum durumu
  if (durum === 'kurulum') {
    return (
      <div>
        <div className="gvn-qr-card mb-3">
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>QR Kodu Tarayın</p>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px' }}>
            Google Authenticator veya Authy uygulamasıyla tarayın
          </p>

          {/* QR Code olarak URI'yi göster */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: 16,
            display: 'inline-block', border: '1px solid #E5E7EB', marginBottom: 12,
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
              alt="2FA QR Kodu"
              width={200} height={200}
              style={{ display: 'block' }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px' }}>Manuel giriş anahtarı:</p>
            <code style={{
              fontSize: 14, fontWeight: 700, color: '#059669',
              background: 'rgba(16,185,129,0.06)', padding: '6px 12px',
              borderRadius: 8, letterSpacing: '0.1em', userSelect: 'all',
            }}>
              {secret}
            </code>
          </div>
        </div>

        {/* Yedek kodlar */}
        {yedekKodlar.length > 0 && (
          <div className="gvn-card mb-3">
            <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
              <i className="bi bi-key-fill me-1" style={{ color: '#F59E0B' }} />
              Yedek Kodlarınız
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>
              Bu kodları güvenli bir yere kaydedin. Telefonunuza erişemezseniz bu kodlarla giriş yapabilirsiniz.
            </p>
            <div className="d-flex flex-wrap gap-2">
              {yedekKodlar.map((k, i) => (
                <span key={i} style={{
                  padding: '4px 10px', borderRadius: 8,
                  background: '#F9FAFB', border: '1px solid #E5E7EB',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                  fontWeight: 600, color: '#374151', letterSpacing: '0.08em',
                }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Doğrulama */}
        <div className="gvn-card">
          <label className="gvn-label">Doğrulama Kodu</label>
          <div className="d-flex gap-2">
            <input
              className="gvn-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6 haneli kodu girin"
              value={kod}
              onChange={e => setKod(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ maxWidth: 200, letterSpacing: '0.2em', fontWeight: 700 }}
            />
            <button className="gvn-btn-primary" onClick={dogrula} disabled={yukleniyor || kod.length !== 6}>
              {yukleniyor ? 'Doğrulanıyor...' : 'Doğrula & Aktifleştir'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Aktif durum
  return (
    <div className="gvn-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <i className="bi bi-shield-check" style={{ fontSize: 24, color: '#10B981' }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
        İki Faktörlü Doğrulama Aktif
      </p>
      <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
        Hesabınız ek güvenlik katmanıyla korunuyor.
      </p>

      <div style={{ maxWidth: 300, margin: '0 auto' }}>
        <label className="gvn-label">Devre dışı bırakmak için şifrenizi girin</label>
        <div className="d-flex gap-2">
          <input
            className="gvn-input"
            type="password"
            placeholder="Şifreniz"
            value={sifre}
            onChange={e => setSifre(e.target.value)}
          />
          <button className="gvn-btn-danger" onClick={devreDisi} disabled={yukleniyor || !sifre}>
            {yukleniyor ? '...' : 'Kapat'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Şifre Politikası Sekmesi ───────────────────────────────────────────────────
function SifrePolitikasi() {
  const [ayarlar, setAyarlar] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const res = await guvenlikApi.ayarlarGetir()
      setAyarlar(res.data.veri.ayarlar)
    } catch { toast.error('Ayarlar yüklenemedi') }
    finally { setYukleniyor(false) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const kaydet = async () => {
    setKaydediyor(true)
    try {
      await guvenlikApi.ayarlarKaydet(ayarlar)
      toast.success('Şifre politikası güncellendi')
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'Kaydedilemedi')
    } finally { setKaydediyor(false) }
  }

  const guncelle = (alan, deger) => setAyarlar(a => ({ ...a, [alan]: deger }))

  if (yukleniyor || !ayarlar) return <div className="text-center py-5"><div className="spinner-border" style={{ color: '#10B981', width: 28, height: 28 }} /></div>

  return (
    <div>
      <div className="gvn-card mb-3">
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
          <i className="bi bi-key-fill me-2" style={{ color: '#10B981' }} />
          Şifre Gereksinimleri
        </p>

        <div className="mb-3">
          <label className="gvn-label">Minimum Şifre Uzunluğu</label>
          <input
            className="gvn-input"
            type="number"
            min={6} max={32}
            value={ayarlar.min_sifre_uzunlugu}
            onChange={e => guncelle('min_sifre_uzunlugu', parseInt(e.target.value) || 8)}
            style={{ maxWidth: 100 }}
          />
        </div>

        <div className="gvn-toggle-row">
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Büyük harf zorunlu</span>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>En az bir büyük harf (A-Z)</p>
          </div>
          <button className={`gvn-switch${ayarlar.sifre_buyuk_harf_zorunlu ? ' on' : ''}`}
            onClick={() => guncelle('sifre_buyuk_harf_zorunlu', ayarlar.sifre_buyuk_harf_zorunlu ? 0 : 1)} />
        </div>

        <div className="gvn-toggle-row">
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Rakam zorunlu</span>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>En az bir rakam (0-9)</p>
          </div>
          <button className={`gvn-switch${ayarlar.sifre_sayi_zorunlu ? ' on' : ''}`}
            onClick={() => guncelle('sifre_sayi_zorunlu', ayarlar.sifre_sayi_zorunlu ? 0 : 1)} />
        </div>

        <div className="gvn-toggle-row">
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Özel karakter zorunlu</span>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>En az bir özel karakter (!@#$%&)</p>
          </div>
          <button className={`gvn-switch${ayarlar.sifre_ozel_karakter_zorunlu ? ' on' : ''}`}
            onClick={() => guncelle('sifre_ozel_karakter_zorunlu', ayarlar.sifre_ozel_karakter_zorunlu ? 0 : 1)} />
        </div>
      </div>

      <div className="gvn-card mb-3">
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
          <i className="bi bi-lock-fill me-2" style={{ color: '#F59E0B' }} />
          Hesap Kilitleme
        </p>

        <div className="row g-3">
          <div className="col-sm-6">
            <label className="gvn-label">Kilitleme deneme sayısı</label>
            <input className="gvn-input" type="number" min={3} max={20}
              value={ayarlar.hesap_kilitleme_deneme}
              onChange={e => guncelle('hesap_kilitleme_deneme', parseInt(e.target.value) || 5)} />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>Bu kadar başarısız denemede hesap kilitlenir</p>
          </div>
          <div className="col-sm-6">
            <label className="gvn-label">Kilitleme süresi (dakika)</label>
            <input className="gvn-input" type="number" min={5} max={1440}
              value={ayarlar.hesap_kilitleme_sure_dk}
              onChange={e => guncelle('hesap_kilitleme_sure_dk', parseInt(e.target.value) || 30)} />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>Hesap bu süre boyunca kilitli kalır</p>
          </div>
        </div>
      </div>

      <button className="gvn-btn-primary" onClick={kaydet} disabled={kaydediyor}>
        <i className="bi bi-check2-circle" style={{ fontSize: 14 }} />
        {kaydediyor ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
      </button>
    </div>
  )
}

// ─── IP Kuralları Sekmesi ───────────────────────────────────────────────────────
function IpKurallar() {
  const [ayarlar, setAyarlar] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [yeniIpBeyaz, setYeniIpBeyaz] = useState('')
  const [yeniIpKara, setYeniIpKara]   = useState('')

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const res = await guvenlikApi.ayarlarGetir()
      setAyarlar(res.data.veri.ayarlar)
    } catch { toast.error('Ayarlar yüklenemedi') }
    finally { setYukleniyor(false) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const ipEkle = (tip) => {
    const yeniIp = tip === 'beyaz' ? yeniIpBeyaz.trim() : yeniIpKara.trim()
    if (!yeniIp) return
    const alan = tip === 'beyaz' ? 'ip_beyaz_liste' : 'ip_kara_liste'
    const liste = [...(ayarlar[alan] || [])]
    if (liste.includes(yeniIp)) { toast.error('Bu IP zaten listede'); return }
    liste.push(yeniIp)
    setAyarlar(a => ({ ...a, [alan]: liste }))
    tip === 'beyaz' ? setYeniIpBeyaz('') : setYeniIpKara('')
  }

  const ipSil = (tip, index) => {
    const alan = tip === 'beyaz' ? 'ip_beyaz_liste' : 'ip_kara_liste'
    const liste = [...(ayarlar[alan] || [])]
    liste.splice(index, 1)
    setAyarlar(a => ({ ...a, [alan]: liste }))
  }

  const kaydet = async () => {
    setKaydediyor(true)
    try {
      await guvenlikApi.ayarlarKaydet(ayarlar)
      toast.success('IP kuralları güncellendi')
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'Kaydedilemedi')
    } finally { setKaydediyor(false) }
  }

  if (yukleniyor || !ayarlar) return <div className="text-center py-5"><div className="spinner-border" style={{ color: '#10B981', width: 28, height: 28 }} /></div>

  return (
    <div>
      {/* Beyaz liste */}
      <div className="gvn-card mb-3">
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          <i className="bi bi-check-circle-fill me-2" style={{ color: '#10B981' }} />
          IP Beyaz Listesi
        </p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 14px' }}>
          Sadece bu IP'lerden erişime izin ver. Boş bırakılırsa tüm IP'ler geçer.
        </p>

        <div className="d-flex gap-2 mb-3">
          <input className="gvn-input" placeholder="Örn: 192.168.1.100"
            value={yeniIpBeyaz} onChange={e => setYeniIpBeyaz(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ipEkle('beyaz')}
            style={{ maxWidth: 240 }} />
          <button className="gvn-btn-outline" onClick={() => ipEkle('beyaz')}>
            <i className="bi bi-plus" /> Ekle
          </button>
        </div>

        {(ayarlar.ip_beyaz_liste || []).length === 0 ? (
          <p style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>Henüz IP eklenmedi</p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {ayarlar.ip_beyaz_liste.map((ip, i) => (
              <div key={i} className="gvn-ip-item">
                {ip}
                <button onClick={() => ipSil('beyaz', i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, lineHeight: 1,
                }}>
                  <i className="bi bi-x" style={{ fontSize: 14 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kara liste */}
      <div className="gvn-card mb-3">
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          <i className="bi bi-x-circle-fill me-2" style={{ color: '#ef4444' }} />
          IP Kara Listesi
        </p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 14px' }}>
          Bu IP adreslerinden erişimi tamamen engelle.
        </p>

        <div className="d-flex gap-2 mb-3">
          <input className="gvn-input" placeholder="Örn: 10.0.0.50"
            value={yeniIpKara} onChange={e => setYeniIpKara(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ipEkle('kara')}
            style={{ maxWidth: 240 }} />
          <button className="gvn-btn-outline" onClick={() => ipEkle('kara')}>
            <i className="bi bi-plus" /> Ekle
          </button>
        </div>

        {(ayarlar.ip_kara_liste || []).length === 0 ? (
          <p style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>Henüz IP eklenmedi</p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {ayarlar.ip_kara_liste.map((ip, i) => (
              <div key={i} className="gvn-ip-item" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
                {ip}
                <button onClick={() => ipSil('kara', i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, lineHeight: 1,
                }}>
                  <i className="bi bi-x" style={{ fontSize: 14 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        display: 'flex', alignItems: 'start', gap: 8,
      }}>
        <i className="bi bi-exclamation-triangle-fill" style={{ color: '#F59E0B', fontSize: 14, marginTop: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
          <strong>Dikkat:</strong> Kendi IP adresinizi kara listeye eklerseniz veya beyaz listeye eklemezseniz hesabınıza erişemeyebilirsiniz.
        </span>
      </div>

      <button className="gvn-btn-primary" onClick={kaydet} disabled={kaydediyor}>
        <i className="bi bi-check2-circle" style={{ fontSize: 14 }} />
        {kaydediyor ? 'Kaydediliyor...' : 'IP Kurallarını Kaydet'}
      </button>
    </div>
  )
}

// ─── Denetim Logları Sekmesi ────────────────────────────────────────────────────
function DenetimLoglar() {
  const [veri, setVeri]     = useState({ kayitlar: [], toplam: 0, sayfa: 1, toplam_sayfa: 1 })
  const [filtre, setFiltre] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async (sayfa = 1, islem_tipi = '') => {
    setYukleniyor(true)
    try {
      const params = { sayfa }
      if (islem_tipi) params.islem_tipi = islem_tipi
      const res = await guvenlikApi.loglar(params)
      setVeri(res.data.veri)
    } catch { toast.error('Loglar yüklenemedi') }
    finally { setYukleniyor(false) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const filtreUygula = (tip) => {
    setFiltre(tip)
    yukle(1, tip)
  }

  return (
    <div>
      {/* Filtreler */}
      <div className="d-flex flex-wrap gap-1 mb-3">
        <button className={`gvn-btn-outline${!filtre ? ' gvn-active-filter' : ''}`}
          onClick={() => filtreUygula('')}
          style={!filtre ? { background: '#10B981', color: '#fff', borderColor: '#10B981' } : {}}>
          Tümü
        </button>
        {Object.entries(LOG_TIP_ETIKET).map(([tip, { label }]) => (
          <button key={tip}
            className={`gvn-btn-outline${filtre === tip ? ' gvn-active-filter' : ''}`}
            onClick={() => filtreUygula(tip)}
            style={filtre === tip ? { background: '#10B981', color: '#fff', borderColor: '#10B981' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {yukleniyor ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: '#10B981', width: 28, height: 28 }} /></div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle p-table">
              <thead>
                <tr>
                  <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'linear-gradient(90deg, rgba(16,185,129,0.06) 0%, transparent 100%)', border: 'none', padding: '10px 14px' }}>Tarih</th>
                  <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'linear-gradient(90deg, rgba(16,185,129,0.03) 0%, transparent 100%)', border: 'none', padding: '10px 14px' }}>İşlem</th>
                  <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'transparent', border: 'none', padding: '10px 14px' }}>Detay</th>
                  <th style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'transparent', border: 'none', padding: '10px 14px' }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {veri.kayitlar.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4" style={{ color: '#9CA3AF' }}>Kayıt bulunamadı</td></tr>
                ) : veri.kayitlar.map((l) => {
                  const tipBilgi = LOG_TIP_ETIKET[l.islem_tipi] || { label: l.islem_tipi, renk: '#6B7280', bg: '#F3F4F6' }
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 14px', border: 'none', color: '#374151', whiteSpace: 'nowrap', fontSize: 12 }}>{tarihFmt(l.tarih)}</td>
                      <td style={{ padding: '10px 14px', border: 'none' }}>
                        <span className="gvn-badge" style={{ color: tipBilgi.renk, background: tipBilgi.bg }}>
                          {tipBilgi.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', border: 'none', color: '#6B7280', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.islem_detayi || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', border: 'none', color: '#9CA3AF', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {l.ip_adresi || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {veri.toplam_sayfa > 1 && (
            <div className="gvn-pager">
              <button disabled={veri.sayfa <= 1} onClick={() => yukle(veri.sayfa - 1, filtre)}>
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: Math.min(veri.toplam_sayfa, 5) }, (_, i) => i + 1).map(s => (
                <button key={s} className={s === veri.sayfa ? 'active' : ''} onClick={() => yukle(s, filtre)}>{s}</button>
              ))}
              <button disabled={veri.sayfa >= veri.toplam_sayfa} onClick={() => yukle(veri.sayfa + 1, filtre)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Hesabım / Hesap Silme Sekmesi ─────────────────────────────────────────────
function HesabimSekme() {
  const [sifre, setSifre]         = useState('')
  const [onay, setOnay]           = useState(false)
  const [siliniyor, setSiliniyor] = useState(false)
  const { kullanici, cikisYap }   = useAuthStore()
  const navigate                  = useNavigate()

  const hesapSil = async () => {
    if (!sifre) { toast.error('Şifrenizi girin'); return }
    if (!onay)  { toast.error('Onay kutucuğunu işaretleyin'); return }

    setSiliniyor(true)
    try {
      await guvenlikApi.hesapSil(sifre)
      toast.success('Hesabınız silindi')
      await cikisYap()
      navigate('/giris')
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'Hesap silinemedi')
    } finally {
      setSiliniyor(false)
    }
  }

  const isSahip = kullanici?.rol === 'sahip'

  return (
    <div>
      {/* Hesap Bilgileri */}
      <div className="gvn-card mb-3">
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
          <i className="bi bi-person-circle me-2" style={{ color: '#10B981' }} />
          Hesap Bilgileri
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#9CA3AF', width: 80 }}>Ad Soyad</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{kullanici?.ad_soyad || '—'}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#9CA3AF', width: 80 }}>E-posta</span>
            <span style={{ fontSize: 13, color: '#374151' }}>{kullanici?.email || '—'}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#9CA3AF', width: 80 }}>Rol</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669',
              background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: 6 }}>
              {kullanici?.rol || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Tehlikeli Alan — Hesap Silme */}
      <div style={{
        border: '1.5px solid rgba(239,68,68,0.25)',
        borderRadius: 14,
        padding: '20px',
        background: 'rgba(239,68,68,0.02)',
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', margin: '0 0 4px' }}>
          <i className="bi bi-exclamation-triangle-fill me-2" />
          Hesabı Sil
        </p>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.6 }}>
          {isSahip
            ? 'Hesabınızı sildiğinizde şirketinize ait tüm veriler (cariler, gelir/gider kayıtları, çekler, raporlar) kalıcı olarak silinir. Bu işlem geri alınamaz.'
            : 'Hesabınız şirketten kaldırılacak. Şirket verilerine erişiminiz kesilecek. Bu işlem geri alınamaz.'}
        </p>

        <div className="mb-3">
          <label className="gvn-label">Şifrenizi Girin</label>
          <input
            className="gvn-input"
            type="password"
            placeholder="Hesabınızın şifresi"
            value={sifre}
            onChange={e => setSifre(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <div className="gvn-toggle-row mb-3" style={{ background: 'none', border: 'none', padding: 0 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onay}
              onChange={e => setOnay(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#ef4444', width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              Hesabımı ve tüm verilerimi kalıcı olarak silmek istiyorum. Bu işlemin geri alınamayacağını anlıyorum.
            </span>
          </label>
        </div>

        <button
          className="gvn-btn-danger"
          onClick={hesapSil}
          disabled={siliniyor || !sifre || !onay}
          style={{ opacity: (!sifre || !onay) ? 0.5 : 1 }}
        >
          <i className="bi bi-trash3-fill" style={{ fontSize: 13 }} />
          {siliniyor ? 'Siliniyor...' : 'Hesabımı Kalıcı Olarak Sil'}
        </button>
      </div>
    </div>
  )
}

// ─── Ana Bileşen ────────────────────────────────────────────────────────────────
export default function GuvenlikEkrani() {
  const [aktifSekme, setAktifSekme] = useState('oturumlar')

  const sekmeIcerik = {
    'oturumlar':     <AktifOturumlar />,
    'giris-gecmisi': <GirisGecmisi />,
    '2fa':           <IkiFaktorAyar />,
    'sifre':         <SifrePolitikasi />,
    'ip':            <IpKurallar />,
    'loglar':        <DenetimLoglar />,
    'hesabim':       <HesabimSekme />,
  }

  return (
    <div className="gvn-wrap">
      {/* ── Sayfa Başlığı ── */}
      <div className="gvn-header-card">
        <div className="d-flex align-items-center gap-3">
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
            border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="bi bi-shield-lock-fill" style={{ fontSize: 20, color: '#10B981', opacity: 0.35 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 2px', letterSpacing: '-0.4px' }}>
              Güvenlik Merkezi
            </h1>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
              Oturumlar, giriş geçmişi, iki faktörlü doğrulama ve güvenlik politikalarını yönetin
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigasyonu ── */}
      <div className="gvn-tabs">
        {SEKMELER.map(s => (
          <button
            key={s.id}
            className={`gvn-tab${aktifSekme === s.id ? ' active' : ''}`}
            onClick={() => setAktifSekme(s.id)}
          >
            <i className={`bi ${s.icon}`} style={{ fontSize: 14 }} />
            <span className="gvn-tab-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── Sekme İçeriği ── */}
      {sekmeIcerik[aktifSekme]}
    </div>
  )
}
