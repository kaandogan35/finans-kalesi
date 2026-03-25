/**
 * KullaniciModal.jsx — Kullanıcı Ekleme / Düzenleme
 * mod: 'ekle' | 'duzenle'
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { kullanicilarApi } from '../../api/kullanicilar'

const MODULLER = [
  { id: 'dashboard',        label: 'Dashboard',       icon: 'bi-speedometer2',             zorunlu: true },
  { id: 'cari',             label: 'Cari Hesaplar',    icon: 'bi-people-fill',              zorunlu: false },
  { id: 'cek_senet',        label: 'Çek / Senet',      icon: 'bi-file-earmark-text-fill',   zorunlu: false },
  { id: 'odemeler',         label: 'Ödemeler',         icon: 'bi-credit-card-2-front-fill', zorunlu: false },
  { id: 'kasa',             label: 'Varlık & Kasa',    icon: 'bi-safe-fill',                zorunlu: false },
  { id: 'vade_hesaplayici', label: 'Vade Hesaplayıcı', icon: 'bi-calculator-fill',          zorunlu: false },
]

const ROLLER = [
  { value: 'admin',      label: 'Admin',      desc: 'Tüm işlemleri yapabilir, ayarları değiştirebilir' },
  { value: 'muhasebeci', label: 'Muhasebeci', desc: 'Finansal işlemleri görüntüler ve ekler' },
  { value: 'personel',   label: 'Personel',   desc: 'Yalnızca izin verilen modüllere erişir' },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

  .kum-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 1060;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }

  .kum-box {
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
    max-width: 520px; width: 100%;
    max-height: 90vh; overflow-y: auto;
    font-family: 'Outfit', sans-serif;
  }

  /* mh-default: beyaz başlık */
  .kum-header.mh-default {
    background: #ffffff;
    border-bottom: 1px solid #F3F4F6;
    border-radius: 18px 18px 0 0;
    padding: 20px 24px 16px;
    position: sticky; top: 0; z-index: 1;
  }

  .kum-body { padding: 20px 24px; }
  .kum-footer {
    padding: 16px 24px;
    border-top: 1px solid #F3F4F6;
    background: #F9FAFB;
    border-radius: 0 0 18px 18px;
    position: sticky; bottom: 0;
  }

  /* Form alanı */
  .kum-label {
    font-size: 12px; font-weight: 700; color: #374151;
    margin-bottom: 5px; display: block;
    letter-spacing: 0.01em;
  }
  .kum-input {
    width: 100%; padding: 9px 12px;
    border: 1.5px solid #E5E7EB;
    border-radius: 10px;
    font-size: 13px; color: #111827;
    font-family: 'Outfit', sans-serif;
    outline: none;
    transition: border-color 0.15s ease;
    background: #ffffff;
  }
  .kum-input:focus { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }
  .kum-input::placeholder { color: #9CA3AF; }

  /* Rol seçici */
  .kum-rol-btn {
    flex: 1; padding: 10px 12px;
    border: 1.5px solid #E5E7EB;
    border-radius: 10px;
    background: #ffffff; cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }
  .kum-rol-btn.active {
    border-color: #10B981;
    background: rgba(16,185,129,0.06);
    box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
  }

  /* Modül toggle */
  .kum-modul-item {
    display: flex; align-items: center; gap-10px;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1.5px solid #E5E7EB;
    cursor: pointer;
    transition: all 0.15s ease;
    background: #ffffff;
  }
  .kum-modul-item:hover:not(.zorunlu) { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.03); }
  .kum-modul-item.aktif { border-color: #10B981; background: rgba(16,185,129,0.06); }
  .kum-modul-item.zorunlu { opacity: 0.75; cursor: default; }

  /* Checkbox özel */
  .kum-checkbox {
    width: 18px; height: 18px;
    border-radius: 5px;
    border: 1.5px solid #D1D5DB;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s ease;
  }
  .kum-checkbox.aktif { border-color: #10B981; background: #10B981; }

  /* Kaydet butonu */
  .kum-kaydet-btn {
    padding: 10px 24px;
    border-radius: 10px; border: none;
    background: linear-gradient(135deg, #10B981, #059669);
    color: #fff; font-weight: 700; font-size: 13px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s ease, box-shadow 0.15s ease;
    box-shadow: 0 2px 10px rgba(16,185,129,0.25);
    display: flex; align-items: center; gap: 7px;
  }
  .kum-kaydet-btn:hover { opacity: 0.9; box-shadow: 0 4px 16px rgba(16,185,129,0.35); }
  .kum-kaydet-btn:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
`

export default function KullaniciModal({ mod, hedef = null, onKaydet, onKapat }) {
  const mevcutModuller = hedef?.yetkiler?.moduller || ['dashboard']

  const [form, setForm] = useState({
    ad_soyad: hedef?.ad_soyad || '',
    email:    hedef?.email    || '',
    sifre:    '',
    telefon:  hedef?.telefon  || '',
    rol:      hedef?.rol      || 'personel',
  })
  const [moduller, setModuller] = useState(
    MODULLER.map(m => ({ ...m, secili: mevcutModuller.includes(m.id) || m.zorunlu }))
  )
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hatalar, setHatalar]       = useState({})

  const handleInput = (alan, deger) => {
    setForm(f => ({ ...f, [alan]: deger }))
    if (hatalar[alan]) setHatalar(h => { const x = { ...h }; delete x[alan]; return x })
  }

  const toggleModul = (id) => {
    setModuller(prev => prev.map(m =>
      m.id === id && !m.zorunlu ? { ...m, secili: !m.secili } : m
    ))
  }

  const validate = () => {
    const h = {}
    if (!form.ad_soyad.trim()) h.ad_soyad = 'Ad Soyad zorunludur'
    if (mod === 'ekle') {
      if (!form.email.trim()) h.email = 'E-posta zorunludur'
      else if (!/\S+@\S+\.\S+/.test(form.email)) h.email = 'Geçerli e-posta girin'
      if (!form.sifre) h.sifre = 'Şifre zorunludur'
      else if (form.sifre.length < 8) h.sifre = 'En az 8 karakter'
    }
    return h
  }

  const handleKaydet = async () => {
    const h = validate()
    if (Object.keys(h).length > 0) { setHatalar(h); return }

    setYukleniyor(true)
    const seciliModuller = moduller.filter(m => m.secili).map(m => m.id)

    const veri = {
      ad_soyad: form.ad_soyad.trim(),
      telefon:  form.telefon.trim() || null,
      rol:      form.rol,
      yetkiler: { moduller: seciliModuller },
    }

    if (mod === 'ekle') {
      veri.email = form.email.trim()
      veri.sifre = form.sifre
    }

    try {
      if (mod === 'ekle') {
        await kullanicilarApi.olustur(veri)
        toast.success('Kullanıcı oluşturuldu')
      } else {
        await kullanicilarApi.guncelle(hedef.id, veri)
        toast.success('Kullanıcı güncellendi')
      }
      onKaydet()
    } catch (e) {
      const msg = e?.response?.data?.hata || 'Bir hata oluştu'
      const dogrulama = e?.response?.data?.dogrulama
      if (dogrulama) {
        setHatalar(dogrulama)
      } else {
        toast.error(msg)
      }
    } finally {
      setYukleniyor(false)
    }
  }

  const modal = (
    <div className="kum-overlay" onClick={onKapat}>
      <style>{CSS}</style>
      <div className="kum-box" onClick={e => e.stopPropagation()}>

        {/* ── Başlık (mh-default) ── */}
        <div className="kum-header mh-default">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(16,185,129,0.09)',
                border: '1px solid rgba(16,185,129,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i
                  className={mod === 'ekle' ? 'bi bi-person-plus-fill' : 'bi bi-pencil-fill'}
                  style={{ fontSize: 16, color: '#10B981', opacity: 0.35 }}
                />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>
                  {mod === 'ekle' ? 'Yeni Kullanıcı Ekle' : 'Kullanıcıyı Düzenle'}
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: '#9CA3AF' }}>
                  {mod === 'ekle' ? 'Şirketinize yeni bir çalışan ekleyin' : hedef?.email}
                </p>
              </div>
            </div>
            <button onClick={onKapat} style={{
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid #E5E7EB', background: '#F9FAFB',
              color: '#6B7280', cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* ── Gövde ── */}
        <div className="kum-body">

          {/* Ad Soyad + Telefon */}
          <div className="row g-3 mb-3">
            <div className="col-sm-7">
              <label className="kum-label">Ad Soyad *</label>
              <input
                className="kum-input"
                placeholder="Ahmet Yılmaz"
                value={form.ad_soyad}
                onChange={e => handleInput('ad_soyad', e.target.value)}
              />
              {hatalar.ad_soyad && <small style={{ color: '#ef4444', fontSize: 11 }}>{hatalar.ad_soyad}</small>}
            </div>
            <div className="col-sm-5">
              <label className="kum-label">Telefon</label>
              <input
                className="kum-input"
                placeholder="05XX XXX XX XX"
                value={form.telefon}
                onChange={e => handleInput('telefon', e.target.value)}
              />
            </div>
          </div>

          {/* E-posta + Şifre (sadece ekle modunda) */}
          {mod === 'ekle' && (
            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <label className="kum-label">E-posta *</label>
                <input
                  className="kum-input"
                  type="email"
                  placeholder="ahmet@firma.com"
                  value={form.email}
                  onChange={e => handleInput('email', e.target.value)}
                />
                {hatalar.email && <small style={{ color: '#ef4444', fontSize: 11 }}>{hatalar.email}</small>}
              </div>
              <div className="col-sm-6">
                <label className="kum-label">Şifre *</label>
                <input
                  className="kum-input"
                  type="password"
                  placeholder="En az 8 karakter"
                  value={form.sifre}
                  onChange={e => handleInput('sifre', e.target.value)}
                  autoComplete="new-password"
                />
                {hatalar.sifre && <small style={{ color: '#ef4444', fontSize: 11 }}>{hatalar.sifre}</small>}
              </div>
            </div>
          )}

          {/* Rol Seçimi */}
          <div className="mb-4">
            <label className="kum-label">Rol</label>
            <div className="d-flex gap-2 flex-wrap">
              {ROLLER.map(r => (
                <button
                  key={r.value}
                  className={`kum-rol-btn${form.rol === r.value ? ' active' : ''}`}
                  onClick={() => handleInput('rol', r.value)}
                  style={{ minWidth: 140 }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 1 }}>{r.label}</div>
                  <div style={{ fontSize: 10.5, color: '#6B7280', lineHeight: 1.3 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Modül İzinleri */}
          <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="kum-label" style={{ margin: 0 }}>
                Modül Erişim İzinleri
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setModuller(prev => prev.map(m => ({ ...m, secili: true })))}
                  style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    border: '1px solid #E5E7EB', background: '#F9FAFB',
                    color: '#374151', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >Tümünü Seç</button>
                <button
                  onClick={() => setModuller(prev => prev.map(m => ({ ...m, secili: m.zorunlu })))}
                  style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    border: '1px solid #E5E7EB', background: '#F9FAFB',
                    color: '#374151', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >Temizle</button>
              </div>
            </div>

            <div className="row g-2">
              {moduller.map(m => (
                <div key={m.id} className="col-6">
                  <div
                    className={`kum-modul-item${m.secili ? ' aktif' : ''}${m.zorunlu ? ' zorunlu' : ''}`}
                    onClick={() => toggleModul(m.id)}
                    style={{ gap: 10 }}
                  >
                    <div className={`kum-checkbox${m.secili ? ' aktif' : ''}`}>
                      {m.secili && <i className="bi bi-check2" style={{ fontSize: 11, color: '#fff' }} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`bi ${m.icon}`} style={{
                          fontSize: 13,
                          color: m.secili ? '#10B981' : '#9CA3AF',
                          opacity: 0.35,
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{m.label}</span>
                      </div>
                      {m.zorunlu && (
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>Zorunlu</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="kum-footer d-flex justify-content-end gap-2">
          <button onClick={onKapat} style={{
            padding: '9px 18px', borderRadius: 10,
            border: '1px solid #E5E7EB', background: '#ffffff',
            color: '#374151', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}>
            İptal
          </button>
          <button
            className="kum-kaydet-btn"
            onClick={handleKaydet}
            disabled={yukleniyor}
          >
            {yukleniyor
              ? <><span className="spinner-border spinner-border-sm me-1" />Kaydediliyor...</>
              : <><i className="bi bi-check2-circle" />{mod === 'ekle' ? 'Kullanıcı Oluştur' : 'Değişiklikleri Kaydet'}</>
            }
          </button>
        </div>

      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
