import { useState, useEffect, useCallback } from 'react'
import { bildirimApi } from '../../api/bildirimler'
import useBildirimStore from '../../stores/bildirimStore'

// ─── SABİTLER ─────────────────────────────────────────────────

const ONCELIK_RENK = {
  kritik:  { bg: '#FEF2F2', text: '#DC2626', label: 'Kritik' },
  yuksek:  { bg: '#FFFBEB', text: '#F59E0B', label: 'Yüksek' },
  normal:  { bg: '#F0FDF4', text: '#10B981', label: 'Normal' },
  dusuk:   { bg: '#F9FAFB', text: '#6B7280', label: 'Düşük' },
}

const TIP_BILGI = {
  odeme_vade:    { ikon: 'bi-calendar-event',        label: 'Ödeme Vadesi',     renk: '#10B981' },
  cek_vade:      { ikon: 'bi-file-earmark-text',     label: 'Çek/Senet Vadesi', renk: '#3B82F6' },
  geciken_odeme: { ikon: 'bi-exclamation-triangle',  label: 'Geciken Ödeme',    renk: '#F59E0B' },
  guvenlik:      { ikon: 'bi-shield-exclamation',    label: 'Güvenlik',         renk: '#8B5CF6' },
  sistem:        { ikon: 'bi-info-circle',           label: 'Sistem',           renk: '#6B7280' },
}

const TERCIH_TIPLER = [
  { key: 'odeme_vade',    label: 'Ödeme Vadesi Yaklaşınca',   desc: 'Vadesi 3 gün/1 gün/bugün olan ödemeler' },
  { key: 'cek_vade',      label: 'Çek/Senet Vadesi Yaklaşınca', desc: 'Vadesi 7/3/1 gün veya bugün olan çek/senetler' },
  { key: 'geciken_odeme',  label: 'Geciken Ödemeler',           desc: 'Vadesi geçmiş ama tahsil edilmemiş ödemeler' },
  { key: 'guvenlik',      label: 'Güvenlik Uyarıları',         desc: 'Yeni cihazdan giriş, başarısız denemeler' },
  { key: 'sistem',        label: 'Sistem Bildirimleri',         desc: 'Plan değişikliği, bakım bildirimleri' },
]

