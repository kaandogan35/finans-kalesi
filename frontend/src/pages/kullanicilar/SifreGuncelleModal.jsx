/**
 * SifreGuncelleModal.jsx — Sahip başka kullanıcının şifresini sıfırlar
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { kullanicilarApi } from '../../api/kullanicilar'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

  .sgm-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 1060;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }

  .sgm-box {
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.15);
    max-width: 400px; width: 100%;
    font-family: 'Outfit', sans-serif;
    overflow: hidden;
  }

  .sgm-header.mh-default {
    background: #ffffff;
    border-bottom: 1px solid #F3F4F6;
    padding: 20px 22px 16px;
  }

  .sgm-body { padding: 20px 22px; }
  .sgm-footer {
    padding: 14px 22px;
    border-top: 1px solid #F3F4F6;
    background: #F9FAFB;
  }

  .sgm-label {
    font-size: 12px; font-weight: 700; color: #374151;
    margin-bottom: 5px; display: block;
  }
  .sgm-input {
    width: 100%; padding: 9px 12px;
    border: 1.5px solid #E5E7EB;
    border-radius: 10px;
    font-size: 13px; color: #111827;
    font-family: 'Outfit', sans-serif;
    outline: none;
    transition: border-color 0.15s ease;
    background: #ffffff;
  }
  .sgm-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.08); }

  .sgm-kaydet-btn {
    padding: 9px 20px;
    border-radius: 10px; border: none;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff; font-weight: 700; font-size: 13px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s ease;
    box-shadow: 0 2px 10px rgba(245,158,11,0.25);
    display: flex; align-items: center; gap: 7px;
  }
  .sgm-kaydet-btn:hover { opacity: 0.9; }
  .sgm-kaydet-btn:disabled { opacity: 0.5; cursor: default; }
`

export default function SifreGuncelleModal({ hedef, onKapat }) {
  const [yeniSifre, setYeniSifre]     = useState('')
  const [sifre2, setSifre2]           = useState('')
  const [yukleniyor, setYukleniyor]   = useState(false)
  const [hata, setHata]               = useState('')

  const handleKaydet = async () => {
    if (!yeniSifre) { setHata('Şifre zorunludur'); return }
    if (yeniSifre.length < 8) { setHata('En az 8 karakter'); return }
    if (yeniSifre !== sifre2) { setHata('Şifreler eşleşmiyor'); return }
    setHata('')
    setYukleniyor(true)
    try {
      await kullanicilarApi.sifreGuncelle(hedef.id, yeniSifre)
      toast.success(`${hedef.ad_soyad} için şifre güncellendi`)
      onKapat()
    } catch (e) {
      setHata(e?.response?.data?.hata || 'Bir hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  const modal = (
    <div className="sgm-overlay" onClick={onKapat}>
      <style>{CSS}</style>
      <div className="sgm-box" onClick={e => e.stopPropagation()}>

        {/* Başlık (mh-default) */}
        <div className="sgm-header mh-default">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(245,158,11,0.09)',
                border: '1px solid rgba(245,158,11,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-key-fill" style={{ fontSize: 14, color: '#f59e0b', opacity: 0.7 }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>
                  Şifre Sıfırla
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
                  {hedef.ad_soyad} · {hedef.email}
                </p>
              </div>
            </div>
            <button onClick={onKapat} style={{
              width: 28, height: 28, borderRadius: 7,
              border: '1px solid #E5E7EB', background: '#F9FAFB',
              color: '#6B7280', cursor: 'pointer', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Gövde */}
        <div className="sgm-body">
          <div className="mb-3">
            <label className="sgm-label">Yeni Şifre *</label>
            <input
              className="sgm-input"
              type="password"
              placeholder="En az 8 karakter"
              value={yeniSifre}
              onChange={e => { setYeniSifre(e.target.value); setHata('') }}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="sgm-label">Şifreyi Tekrar Girin *</label>
            <input
              className="sgm-input"
              type="password"
              placeholder="Şifreyi tekrar girin"
              value={sifre2}
              onChange={e => { setSifre2(e.target.value); setHata('') }}
              autoComplete="new-password"
            />
          </div>
          {hata && (
            <div style={{
              marginTop: 10, padding: '8px 12px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.18)',
              borderRadius: 8, fontSize: 12, color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 12 }} />
              {hata}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sgm-footer d-flex justify-content-end gap-2">
          <button onClick={onKapat} style={{
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid #E5E7EB', background: '#ffffff',
            color: '#374151', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}>
            İptal
          </button>
          <button
            className="sgm-kaydet-btn"
            onClick={handleKaydet}
            disabled={yukleniyor}
          >
            {yukleniyor
              ? <><span className="spinner-border spinner-border-sm" />Kaydediliyor...</>
              : <><i className="bi bi-check2" />Şifreyi Güncelle</>
            }
          </button>
        </div>

      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
