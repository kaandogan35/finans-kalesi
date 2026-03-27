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

      {/* Mobil backdrop overlay */}
      {acik && <div className="bld-backdrop" onClick={() => setAcik(false)} aria-hidden="true" />}

      {/* Dropdown panel */}
      {acik && (
        <div className="bld-panel">
          {/* Başlık */}
          <div className="bld-panel-header">
            <div className="bld-panel-header-left">
              <div className="bld-panel-header-icon">
                <i className="bi bi-bell-fill" />
              </div>
              <div>
                <span className="bld-panel-title">Bildirimler</span>
                {okunmamisSayisi > 0 && (
                  <span className="bld-panel-count">{okunmamisSayisi} okunmamış</span>
                )}
              </div>
            </div>
            {okunmamisSayisi > 0 && (
              <button className="bld-panel-action" onClick={tumunuOku} type="button">
                <i className="bi bi-check2-all" style={{ marginRight: 4 }} />
                Tümünü oku
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="bld-panel-list">
            {yukleniyor ? (
              <div className="bld-panel-empty">
                <div className="spinner-border spinner-border-sm" style={{ color: '#10B981' }} />
              </div>
            ) : bildirimler.length === 0 ? (
              <div className="bld-panel-empty">
                <div className="bld-empty-icon-wrap">
                  <i className="bi bi-bell" />
                </div>
                <span className="bld-empty-title">Henüz bildirim yok</span>
                <span className="bld-empty-desc">Yeni bildirimler burada görünecek</span>
              </div>
            ) : (
              bildirimler.slice(0, 8).map((b, idx) => {
                const renk = ONCELIK_RENK[b.oncelik] || ONCELIK_RENK.normal
                const ikon = TIP_IKON[b.tip] || 'bi-bell'
                return (
                  <div
                    key={b.id}
                    className={`bld-item${b.okundu_mu ? '' : ' bld-item-unread'}`}
                    onClick={() => bildirimTikla(b)}
                    role="button"
                    tabIndex={0}
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <div className="bld-item-icon" style={{ background: renk.bg, color: renk.border }}>
                      <i className={`bi ${ikon}`} />
                    </div>
                    <div className="bld-item-content">
                      <div className="bld-item-title">{b.baslik}</div>
                      <div className="bld-item-meta">
                        <span className="bld-item-time">{zamanOnce(b.olusturma_tarihi)}</span>
                        {!b.okundu_mu && <span className="bld-item-dot" style={{ background: renk.dot }} />}
                      </div>
                    </div>
                    {b.aksiyon_url && (
                      <i className="bi bi-chevron-right bld-item-arrow" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Alt */}
          <div className="bld-panel-footer">
            <button className="bld-panel-footer-btn" onClick={tumunuGor} type="button">
              Tüm bildirimleri gör
              <i className="bi bi-arrow-right" style={{ marginLeft: 6 }} />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