function tarihFormat(tarih) {
  if (!tarih) return ''
  const t = new Date(tarih)
  return t.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function zamanOnce(tarih) {
  if (!tarih) return ''
  const fark = Math.floor((new Date() - new Date(tarih)) / 1000)
  if (fark < 60) return 'Az önce'
  if (fark < 3600) return `${Math.floor(fark / 60)} dk önce`
  if (fark < 86400) return `${Math.floor(fark / 3600)} saat önce`
  if (fark < 604800) return `${Math.floor(fark / 86400)} gün önce`
  return tarihFormat(tarih)
}

// ═══════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════

export default function BildirimlerEkrani() {
  const [aktifSekme, setAktifSekme] = useState('bildirimler')

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Sayfa Header */}
      <div className="p-page-header">
        <div className="p-page-header-left">
          <div className="p-page-header-icon">
            <i className="bi bi-bell-fill" />
          </div>
          <div>
            <h1 className="p-page-title">Bildirimler</h1>
            <p className="p-page-sub">Tüm bildirimlerinizi görüntüleyin ve tercihlerinizi yönetin</p>
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="bld-tabs">
        <button
          className={`bld-tab${aktifSekme === 'bildirimler' ? ' bld-tab-active' : ''}`}
          onClick={() => setAktifSekme('bildirimler')}
          type="button"
        >
          <i className="bi bi-bell" />
          <span>Bildirimler</span>
        </button>
        <button
          className={`bld-tab${aktifSekme === 'tercihler' ? ' bld-tab-active' : ''}`}
          onClick={() => setAktifSekme('tercihler')}
          type="button"
        >
          <i className="bi bi-sliders" />
          <span>Tercihler</span>
        </button>
      </div>

      {/* İçerik */}
      {aktifSekme === 'bildirimler' ? <BildirimListesi /> : <BildirimTercihleri />}

      <style>{BildirimlerCSS}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BİLDİRİM LİSTESİ
// ═══════════════════════════════════════════════════════════════

function BildirimListesi() {
  const [bildirimler, setBildirimler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sayfa, setSayfa] = useState(1)
  const [toplamSayfa, setToplamSayfa] = useState(1)
  const [filtreTip, setFiltreTip] = useState('')
  const [filtreOkundu, setFiltreOkundu] = useState('')
  const okunmamisGetir = useBildirimStore((s) => s.okunmamisGetir)

  const getir = useCallback(async () => {
    setYukleniyor(true)
    try {
      const params = { sayfa }
      if (filtreTip) params.tip = filtreTip
      if (filtreOkundu !== '') params.okundu_mu = filtreOkundu
      const { data } = await bildirimApi.listele(params)
      if (data.basarili) {
        setBildirimler(data.veri?.kayitlar || [])
        setToplamSayfa(data.veri?.toplam_sayfa || 1)
      }
    } catch { /* */ }
    setYukleniyor(false)
  }, [sayfa, filtreTip, filtreOkundu])

  useEffect(() => { getir() }, [getir])

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

  const bildirimSil = async (id) => {
    try {
      await bildirimApi.sil(id)
      setBildirimler((prev) => prev.filter((b) => b.id !== id))
      okunmamisGetir()
    } catch { /* */ }
  }

  return (
    <div className="bld-content-card">
      {/* Filtreler */}
      <div className="bld-filters">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          <select
            className="form-select form-select-sm bld-filter-select"
            value={filtreTip}
            onChange={(e) => { setFiltreTip(e.target.value); setSayfa(1) }}
          >
            <option value="">Tüm tipler</option>
            {Object.entries(TIP_BILGI).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            className="form-select form-select-sm bld-filter-select"
            value={filtreOkundu}
            onChange={(e) => { setFiltreOkundu(e.target.value); setSayfa(1) }}
          >
            <option value="">Tümü</option>
            <option value="0">Okunmamış</option>
            <option value="1">Okunmuş</option>
          </select>
        </div>
        <button className="bld-mark-all-btn" onClick={tumunuOku} type="button">
          <i className="bi bi-check2-all" />
          <span>Tümünü oku</span>
        </button>
      </div>

      {/* Liste */}
      {yukleniyor ? (
        <div className="bld-empty">
          <div className="spinner-border spinner-border-sm text-muted" />
        </div>
      ) : bildirimler.length === 0 ? (
        <div className="bld-empty">
          <i className="bi bi-bell-slash" style={{ fontSize: 36, color: '#D1D5DB' }} />
          <span style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Bildirim bulunamadı</span>
        </div>
      ) : (
        <div className="bld-list">
          {bildirimler.map((b) => {
            const tip = TIP_BILGI[b.tip] || TIP_BILGI.sistem
            const oncelik = ONCELIK_RENK[b.oncelik] || ONCELIK_RENK.normal
            return (
              <div key={b.id} className={`bld-row${b.okundu_mu ? '' : ' bld-row-unread'}`}>
                <div className="bld-row-icon" style={{ background: `${tip.renk}14`, color: tip.renk }}>
                  <i className={`bi ${tip.ikon}`} />
                </div>
                <div className="bld-row-body">
                  <div className="bld-row-top">
                    <span className="bld-row-title">{b.baslik}</span>
                    <span
                      className="bld-row-priority"
                      style={{ background: oncelik.bg, color: oncelik.text }}
                    >
                      {oncelik.label}
                    </span>
                  </div>
                  {b.mesaj && <div className="bld-row-msg">{b.mesaj}</div>}
                  <div className="bld-row-meta">
                    <span className="bld-row-type-badge" style={{ color: tip.renk }}>
                      <i className={`bi ${tip.ikon}`} style={{ fontSize: 10, marginRight: 3 }} />
                      {tip.label}
                    </span>
                    <span className="bld-row-time">{zamanOnce(b.olusturma_tarihi)}</span>
                  </div>
                </div>
                <div className="bld-row-actions">
                  {!b.okundu_mu && (
                    <button
                      className="bld-row-btn"
                      title="Okundu yap"
                      onClick={() => okunduYap(b.id)}
                      type="button"
                    >
                      <i className="bi bi-check2" />
                    </button>
                  )}
                  <button
                    className="bld-row-btn bld-row-btn-del"
                    title="Sil"
                    onClick={() => bildirimSil(b.id)}
                    type="button"
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sayfalama */}
      {toplamSayfa > 1 && (
        <div className="bld-pagination">
          <button
            className="bld-page-btn"
            disabled={sayfa <= 1}
            onClick={() => setSayfa((s) => s - 1)}
            type="button"
          >
            <i className="bi bi-chevron-left" />
          </button>
          <span className="bld-page-info">{sayfa} / {toplamSayfa}</span>
          <button
            className="bld-page-btn"
            disabled={sayfa >= toplamSayfa}
            onClick={() => setSayfa((s) => s + 1)}
            type="button"
          >
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BİLDİRİM TERCİHLERİ
// ═══════════════════════════════════════════════════════════════

function BildirimTercihleri() {
  const [tercihler, setTercihler] = useState({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [mesaj, setMesaj] = useState('')

  useEffect(() => {
    const getir = async () => {
      try {
        const { data } = await bildirimApi.tercihlerGetir()
        if (data.basarili) setTercihler(data.veri?.tercihler || {})
      } catch { /* */ }
      setYukleniyor(false)
    }
    getir()
  }, [])

  const toggle = (tip, kanal) => {
    setTercihler((prev) => ({
      ...prev,
      [tip]: {
        ...prev[tip],
        [kanal]: prev[tip]?.[kanal] ? 0 : 1,
      },
    }))
  }

  const kaydet = async () => {
    setKaydediyor(true)
    setMesaj('')
    try {
      const { data } = await bildirimApi.tercihlerKaydet(tercihler)
      if (data.basarili) {
        setMesaj('Tercihler kaydedildi')
        setTimeout(() => setMesaj(''), 3000)
      }
    } catch {
      setMesaj('Kaydetme sırasında hata oluştu')
    }
    setKaydediyor(false)
  }

  if (yukleniyor) {
    return (
      <div className="bld-content-card">
        <div className="bld-empty"><div className="spinner-border spinner-border-sm text-muted" /></div>
      </div>
    )
  }

  return (
    <div className="bld-content-card">
      <div style={{ padding: '18px 22px 12px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
          Bildirim Kanalları
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Her bildirim tipi için hangi kanallardan bildirim almak istediğinizi seçin
        </p>
      </div>

      <div className="table-responsive">
        <table className="table align-middle" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: 22, width: '45%', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bildirim Tipi</th>
              <th style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Uygulama İçi</th>
              <th style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>E-posta</th>
              <th style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.5 }}>SMS</th>
            </tr>
          </thead>
          <tbody>
            {TERCIH_TIPLER.map((t) => {
              const tip = TIP_BILGI[t.key]
              const pref = tercihler[t.key] || { uygulama_ici: 1, email: 1, sms: 0 }
              return (
                <tr key={t.key}>
                  <td style={{ paddingLeft: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: `${tip.renk}14`, color: tip.renk,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, flexShrink: 0,
                      }}>
                        <i className={`bi ${tip.ikon}`} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.3 }}>{t.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <ToggleSwitch aktif={!!pref.uygulama_ici} onClick={() => toggle(t.key, 'uygulama_ici')} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <ToggleSwitch aktif={!!pref.email} onClick={() => toggle(t.key, 'email')} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
                      <ToggleSwitch aktif={false} onClick={() => {}} disabled />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bld-tercih-footer">
        {mesaj && (
          <span style={{
            fontSize: 13, fontWeight: 500,
            color: mesaj.includes('hata') ? '#DC2626' : '#10B981',
          }}>
            {mesaj}
          </span>
        )}
        <button
          className="bld-save-btn"
          onClick={kaydet}
          disabled={kaydediyor}
          type="button"
        >
          {kaydediyor ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            <>
              <i className="bi bi-check2" />
              <span>Kaydet</span>
            </>
          )}
        </button>
      </div>

      <div style={{ padding: '0 22px 18px' }}>
        <div style={{
          background: '#F9FAFB', borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <i className="bi bi-info-circle" style={{ color: '#9CA3AF', fontSize: 15, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
            SMS bildirimleri yakında eklenecektir. Sağlayıcı entegrasyonu tamamlandığında bu kanal aktif olacaktır.
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Toggle Switch bileşeni ──────────────────────────────────

function ToggleSwitch({ aktif, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`bld-toggle${aktif ? ' bld-toggle-on' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <span className="bld-toggle-thumb" />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════

const BildirimlerCSS = `
  /* Sekmeler */
  .bld-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    background: #F3F4F6;
    padding: 4px;
    border-radius: 12px;
  }
  .bld-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    background: none;
    color: #6B7280;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    min-height: 44px;
  }
  .bld-tab:hover { color: #374151; }
  .bld-tab-active {
    background: #fff;
    color: #10B981;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  /* İçerik kartı */
  .bld-content-card {
    background: #fff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    overflow: hidden;
  }

  /* Filtreler */
  .bld-filters {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-bottom: 1px solid #F3F4F6;
    flex-wrap: wrap;
  }
  .bld-filter-select {
    max-width: 170px;
    font-size: 13px;
    border-radius: 10px;
    border-color: #E5E7EB;
    min-height: 36px;
  }
  .bld-filter-select:focus {
    border-color: #10B981;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
  }
  .bld-mark-all-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: 1px solid #E5E7EB;
    color: #374151;
    font-size: 12px;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    min-height: 36px;
  }
  .bld-mark-all-btn:hover { border-color: #10B981; color: #10B981; }

  /* Boş durum */
  .bld-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 4px;
  }

  /* Bildirim satırı */
  .bld-list {}
  .bld-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    border-bottom: 1px solid #FAFAFA;
    transition: background 0.12s;
  }
  .bld-row:last-child { border-bottom: none; }
  .bld-row:hover { background: #FAFAFA; }
  .bld-row-unread { background: #F0FDF9; }
  .bld-row-unread:hover { background: #ECFDF5; }

  .bld-row-icon {
    flex-shrink: 0;
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .bld-row-body { flex: 1; min-width: 0; }
  .bld-row-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .bld-row-title {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    line-height: 1.35;
  }
  .bld-row-unread .bld-row-title { font-weight: 650; color: #111827; }
  .bld-row-priority {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .bld-row-msg {
    font-size: 12px;
    color: #6B7280;
    margin-top: 3px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .bld-row-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 6px;
  }
  .bld-row-type-badge {
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
  }
  .bld-row-time {
    font-size: 11px;
    color: #9CA3AF;
  }

  .bld-row-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .bld-row:hover .bld-row-actions { opacity: 1; }

  .bld-row-btn {
    width: 30px; height: 30px;
    border: none;
    background: #F3F4F6;
    color: #6B7280;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.12s;
  }
  .bld-row-btn:hover { background: #E5E7EB; color: #374151; }
  .bld-row-btn-del:hover { background: #FEF2F2; color: #DC2626; }

  /* Sayfalama */
  .bld-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 14px;
    border-top: 1px solid #F3F4F6;
  }
  .bld-page-btn {
    width: 36px; height: 36px;
    border: 1px solid #E5E7EB;
    background: #fff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 13px;
    color: #374151;
    transition: all 0.12s;
  }
  .bld-page-btn:hover:not(:disabled) { border-color: #10B981; color: #10B981; }
  .bld-page-btn:disabled { opacity: 0.4; cursor: default; }
  .bld-page-info { font-size: 13px; color: #6B7280; font-weight: 500; }

  /* Tercih footer */
  .bld-tercih-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 14px 22px;
    border-top: 1px solid #F3F4F6;
  }
  .bld-save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #10B981;
    color: #fff;
    border: none;
    padding: 0 20px;
    min-height: 40px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .bld-save-btn:hover { background: #059669; }
  .bld-save-btn:disabled { opacity: 0.6; cursor: default; }

  /* Toggle switch */
  .bld-toggle {
    position: relative;
    width: 42px; height: 24px;
    background: #D1D5DB;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: background 0.2s;
    padding: 0;
    flex-shrink: 0;
  }
  .bld-toggle-on { background: #10B981; }
  .bld-toggle-thumb {
    position: absolute;
    top: 3px; left: 3px;
    width: 18px; height: 18px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .bld-toggle-on .bld-toggle-thumb { transform: translateX(18px); }

  @media (max-width: 767px) {
    .bld-filters { flex-direction: column; align-items: stretch; }
    .bld-filter-select { max-width: 100%; }
    .bld-row-actions { opacity: 1; }
    .bld-row { padding: 12px 14px; }
    .bld-row-msg { -webkit-line-clamp: 1; }
  }
`
