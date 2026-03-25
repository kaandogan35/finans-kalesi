import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useBildirimStore from '../stores/bildirimStore'
import { bildirimApi } from '../api/bildirimler'

// Öncelik renkleri
const ONCELIK_RENK = {
  kritik:  { bg: '#FEF2F2', border: '#DC2626', dot: '#DC2626' },
  yuksek:  { bg: '#FFFBEB', border: '#F59E0B', dot: '#F59E0B' },
  normal:  { bg: '#F0FDF4', border: '#10B981', dot: '#10B981' },
  dusuk:   { bg: '#F9FAFB', border: '#9CA3AF', dot: '#9CA3AF' },
}

// Tip ikonları
const TIP_IKON = {
  odeme_vade:    'bi-calendar-event',
  cek_vade:      'bi-file-earmark-text',
  geciken_odeme: 'bi-exclamation-triangle',
  guvenlik:      'bi-shield-exclamation',
  sistem:        'bi-info-circle',
}

function zamanOnce(tarih) {
  if (!tarih) return ''
  const simdi = new Date()
  const t = new Date(tarih)
  const fark = Math.floor((simdi - t) / 1000)
  if (fark < 60) return 'Az önce'
  if (fark < 3600) return `${Math.floor(fark / 60)} dk önce`
  if (fark < 86400) return `${Math.floor(fark / 3600)} saat önce`
  if (fark < 604800) return `${Math.floor(fark / 86400)} gün önce`
  return t.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}

