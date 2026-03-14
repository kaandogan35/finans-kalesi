/**
 * Finans Kalesi V2 — Tasarim Demo Sayfasi
 *
 * Tum bilesenlerin canli gosterimi.
 * Web (acik) / Mobil (koyu) tema toggle ile gecis yapilabilir.
 * Auth gerektirmez — /tasarim-demo-v2 rotasinda erisilir.
 */

import { useState, useEffect } from 'react'

// ─── Para format yardimcisi ───
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

export default function TasarimDemoV2() {
  const [tema, setTema] = useState('web') // 'web' | 'mobil'
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [alertMsg, setAlertMsg] = useState(null) // { type, text }

  // ESC ile modallari kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setShowDeleteModal(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = (showModal || showDeleteModal) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal, showDeleteModal])

  const isDark = tema === 'mobil'

  // ─── Stiller ───
  const s = getStyles(isDark)

  return (
    <div style={s.page}>
      <style>{globalCSS}</style>

      {/* ─── Ust Bar ─── */}
      <div style={s.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="bi bi-shield-lock-fill" style={{ fontSize: 24, color: '#d4a017' }}></i>
          <span style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#fff' : '#1e3a5f' }}>
            Finans Kalesi V2 — Tasarim Demo
          </span>
        </div>
        <div style={s.toggleContainer}>
          <button
            style={{ ...s.toggleBtn, ...(tema === 'web' ? s.toggleActive : {}) }}
            onClick={() => setTema('web')}
          >
            <i className="bi bi-display me-2"></i>Web
          </button>
          <button
            style={{ ...s.toggleBtn, ...(tema === 'mobil' ? s.toggleActive : {}) }}
            onClick={() => setTema('mobil')}
          >
            <i className="bi bi-phone me-2"></i>Mobil
          </button>
        </div>
      </div>

      <div style={{ maxWidth: tema === 'mobil' ? 420 : 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* ═══════════════════════════════════════ */}
        {/* 1. RENK PALETi */}
        {/* ═══════════════════════════════════════ */}
        <Section title="1. Renk Paleti" icon="bi-palette-fill" isDark={isDark}>
          <div className="d-flex flex-wrap gap-3">
            {[
              { name: 'Lacivert', hex: '#1e3a5f' },
              { name: 'Lacivert Acik', hex: '#2c5282' },
              { name: 'Altin', hex: '#d4a017' },
              { name: 'Altin Acik', hex: '#e6b422' },
              { name: 'Yesil', hex: '#10b981' },
              { name: 'Kirmizi', hex: '#ef4444' },
              { name: 'Turuncu', hex: '#f59e0b' },
              { name: 'Mavi', hex: '#3b82f6' },
            ].map((c) => (
              <div key={c.hex} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 8, background: c.hex,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  marginBottom: 6,
                }}></div>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.textSecondary }}>{c.name}</div>
                <div style={{ fontSize: 10, color: s.textMuted, fontFamily: 'Inter, sans-serif' }}>{c.hex}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 2. TiPOGRAFi */}
        {/* ═══════════════════════════════════════ */}
        <Section title="2. Tipografi" icon="bi-fonts" isDark={isDark}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: s.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Outfit — Govde Metni
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.textPrimary, fontFamily: 'Outfit, sans-serif' }}>
              Finans Kalesi Varlik Yonetimi
            </div>
            <div style={{ fontSize: 14, color: s.textSecondary, fontFamily: 'Outfit, sans-serif' }}>
              Bu bir alt baslik ornegi. Cari hesaplarinizi yonetin.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: s.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Inter — Finansal Rakamlar
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#10b981', fontFamily: 'Inter, sans-serif' }}>
              {TL(125750)} TL
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>
              -{TL(3200.50)} TL
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 3. BUTONLAR */}
        {/* ═══════════════════════════════════════ */}
        <Section title="3. Butonlar" icon="bi-hand-index-fill" isDark={isDark}>
          <div className="d-flex flex-wrap gap-3 mb-3">
            <button style={s.btnPrimary}>
              <i className="bi bi-plus-lg me-2"></i>Yeni Ekle
            </button>
            <button style={s.btnGold}>
              <i className="bi bi-star-fill me-2"></i>Altin Buton
            </button>
            <button style={s.btnSecondary}>
              Iptal
            </button>
            <button style={s.btnDanger}>
              <i className="bi bi-trash me-2"></i>Sil
            </button>
            <button style={s.btnGhost}>
              Ghost Buton
            </button>
          </div>
          <div className="d-flex flex-wrap gap-3">
            <button style={{ ...s.btnPrimary, opacity: 0.5, cursor: 'not-allowed' }} disabled>
              Disabled
            </button>
            <button style={{ ...s.btnSecondary, opacity: 0.5, cursor: 'not-allowed' }} disabled>
              Disabled
            </button>
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 4. KARTLAR */}
        {/* ═══════════════════════════════════════ */}
        <Section title="4. Kartlar" icon="bi-card-heading" isDark={isDark}>
          <div className="row g-3">
            {/* Varsayilan kart */}
            <div className="col-md-6">
              <div style={{ ...s.card, borderTop: '3px solid #d4a017' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.textPrimary, marginBottom: 8 }}>
                  Varsayilan Kart
                </div>
                <div style={{ fontSize: 13, color: s.textSecondary }}>
                  Altin ust cizgili standart kart. Tum genel icerikler icin kullanilir.
                </div>
              </div>
            </div>
            {/* Gelir karti */}
            <div className="col-md-6">
              <div style={{ ...s.card, borderTop: '3px solid #10b981' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.textPrimary, marginBottom: 8 }}>
                  Gelir Karti
                </div>
                <div style={{ fontSize: 13, color: s.textSecondary }}>
                  Yesil ust cizgili. Gelir, alacak ve pozitif durumlar icin.
                </div>
              </div>
            </div>
            {/* Gider karti */}
            <div className="col-md-6">
              <div style={{ ...s.card, borderTop: '3px solid #ef4444' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.textPrimary, marginBottom: 8 }}>
                  Gider Karti
                </div>
                <div style={{ fontSize: 13, color: s.textSecondary }}>
                  Kirmizi ust cizgili. Gider, borc ve negatif durumlar icin.
                </div>
              </div>
            </div>
            {/* Bilgi karti */}
            <div className="col-md-6">
              <div style={{ ...s.card, borderTop: '3px solid #3b82f6' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.textPrimary, marginBottom: 8 }}>
                  Bilgi Karti
                </div>
                <div style={{ fontSize: 13, color: s.textSecondary }}>
                  Mavi ust cizgili. Bilgilendirme ve neutral durumlar icin.
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 5. KPI KARTLARI */}
        {/* ═══════════════════════════════════════ */}
        <Section title="5. KPI Kartlari" icon="bi-graph-up-arrow" isDark={isDark}>
          <div className="row g-3">
            {[
              { label: 'TOPLAM ALACAK', value: 125750, sub: '12 cari hesap', color: '#10b981', bgLight: '#ecfdf5', icon: 'bi-arrow-down-left' },
              { label: 'TOPLAM BORC', value: -48200, sub: '8 cari hesap', color: '#ef4444', bgLight: '#fef2f2', icon: 'bi-arrow-up-right' },
              { label: 'AKTIF CEK', value: 34500, sub: '5 adet cek', color: '#d4a017', bgLight: '#fef9e7', icon: 'bi-file-earmark-text-fill' },
              { label: 'BEKLEYEN ODEME', value: 12800, sub: '3 fatura', color: '#3b82f6', bgLight: '#eff6ff', icon: 'bi-credit-card-2-fill' },
            ].map((kpi) => (
              <div className="col-md-6 col-lg-3" key={kpi.label}>
                <div style={{ ...s.card, borderTop: `3px solid ${kpi.color}` }}>
                  <div className="d-flex align-items-start gap-3">
                    <div style={{
                      width: 48, height: 48, borderRadius: 10,
                      background: isDark ? `${kpi.color}15` : kpi.bgLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className={`bi ${kpi.icon}`} style={{ fontSize: 22, color: kpi.color }}></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: s.textMuted,
                        textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4,
                      }}>{kpi.label}</div>
                      <div style={{
                        fontSize: 22, fontWeight: 600, color: kpi.color,
                        fontFamily: 'Inter, sans-serif',
                      }}>{TL(Math.abs(kpi.value))} TL</div>
                      <div style={{ fontSize: 12, color: s.textMuted }}>{kpi.sub}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 6. TAB SiSTEMi */}
        {/* ═══════════════════════════════════════ */}
        <Section title="6. Tab Sistemi (Kart Tab)" icon="bi-segmented-nav" isDark={isDark}>
          <div style={s.tabContainer}>
            {['Tum Kayitlar', 'Musteriler', 'Tedarikciler', 'Arsiv'].map((tab, i) => (
              <button
                key={tab}
                style={{ ...s.tab, ...(activeTab === i ? s.tabActive : {}) }}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ ...s.card, borderTop: '3px solid #d4a017' }}>
            <div style={{ fontSize: 14, color: s.textSecondary }}>
              Secili tab: <strong style={{ color: s.textPrimary }}>{['Tum Kayitlar', 'Musteriler', 'Tedarikciler', 'Arsiv'][activeTab]}</strong>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 7. FORM INPUT */}
        {/* ═══════════════════════════════════════ */}
        <Section title="7. Form Alanlari" icon="bi-input-cursor-text" isDark={isDark}>
          <div className="row g-3">
            <div className="col-md-6">
              <label style={s.inputLabel}>Ad Soyad</label>
              <input style={s.input} type="text" placeholder="Kaan Dogan" />
            </div>
            <div className="col-md-6">
              <label style={s.inputLabel}>E-Posta</label>
              <input style={s.input} type="email" placeholder="kaan@example.com" />
            </div>
            <div className="col-md-6">
              <label style={s.inputLabel}>Telefon</label>
              <input style={s.input} type="tel" placeholder="0532 123 45 67" />
            </div>
            <div className="col-md-6">
              <label style={s.inputLabel}>Cari Turu</label>
              <select style={s.input}>
                <option>Musteri</option>
                <option>Tedarikci</option>
                <option>Her Ikisi</option>
              </select>
            </div>
            <div className="col-12">
              <label style={s.inputLabel}>Aciklama</label>
              <textarea style={{ ...s.input, minHeight: 80 }} placeholder="Not ekleyin..."></textarea>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 8. TABLO (Kart Satirlar) */}
        {/* ═══════════════════════════════════════ */}
        <Section title="8. Tablo (Kart Satirlar)" icon="bi-table" isDark={isDark}>
          <div className="table-responsive">
            {/* Header */}
            <div style={s.tableHeader}>
              <span style={{ flex: 2 }}>AD SOYAD</span>
              <span style={{ flex: 1 }}>TUR</span>
              <span style={{ flex: 1, textAlign: 'right' }}>BAKIYE</span>
              <span style={{ flex: 1, textAlign: 'center' }}>DURUM</span>
            </div>
            {/* Rows */}
            {[
              { name: 'Ali Kaya', type: 'Musteri', balance: 12500, status: 'Aktif' },
              { name: 'Mehmet Demir', type: 'Tedarikci', balance: -3200, status: 'Aktif' },
              { name: 'Ayse Yilmaz', type: 'Musteri', balance: 45800, status: 'Pasif' },
              { name: 'Fatma Celik', type: 'Her Ikisi', balance: -890, status: 'Aktif' },
            ].map((row, i) => (
              <div key={i} style={s.tableRow}>
                <span style={{ flex: 2, fontWeight: 500, color: s.textPrimary }}>{row.name}</span>
                <span style={{ flex: 1 }}>
                  <span style={s.badgeType}>{row.type}</span>
                </span>
                <span style={{
                  flex: 1, textAlign: 'right', fontFamily: 'Inter, sans-serif',
                  fontWeight: 600, color: row.balance >= 0 ? '#10b981' : '#ef4444',
                }}>
                  {row.balance < 0 ? '-' : ''}{TL(Math.abs(row.balance))} TL
                </span>
                <span style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{
                    ...s.badgeStatus,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: row.status === 'Aktif' ? '#10b981' : '#94a3b8',
                      boxShadow: row.status === 'Aktif' ? '0 0 6px rgba(16,185,129,0.4)' : 'none',
                    }}></span>
                    {row.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 9. ALERT / BiLDiRiM */}
        {/* ═══════════════════════════════════════ */}
        <Section title="9. Alert / Bildirim (Satir Ici)" icon="bi-bell-fill" isDark={isDark}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ ...s.alert, ...s.alertSuccess }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: 18 }}></i>
              <span>Cari basariyla eklendi.</span>
            </div>
            <div style={{ ...s.alert, ...s.alertError }}>
              <i className="bi bi-x-circle-fill" style={{ fontSize: 18 }}></i>
              <span>Islem sirasinda bir hata olustu. Lutfen tekrar deneyin.</span>
            </div>
            <div style={{ ...s.alert, ...s.alertWarning }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 18 }}></i>
              <span>Bu cek 3 gun icinde vadesi dolacak!</span>
            </div>
            <div style={{ ...s.alert, ...s.alertInfo }}>
              <i className="bi bi-info-circle-fill" style={{ fontSize: 18 }}></i>
              <span>Sistem bakimi 22:00-23:00 arasinda yapilacaktir.</span>
            </div>
          </div>
          {/* Interaktif alert demo */}
          <div className="mt-3 d-flex gap-2">
            <button style={s.btnPrimary} onClick={() => setAlertMsg({ type: 'success', text: 'Basariyla kaydedildi!' })}>
              Basari Goster
            </button>
            <button style={s.btnDanger} onClick={() => setAlertMsg({ type: 'error', text: 'Bir hata olustu!' })}>
              Hata Goster
            </button>
            {alertMsg && (
              <button style={s.btnGhost} onClick={() => setAlertMsg(null)}>Kapat</button>
            )}
          </div>
          {alertMsg && (
            <div style={{
              ...s.alert,
              ...(alertMsg.type === 'success' ? s.alertSuccess : s.alertError),
              marginTop: 10,
            }}>
              <i className={`bi ${alertMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ fontSize: 18 }}></i>
              <span>{alertMsg.text}</span>
            </div>
          )}
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 10. BADGE */}
        {/* ═══════════════════════════════════════ */}
        <Section title="10. Badge Sistemi" icon="bi-tag-fill" isDark={isDark}>
          <div className="d-flex flex-wrap gap-3 align-items-center">
            <span style={s.badgeGold}>Premium</span>
            <span style={s.badgeType}>Musteri</span>
            <span style={s.badgeType}>Tedarikci</span>
            <span style={s.badgeStatus}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.4)' }}></span>
              Aktif
            </span>
            <span style={s.badgeStatus}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.4)' }}></span>
              Vadesi Gecmis
            </span>
            <span style={s.badgeStatus}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.4)' }}></span>
              Beklemede
            </span>
            <span style={s.badgeStatus}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px rgba(59,130,246,0.4)' }}></span>
              Isleniyor
            </span>
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 11. MODAL */}
        {/* ═══════════════════════════════════════ */}
        <Section title="11. Modal" icon="bi-window-stack" isDark={isDark}>
          <div className="d-flex gap-3">
            <button style={s.btnPrimary} onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-lg me-2"></i>Modal Ac
            </button>
            <button style={s.btnDanger} onClick={() => setShowDeleteModal(true)}>
              <i className="bi bi-trash me-2"></i>Silme Onayi
            </button>
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 12. EMPTY STATE & LOADING */}
        {/* ═══════════════════════════════════════ */}
        <Section title="12. Empty State & Loading" icon="bi-inbox" isDark={isDark}>
          <div className="row g-3">
            <div className="col-md-6">
              <div style={s.card}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', minHeight: 200, textAlign: 'center', padding: 20,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14,
                  }}>
                    <i className="bi bi-inbox" style={{ fontSize: 24, color: s.textMuted }}></i>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: s.textPrimary, marginBottom: 4 }}>
                    Henuz kayit yok
                  </div>
                  <div style={{ fontSize: 13, color: s.textMuted, marginBottom: 14 }}>
                    Ilk kaydinizi ekleyerek baslayabilirsiniz
                  </div>
                  <button style={{ ...s.btnPrimary, fontSize: 13, padding: '8px 16px', minHeight: 38 }}>
                    <i className="bi bi-plus-lg me-2"></i>Yeni Ekle
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div style={s.card}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', minHeight: 200, textAlign: 'center', padding: 20,
                }}>
                  <div className="v2-spinner" style={{
                    width: 36, height: 36, borderRadius: '50%', marginBottom: 14,
                    border: `3px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                    borderTopColor: '#d4a017',
                  }}></div>
                  <div style={{ fontSize: 14, color: s.textSecondary }}>Yukleniyor...</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════ */}
        {/* 13. GiRiS SAYFASI ONIZLEME */}
        {/* ═══════════════════════════════════════ */}
        <Section title="13. Giris Sayfasi Onizleme" icon="bi-box-arrow-in-right" isDark={isDark}>
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1923 100%)',
            borderRadius: 10, padding: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 360,
          }}>
            <div style={{
              background: '#ffffff', borderRadius: 10, padding: 32,
              width: '100%', maxWidth: 360,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: '#fef9e7', border: '1px solid #f0e4b8',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <i className="bi bi-shield-lock-fill" style={{ fontSize: 26, color: '#d4a017' }}></i>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f' }}>Finans Kalesi</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Varlik Yonetimi</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>E-Posta</label>
                <input type="email" placeholder="ornek@mail.com" style={{
                  width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #e2e8f0',
                  borderRadius: 6, minHeight: 44, outline: 'none', fontFamily: 'Outfit, sans-serif',
                  boxSizing: 'border-box',
                }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Sifre</label>
                <input type="password" placeholder="••••••••" style={{
                  width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #e2e8f0',
                  borderRadius: 6, minHeight: 44, outline: 'none', fontFamily: 'Outfit, sans-serif',
                  boxSizing: 'border-box',
                }} />
              </div>
              <button style={{
                width: '100%', padding: '12px', background: '#d4a017', color: '#1e3a5f',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, minHeight: 44,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              }}>Giris Yap</button>
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#94a3b8' }}>
                Hesabiniz yok mu? <span style={{ color: '#d4a017', cursor: 'pointer', fontWeight: 500 }}>Kayit Olun</span>
              </div>
            </div>
          </div>
        </Section>

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* MODAL OVERLAY */}
      {/* ═══════════════════════════════════════ */}
      {showModal && (
        <div style={s.modalBackdrop}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                <i className="bi bi-plus-lg me-2"></i>Yeni Cari Ekle
              </h5>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={s.modalBody}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={s.inputLabel}>Ad Soyad</label>
                  <input style={s.input} type="text" placeholder="Cari adi" />
                </div>
                <div className="col-md-6">
                  <label style={s.inputLabel}>Telefon</label>
                  <input style={s.input} type="tel" placeholder="0532 123 45 67" />
                </div>
                <div className="col-12">
                  <label style={s.inputLabel}>Cari Turu</label>
                  <select style={s.input}>
                    <option>Musteri</option>
                    <option>Tedarikci</option>
                  </select>
                </div>
                <div className="col-12">
                  <label style={s.inputLabel}>Not</label>
                  <textarea style={{ ...s.input, minHeight: 70 }} placeholder="Ek not..."></textarea>
                </div>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setShowModal(false)}>Iptal</button>
              <button style={s.btnPrimary} onClick={() => { setShowModal(false); setAlertMsg({ type: 'success', text: 'Cari basariyla eklendi!' }) }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* SiLME ONAY MODALI */}
      {/* ═══════════════════════════════════════ */}
      {showDeleteModal && (
        <div style={s.modalBackdrop}>
          <div style={{ ...s.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...s.modalHeader, background: '#ef4444' }}>
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>Silme Onayi
              </h5>
              <button style={s.modalClose} onClick={() => setShowDeleteModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ ...s.modalBody, textAlign: 'center', padding: '32px 24px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#fef2f2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <i className="bi bi-trash" style={{ fontSize: 24, color: '#ef4444' }}></i>
              </div>
              <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                Bu kaydi silmek istediginizden emin misiniz?
                <br /><strong style={{ color: '#1e293b' }}>Bu islem geri alinamaz.</strong>
              </p>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setShowDeleteModal(false)}>Iptal</button>
              <button
                style={{ ...s.btnPrimary, background: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.25)' }}
                onClick={() => { setShowDeleteModal(false); setAlertMsg({ type: 'error', text: 'Kayit silindi!' }) }}
              >Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section Wrapper ───
function Section({ title, icon, isDark, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
      }}>
        <i className={`bi ${icon}`} style={{ fontSize: 18, color: '#d4a017' }}></i>
        <h2 style={{
          fontSize: 18, fontWeight: 700, margin: 0,
          color: isDark ? '#ffffff' : '#1e3a5f',
          fontFamily: 'Outfit, sans-serif',
        }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Global CSS (spinner animasyonu) ───
const globalCSS = `
  @keyframes v2spin {
    to { transform: rotate(360deg); }
  }
  .v2-spinner {
    animation: v2spin 0.8s linear infinite;
  }
  @keyframes v2fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes v2slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  /* Tum input/select/textarea box-sizing */
  input, select, textarea { box-sizing: border-box; }
`

// ─── Stil Fonksiyonu ───
function getStyles(isDark) {
  // Ortak degerler
  const textPrimary = isDark ? '#ffffff' : '#1e293b'
  const textSecondary = isDark ? 'rgba(255,255,255,0.65)' : '#475569'
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8'
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'
  const pageBg = isDark ? '#0f1923' : '#f5f6fa'

  return {
    textPrimary,
    textSecondary,
    textMuted,

    page: {
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(160deg, #0f1923 0%, #0b1320 50%, #0f1d2d 100%)'
        : '#f5f6fa',
      fontFamily: 'Outfit, sans-serif',
      backgroundAttachment: isDark ? 'fixed' : undefined,
    },

    topBar: {
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 24px',
      background: isDark ? 'rgba(15,25,35,0.95)' : '#ffffff',
      borderBottom: `1px solid ${border}`,
      backdropFilter: isDark ? 'blur(24px)' : undefined,
      flexWrap: 'wrap',
      gap: 12,
    },

    toggleContainer: {
      display: 'flex',
      gap: 4,
      padding: 4,
      background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
      borderRadius: 10,
    },
    toggleBtn: {
      padding: '8px 16px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      border: 'none',
      cursor: 'pointer',
      background: 'transparent',
      color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
      transition: 'all 0.2s ease',
      fontFamily: 'Outfit, sans-serif',
      minHeight: 38,
    },
    toggleActive: {
      background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff',
      color: isDark ? '#ffffff' : '#1e3a5f',
      fontWeight: 600,
      boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.06)',
    },

    card: {
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 8,
      padding: 20,
      boxShadow: isDark ? 'none' : '0 4px 6px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.06)',
      backdropFilter: isDark ? 'blur(20px)' : undefined,
      WebkitBackdropFilter: isDark ? 'blur(20px)' : undefined,
      transition: 'all 0.2s ease',
    },

    // Butonlar
    btnPrimary: {
      background: isDark ? '#d4a017' : '#1e3a5f',
      color: isDark ? '#0f1923' : '#ffffff',
      border: 'none',
      borderRadius: 8,
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 600,
      minHeight: 44,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Outfit, sans-serif',
      boxShadow: isDark ? '0 4px 16px rgba(212,160,23,0.3)' : '0 2px 8px rgba(30,58,95,0.2)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnGold: {
      background: '#d4a017',
      color: '#1e3a5f',
      border: 'none',
      borderRadius: 8,
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 600,
      minHeight: 44,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Outfit, sans-serif',
      boxShadow: '0 2px 8px rgba(212,160,23,0.25)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnSecondary: {
      background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
      color: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
      border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
      borderRadius: 8,
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 600,
      minHeight: 44,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Outfit, sans-serif',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDanger: {
      background: isDark ? 'rgba(239,68,68,0.1)' : '#ffffff',
      color: '#ef4444',
      border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
      borderRadius: 8,
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 600,
      minHeight: 44,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Outfit, sans-serif',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnGhost: {
      background: 'transparent',
      color: isDark ? 'rgba(255,255,255,0.6)' : '#475569',
      border: 'none',
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 500,
      minHeight: 44,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Outfit, sans-serif',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Tab
    tabContainer: {
      display: 'flex',
      gap: 4,
      padding: 4,
      background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
      borderRadius: 10,
      marginBottom: 16,
      border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
      overflowX: 'auto',
    },
    tab: {
      padding: '10px 18px',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      minHeight: 44,
      transition: 'all 0.2s ease',
      fontFamily: 'Outfit, sans-serif',
      whiteSpace: 'nowrap',
    },
    tabActive: {
      background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
      color: isDark ? '#ffffff' : '#1e3a5f',
      fontWeight: 600,
      boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
    },

    // Input
    inputLabel: {
      display: 'block',
      fontSize: 12,
      fontWeight: 600,
      color: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: 6,
      fontFamily: 'Outfit, sans-serif',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      fontSize: 14,
      color: isDark ? '#ffffff' : '#1e293b',
      background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
      border: `1px solid ${border}`,
      borderRadius: 6,
      minHeight: 44,
      outline: 'none',
      fontFamily: 'Outfit, sans-serif',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
    },

    // Tablo
    tableHeader: {
      display: 'flex',
      padding: '0 18px 10px',
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: textMuted,
    },
    tableRow: {
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 8,
      padding: '14px 18px',
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s ease',
      backdropFilter: isDark ? 'blur(20px)' : undefined,
    },

    // Badge
    badgeGold: {
      background: isDark ? 'rgba(212,160,23,0.15)' : '#fef9e7',
      color: isDark ? '#d4a017' : '#b8860b',
      fontSize: 12,
      fontWeight: 600,
      padding: '4px 10px',
      borderRadius: 6,
      display: 'inline-block',
    },
    badgeType: {
      background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
      color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b',
      fontSize: 12,
      fontWeight: 500,
      padding: '3px 10px',
      borderRadius: 6,
      display: 'inline-block',
    },
    badgeStatus: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      fontWeight: 500,
      color: isDark ? 'rgba(255,255,255,0.6)' : '#475569',
    },

    // Alert
    alert: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '14px 18px',
      borderRadius: 8,
      fontSize: 14,
      borderLeft: '4px solid',
    },
    alertSuccess: isDark
      ? { background: 'rgba(255,255,255,0.04)', borderLeftColor: '#10b981', color: '#10b981', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '4px solid #10b981' }
      : { background: '#ecfdf5', borderLeftColor: '#10b981', color: '#065f46' },
    alertError: isDark
      ? { background: 'rgba(255,255,255,0.04)', borderLeftColor: '#ef4444', color: '#ef4444', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '4px solid #ef4444' }
      : { background: '#fef2f2', borderLeftColor: '#ef4444', color: '#991b1b' },
    alertWarning: isDark
      ? { background: 'rgba(255,255,255,0.04)', borderLeftColor: '#f59e0b', color: '#f59e0b', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '4px solid #f59e0b' }
      : { background: '#fffbeb', borderLeftColor: '#f59e0b', color: '#92400e' },
    alertInfo: isDark
      ? { background: 'rgba(255,255,255,0.04)', borderLeftColor: '#3b82f6', color: '#3b82f6', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '4px solid #3b82f6' }
      : { background: '#eff6ff', borderLeftColor: '#3b82f6', color: '#1e40af' },

    // Modal
    modalBackdrop: {
      position: 'fixed',
      inset: 0,
      background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'v2fadeIn 0.2s ease',
      backdropFilter: isDark ? 'blur(8px)' : undefined,
    },
    modal: {
      background: isDark ? 'rgba(15,25,35,0.95)' : '#ffffff',
      borderRadius: 10,
      maxWidth: 520,
      width: '90%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
      animation: 'v2slideUp 0.25s ease',
      overflow: 'hidden',
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
      backdropFilter: isDark ? 'blur(30px)' : undefined,
    },
    modalHeader: {
      background: '#1e3a5f',
      color: '#ffffff',
      padding: '18px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalClose: {
      background: 'rgba(255,255,255,0.15)',
      border: 'none',
      color: '#ffffff',
      width: 32,
      height: 32,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: 14,
    },
    modalBody: {
      padding: 24,
      overflowY: 'auto',
      flex: 1,
    },
    modalFooter: {
      padding: '16px 24px',
      borderTop: `1px solid ${border}`,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
    },
  }
}
