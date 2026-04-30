import { useState } from 'react'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import useAuthStore from '../../stores/authStore'
import { guvenlikApi } from '../../api/guvenlik'
import { useNavigate } from 'react-router-dom'
import KullaniciYonetimi from '../kullanicilar/KullaniciYonetimi'
import GuvenlikEkrani from '../guvenlik/GuvenlikEkrani'
import BildirimlerEkrani from '../bildirimler/BildirimlerEkrani'

const SEKMELER = [
  { id: 'profilim',    label: 'Profilim',    icon: 'bi-person-circle' },
  { id: 'personel',   label: 'Personel',    icon: 'bi-people' },
  { id: 'guvenlik',   label: 'Güvenlik',    icon: 'bi-shield-lock' },
  { id: 'bildirimler', label: 'Bildirimler', icon: 'bi-bell' },
]

// ─── Profilim Sekmesi ──────────────────────────────────────────────────────────
function ProfilimSekme() {
  const { kullanici, cikisYap, kullaniciGuncelle } = useAuthStore()
  const navigate = useNavigate()

  const [duzenleme, setDuzenleme]   = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [siliniyor, setSiliniyor]   = useState(false)
  const [silAcik, setSilAcik]       = useState(false)
  const [onay, setOnay]             = useState(false)
  const [silSifre, setSilSifre]     = useState('')

  const [profil, setProfil] = useState({
    ad_soyad:  '',
    telefon:   '',
    firma_adi: '',
  })

  const duzenlemeyiAc = () => {
    setProfil({
      ad_soyad:  kullanici?.ad_soyad  || '',
      telefon:   kullanici?.telefon   || '',
      firma_adi: kullanici?.firma_adi || '',
    })
    setDuzenleme(true)
  }

  const profilKaydet = async () => {
    if (!profil.ad_soyad.trim()) { toast.error('Ad soyad zorunludur'); return }
    setKaydediyor(true)
    try {
      const res = await guvenlikApi.profilGuncelle(profil)
      if (res.data?.basarili) {
        const gelen = res.data.veri
        kullaniciGuncelle({
          ad_soyad:  gelen.ad_soyad,
          telefon:   gelen.telefon,
          ...(gelen.firma_adi ? { firma_adi: gelen.firma_adi } : {}),
        })
        toast.success('Profil güncellendi')
        setDuzenleme(false)
      }
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'Profil güncellenemedi')
    } finally { setKaydediyor(false) }
  }

  const hesapSil = async () => {
    if (!silSifre) { toast.error('Şifrenizi girin'); return }
    if (!onay)     { toast.error('Onay kutucuğunu işaretleyin'); return }
    setSiliniyor(true)
    try {
      await guvenlikApi.hesapSil(silSifre)
      toast.success('Hesabınız silindi')
      await cikisYap()
      navigate('/giris')
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'Hesap silinemedi')
    } finally { setSiliniyor(false) }
  }

  const isSahip = kullanici?.rol === 'sahip'

  // Avatar: ad soyadın ilk harfleri
  const initials = (() => {
    const isim = (kullanici?.ad_soyad || '').trim()
    const parcalar = isim.split(/\s+/)
    if (parcalar.length >= 2) return (parcalar[0][0] + parcalar[parcalar.length - 1][0]).toUpperCase()
    return isim.slice(0, 2).toUpperCase() || '?'
  })()

  // Plan badge renkleri
  const planBilgi = (() => {
    switch (kullanici?.plan) {
      case 'premium': return { label: 'Premium', color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', icon: 'bi-stars' }
      case 'temel':   return { label: 'Temel',   color: '#2563EB', bg: 'rgba(37,99,235,0.09)',  icon: 'bi-patch-check' }
      default:        return { label: 'Deneme',  color: '#D97706', bg: 'rgba(217,119,6,0.09)',  icon: 'bi-clock' }
    }
  })()

  return (
    <div>
      {/* ── Avatar Hero ─────────────────────────────────────── */}
      <div className="gvn-profile-hero">
        <div className="gvn-avatar">{initials}</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 3px', letterSpacing: '-0.3px' }}>
            {kullanici?.ad_soyad || '—'}
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px' }}>
            {kullanici?.email || '—'}
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: planBilgi.bg, color: planBilgi.color, letterSpacing: 0.3,
            }}>
              <i className={`bi ${planBilgi.icon} me-1`} style={{ fontSize: 10 }} />
              {planBilgi.label}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: 'rgba(16,185,129,0.09)', color: '#059669',
            }}>
              <i className="bi bi-person-check me-1" style={{ fontSize: 10 }} />
              {isSahip ? 'Hesap Sahibi' : 'Personel'}
            </span>
          </div>
        </div>
        {!duzenleme && (
          <button className="gvn-btn-outline" onClick={duzenlemeyiAc}
            style={{ fontSize: 12, position: 'absolute', top: 14, right: 14 }}>
            <i className="bi bi-pencil" style={{ fontSize: 11 }} /> Düzenle
          </button>
        )}
      </div>

      {/* ── Bilgi Kartı (görünüm modu) ───────────────────────── */}
      {!duzenleme ? (
        <div className="gvn-card mb-3">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
            letterSpacing: 0.6, margin: '0 0 8px' }}>
            İletişim & Firma
          </p>

          <div className="gvn-info-row">
            <div className="gvn-info-icon"><i className="bi bi-telephone" /></div>
            <div>
              <div className="gvn-info-label">Cep Telefonu</div>
              <div className={`gvn-info-value${!kullanici?.telefon ? ' empty' : ''}`}>
                {kullanici?.telefon || 'Eklenmemiş'}
              </div>
            </div>
          </div>

          <div className="gvn-info-row">
            <div className="gvn-info-icon"><i className="bi bi-envelope" /></div>
            <div>
              <div className="gvn-info-label">E-posta</div>
              <div className="gvn-info-value">{kullanici?.email || '—'}</div>
            </div>
          </div>

          {isSahip && (
            <div className="gvn-info-row">
              <div className="gvn-info-icon"><i className="bi bi-building" /></div>
              <div>
                <div className="gvn-info-label">Firma / İşletme</div>
                <div className={`gvn-info-value${!kullanici?.firma_adi ? ' empty' : ''}`}>
                  {kullanici?.firma_adi || 'Eklenmemiş'}
                </div>
              </div>
            </div>
          )}

          {kullanici?.plan === 'deneme' && kullanici?.deneme_bitis && (
            <div className="gvn-info-row">
              <div className="gvn-info-icon" style={{ background: 'rgba(217,119,6,0.07)', borderColor: 'rgba(217,119,6,0.15)', color: '#D97706' }}>
                <i className="bi bi-clock" />
              </div>
              <div>
                <div className="gvn-info-label">Deneme Bitiş</div>
                <div className="gvn-info-value" style={{ color: '#D97706' }}>
                  {new Date(kullanici.deneme_bitis).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Düzenleme Formu ──────────────────────────────────── */
        <div className="gvn-card mb-3">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
            letterSpacing: 0.6, margin: '0 0 16px' }}>
            Profili Düzenle
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="gvn-label">Ad Soyad <span style={{ color: '#EF4444' }}>*</span></label>
              <input className="gvn-input" type="text"
                value={profil.ad_soyad}
                onChange={e => setProfil(p => ({ ...p, ad_soyad: e.target.value }))}
                placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="gvn-label">Cep Telefonu</label>
              <input className="gvn-input" type="tel"
                value={profil.telefon}
                onChange={e => setProfil(p => ({ ...p, telefon: e.target.value }))}
                placeholder="0530 123 45 67" />
            </div>
            {isSahip && (
              <div>
                <label className="gvn-label">Firma / İşletme Adı</label>
                <input className="gvn-input" type="text"
                  value={profil.firma_adi}
                  onChange={e => setProfil(p => ({ ...p, firma_adi: e.target.value }))}
                  placeholder="ABC Hırdavat Ltd." />
              </div>
            )}
            <div className="d-flex gap-2 pt-1">
              <button className="gvn-btn-primary" onClick={profilKaydet} disabled={kaydediyor}>
                <i className="bi bi-check2-circle" style={{ fontSize: 13 }} />
                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button className="gvn-btn-outline" onClick={() => setDuzenleme(false)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hesap Silme ───────────────────────────────────────── */}
      <div style={{
        border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 14,
        background: 'rgba(239,68,68,0.015)', overflow: 'hidden',
      }}>
        <button
          onClick={() => setSilAcik(v => !v)}
          style={{
            width: '100%', padding: '14px 18px',
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 700, color: '#DC2626' }}>
            <i className="bi bi-shield-exclamation" style={{ fontSize: 15 }} />
            Tehlikeli Bölge
          </span>
          <i className={`bi bi-chevron-${silAcik ? 'up' : 'down'}`}
            style={{ fontSize: 12, color: '#DC2626', opacity: 0.6 }} />
        </button>

        {silAcik && (
          <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(239,68,68,0.12)' }}>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '14px 0 16px', lineHeight: 1.6 }}>
              {isSahip
                ? 'Hesabınızı sildiğinizde şirketinize ait tüm veriler kalıcı olarak silinir. Bu işlem geri alınamaz.'
                : 'Hesabınız şirketten kaldırılacak ve erişiminiz kesilecek. Bu işlem geri alınamaz.'}
            </p>
            <div className="mb-3">
              <label className="gvn-label">Onaylamak için şifrenizi girin</label>
              <input className="gvn-input" type="password"
                placeholder="Mevcut şifreniz"
                value={silSifre} onChange={e => setSilSifre(e.target.value)}
                style={{ maxWidth: 320 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
              cursor: 'pointer', marginBottom: 16, userSelect: 'none' }}>
              <input type="checkbox" checked={onay} onChange={e => setOnay(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#EF4444', width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                Hesabımı ve tüm verilerimi kalıcı olarak silmek istiyorum. Bu işlemin geri alınamayacağını anlıyorum.
              </span>
            </label>
            <button className="gvn-btn-danger" onClick={hesapSil}
              disabled={siliniyor || !silSifre || !onay}
              style={{ opacity: (!silSifre || !onay) ? 0.45 : 1 }}>
              <i className="bi bi-trash3-fill" style={{ fontSize: 13 }} />
              {siliniyor ? 'Siliniyor...' : 'Hesabımı Kalıcı Olarak Sil'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Ana Bileşen ───────────────────────────────────────────────────────────────
export default function Ayarlar() {
  const [aktifSekme, setAktifSekme] = useState('profilim')

  const sekmeIcerik = {
    profilim:    <ProfilimSekme />,
    personel:    <KullaniciYonetimi embedded />,
    guvenlik:    <GuvenlikEkrani embedded />,
    bildirimler: <BildirimlerEkrani embedded />,
  }

  return (
    <div className="gvn-wrap">
      {/* Sayfa Başlığı */}
      <div className="gvn-header-card">
        <div className="d-flex align-items-center gap-3">
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
            border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="bi bi-gear-fill" style={{ fontSize: 20, color: '#10B981', opacity: 0.35 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 2px', letterSpacing: '-0.4px' }}>
              Ayarlar
            </h1>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
              Profil, personel, güvenlik ve bildirim ayarlarınızı yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigasyonu */}
      <div className="gvn-tabs">
        {SEKMELER.map(s => (
          <button key={s.id}
            className={`gvn-tab${aktifSekme === s.id ? ' active' : ''}`}
            onClick={() => setAktifSekme(s.id)}>
            <i className={`bi ${s.icon}`} style={{ fontSize: 14 }} />
            <span className="gvn-tab-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Sekme İçeriği */}
      {sekmeIcerik[aktifSekme]}
    </div>
  )
}