export default function BildirimZili() {
  const [acik, setAcik] = useState(false)
  const [bildirimler, setBildirimler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  const okunmamisSayisi = useBildirimStore((s) => s.okunmamisSayisi)
  const okunmamisGetir = useBildirimStore((s) => s.okunmamisGetir)
  const pollingBaslat = useBildirimStore((s) => s.pollingBaslat)
  const pollingDurdur = useBildirimStore((s) => s.pollingDurdur)

  // Polling başlat/durdur
  useEffect(() => {
    pollingBaslat()
    return () => pollingDurdur()
  }, [pollingBaslat, pollingDurdur])

  // Panel açılınca son bildirimleri getir
  useEffect(() => {
    if (!acik) return
    const getir = async () => {
      setYukleniyor(true)
      try {
        const { data } = await bildirimApi.listele({ sayfa: 1 })
        if (data.basarili) setBildirimler(data.veri?.kayitlar || [])
      } catch { /* sessiz */ }
      setYukleniyor(false)
    }
    getir()
  }, [acik])

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!acik) return
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setAcik(false)
      }
    }
    const handleEsc = (e) => { if (e.key === 'Escape') setAcik(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [acik])

  const okunduYap = async (id) => {
    try {
      await bildirimApi.okunduYap(id)
      setBildirimler((prev) => prev.map((b) => b.id === id ? { ...b, okundu_mu: 1 } : b))
      okunmamisGetir()
    } catch { /* */ }
  }

  const tumunuOku = async () => {
    try {
      await bildirimApi.tumunuOkunduYap()
      setBildirimler((prev) => prev.map((b) => ({ ...b, okundu_mu: 1 })))
      okunmamisGetir()
    } catch { /* */ }
  }

  const tumunuGor = () => {
    setAcik(false)
    navigate('/bildirimler')
  }

  const bildirimTikla = (b) => {
    if (!b.okundu_mu) okunduYap(b.id)
    if (b.aksiyon_url) {
      setAcik(false)
      navigate(b.aksiyon_url)
    }
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Çan ikonu */}
      <button
        className="p-icon-btn"
        type="button"
        aria-label="Bildirimler"
        onClick={() => setAcik(!acik)}
        style={{ position: 'relative' }}
      >
        <i className={`bi ${acik ? 'bi-bell-fill' : 'bi-bell'}`} style={{ fontSize: 18 }} aria-hidden="true" />
        {okunmamisSayisi > 0 && (
          <span className="bld-badge">
            {okunmamisSayisi > 99 ? '99+' : okunmamisSayisi}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {acik && (
        <div className="bld-panel">
          {/* Başlık */}
          <div className="bld-panel-header">
            <span className="bld-panel-title">Bildirimler</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {okunmamisSayisi > 0 && (
                <button className="bld-panel-action" onClick={tumunuOku} type="button">
                  Tümünü oku
                </button>
              )}
            </div>
          </div>

          {/* Liste */}
          <div className="bld-panel-list">
            {yukleniyor ? (
              <div className="bld-panel-empty">
                <div className="spinner-border spinner-border-sm text-muted" />
              </div>
            ) : bildirimler.length === 0 ? (
              <div className="bld-panel-empty">
                <i className="bi bi-bell-slash" style={{ fontSize: 28, color: '#D1D5DB', marginBottom: 6 }} />
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>Bildirim yok</span>
              </div>
            ) : (
              bildirimler.slice(0, 8).map((b) => {
                const renk = ONCELIK_RENK[b.oncelik] || ONCELIK_RENK.normal
                const ikon = TIP_IKON[b.tip] || 'bi-bell'
                return (
                  <div
                    key={b.id}
                    className={`bld-item${b.okundu_mu ? '' : ' bld-item-unread'}`}
                    onClick={() => bildirimTikla(b)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="bld-item-icon" style={{ background: renk.bg, color: renk.border }}>
                      <i className={`bi ${ikon}`} />
                    </div>
                    <div className="bld-item-content">
                      <div className="bld-item-title">{b.baslik}</div>
                      <div className="bld-item-time">{zamanOnce(b.olusturma_tarihi)}</div>
                    </div>
                    {!b.okundu_mu && <div className="bld-item-dot" style={{ background: renk.dot }} />}
                  </div>
                )
              })
            )}
          </div>

          {/* Alt */}
          <div className="bld-panel-footer">
            <button className="bld-panel-footer-btn" onClick={tumunuGor} type="button">
              Tüm bildirimleri gör
              <i className="bi bi-arrow-right" style={{ marginLeft: 4, fontSize: 12 }} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bld-badge {
          position: absolute;
          top: 2px; right: 2px;
          min-width: 18px; height: 18px;
          padding: 0 5px;
          background: #DC2626;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          line-height: 18px;
          text-align: center;
          border-radius: 20px;
          pointer-events: none;
          animation: bld-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes bld-pop {
          0%   { transform: scale(0); }
          100% { transform: scale(1); }
        }

        .bld-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: -8px;
          width: 360px;
          max-height: 520px;
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          z-index: 1050;
          display: flex;
          flex-direction: column;
          animation: bld-slide 0.2s ease-out;
          overflow: hidden;
        }
        @keyframes bld-slide {
          0%   { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .bld-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px 12px;
          border-bottom: 1px solid #F3F4F6;
        }
        .bld-panel-title {
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
        }
        .bld-panel-action {
          background: none;
          border: none;
          color: #10B981;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .bld-panel-action:hover { background: #F0FDF4; }

        .bld-panel-list {
          flex: 1;
          overflow-y: auto;
          max-height: 380px;
        }
        .bld-panel-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 4px;
        }

        .bld-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 18px;
          cursor: pointer;
          transition: background 0.12s;
          position: relative;
          border-bottom: 1px solid #FAFAFA;
        }
        .bld-item:hover { background: #F9FAFB; }
        .bld-item-unread { background: #F0FDF9; }
        .bld-item-unread:hover { background: #ECFDF5; }

        .bld-item-icon {
          flex-shrink: 0;
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }

        .bld-item-content { flex: 1; min-width: 0; }
        .bld-item-title {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .bld-item-unread .bld-item-title { font-weight: 600; color: #111827; }
        .bld-item-time {
          font-size: 11px;
          color: #9CA3AF;
          margin-top: 2px;
        }

        .bld-item-dot {
          flex-shrink: 0;
          width: 8px; height: 8px;
          border-radius: 50%;
          margin-top: 5px;
        }

        .bld-panel-footer {
          padding: 10px 18px;
          border-top: 1px solid #F3F4F6;
          text-align: center;
        }
        .bld-panel-footer-btn {
          background: none;
          border: none;
          color: #10B981;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.15s;
          width: 100%;
        }
        .bld-panel-footer-btn:hover { background: #F0FDF4; }

        @media (max-width: 767px) {
          .bld-panel {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            max-height: 85vh;
            border-radius: 16px 16px 0 0;
          }
        }
      `}</style>
    </div>
  )
}
