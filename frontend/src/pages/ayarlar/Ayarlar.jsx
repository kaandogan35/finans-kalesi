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

  const [duzenleme, setDuzenleme]     = useState(false)
  const [kaydediyor, setKaydediyor]   = useState(false)
  const [siliniyor, setSiliniyor]     = useState(false)
  const [onay, setOnay]               = useState(false)
  const [silSifre, setSilSifre]       = useState('')

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

  return (
    <div>
      {/* Hesap bilgileri kartı */}
      <div className="gvn-card mb-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>
            <i className="bi bi-person-circle me-2" style={{ color: '#10B981' }} />
            Hesap Bilgileri
          </p>
          {!duzenleme && (
            <button className="gvn-btn-outline" onClick={duzenlemeyiAc} style={{ fontSize: 12 }}>
              <i className="bi bi-pencil" style={{ fontSize: 11 }} /> Düzenle
            </button>
          )}
        </div>

        {duzenleme ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="gvn-label">Ad Soyad</label>
              <input className="gvn-input" type="text"
                value={profil.ad_soyad}
                onChange={e => setProfil(p => ({ ...p, ad_soyad: e.target.value }))}
                placeholder="Ad Soyad" style={{ maxWidth: 320 }} />
            </div>
            <div>
              <label className="gvn-label">Cep Telefonu</label>
              <input className="gvn-input" type="tel"
                value={profil.telefon}
                onChange={e => setProfil(p => ({ ...p, telefon: e.target.value }))}
                placeholder="0530 123 45 67" style={{ maxWidth: 320 }} />
            </div>
            {isSahip && (
              <div>
                <label className="gvn-label">Firma / İşletme Adı</label>
                <input className="gvn-input" type="text"
                  value={profil.firma_adi}
                  onChange={e => setProfil(p => ({ ...p, firma_adi: e.target.value }))}
                  placeholder="ABC Hırdavat Ltd." style={{ maxWidth: 320 }} />
              </div>
            )}
            <div className="d-flex gap-2">
              <button className="gvn-btn-primary" onClick={profilKaydet} disabled={kaydediyor}>
                <i className="bi bi-check2" style={{ fontSize: 13 }} />
                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button className="gvn-btn-outline" onClick={() => setDuzenleme(false)}>İptal</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 90 }}>Ad Soyad</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{kullanici?.ad_soyad || '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 90 }}>E-posta</span>
              <span style={{ fontSize: 13, color: '#374151' }}>{kullanici?.email || '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 90 }}>Telefon</span>
              <span style={{ fontSize: 13, color: '#374151' }}>{kullanici?.telefon || '—'}</span>
            </div>
            {isSahip && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 90 }}>Firma Adı</span>
                <span style={{ fontSize: 13, color: '#374151' }}>{kullanici?.firma_adi || '—'}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 90 }}>Rol</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#059669',
                background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                {kullanici?.rol || '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hesap silme */}
      <div style={{
        border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 14,
        padding: 20, background: 'rgba(239,68,68,0.02)',
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', margin: '0 0 4px' }}>
          <i className="bi bi-exclamation-triangle-fill me-2" />
          Hesabı Sil
        </p>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.6 }}>
          {isSahip
            ? 'Hesabınızı sildiğinizde şirketinize ait tüm veriler kalıcı olarak silinir. Bu işlem geri alınamaz.'
            : 'Hesabınız şirketten kaldırılacak ve erişiminiz kesilecek. Bu işlem geri alınamaz.'}
        </p>
        <div className="mb-3">
          <label className="gvn-label">Şifrenizi Girin</label>
          <input className="gvn-input" type="password" placeholder="Hesabınızın şifresi"
            value={silSifre} onChange={e => setSilSifre(e.target.value)} style={{ maxWidth: 300 }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
          <input type="checkbox" checked={onay} onChange={e => setOnay(e.target.checked)}
            style={{ marginTop: 2, accentColor: '#ef4444', width: 16, height: 16 }} />
          <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            Hesabımı ve tüm verilerimi kalıcı olarak silmek istiyorum. Bu işlemin geri alınamayacağını anlıyorum.
          </span>
        </label>
        <button className="gvn-btn-danger" onClick={hesapSil}
          disabled={siliniyor || !silSifre || !onay}
          style={{ opacity: (!silSifre || !onay) ? 0.5 : 1 }}>
          <i className="bi bi-trash3-fill" style={{ fontSize: 13 }} />
          {siliniyor ? 'Siliniyor...' : 'Hesabımı Kalıcı Olarak Sil'}
        </button>
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
