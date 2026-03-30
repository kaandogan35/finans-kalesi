/**
 * GelirGiderSayfasi.jsx — v2 (ParamGo Tasarım Sistemi)
 *
 * Gelirler: islemTipi='giris' — ödeme kaynağı kategoriye göre otomatik
 * Giderler: islemTipi='cikis' — ödeme kaynağı kullanıcı seçer
 * Kategoriler backend'den çekilir (kategoriler tablosu)
 * Kasa hareketlerine otomatik yansır
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import { useNavigate } from 'react-router-dom'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri, hexRgba } from '../../lib/temaRenkleri'
import useAuthStore from '../../stores/authStore'
import SwipeCard from '../../components/SwipeCard'
import { hareketleriGetir, hareketEkle, hareketSil } from '../../api/kasa'
import { kategorileriGetir } from '../../api/kategori'
import { DateInput } from '../../components/ui/DateInput'

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0)
const tarihFmt = (s) => (s ? new Date(s).toLocaleDateString('tr-TR') : '—')
const bugunTarih = () => new Date().toISOString().split('T')[0]
const formatParaInput = (value) => {
  let v = value.replace(/[^0-9,]/g, '')
  const parts = v.split(',')
  if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = v.split(',')
  const formatted = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? formatted + ',' + kesir.slice(0, 2) : formatted
}
const parseParaInput = (f) => parseFloat(String(f).replace(/\./g, '').replace(',', '.')) || 0
const AY_ADLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

// ─── Ödeme Kaynağı Eşleştirmesi ──────────────────────────────────────────────
const ODEME_KAYNAKLARI = [
  { key: 'banka',       label: 'Banka / Havale',  ikon: 'bi-bank'       },
  { key: 'merkez_kasa', label: 'Merkez Kasa',     ikon: 'bi-safe2'      },
]

// ─── Gelir: Kategoriye göre otomatik ödeme kaynağı ───────────────────────────
const GIRIS_KATEGORI_KAYNAK = {
  'Nakit Satış': { odeme: 'merkez_kasa', baglanti: 'Merkez Kasa', altSecim: false },
  'Açık Hesap Tahsilat': {
    odeme: 'banka', baglanti: 'Banka / Havale', altSecim: true,
    secenekler: [
      { key: 'pos',    label: 'POS\'tan Çekildi',   ikon: 'bi-credit-card', odeme: 'banka',       baglanti: 'Banka / POS' },
      { key: 'havale', label: 'Havale / EFT Geldi',  ikon: 'bi-bank',       odeme: 'banka',       baglanti: 'Banka / Havale' },
      { key: 'nakit',  label: 'Nakit Ödendi',        ikon: 'bi-cash-stack', odeme: 'merkez_kasa', baglanti: 'Merkez Kasa' },
    ],
  },
  'Havale / EFT':             { odeme: 'banka', baglanti: 'Banka / Havale',  altSecim: false },
  'POS / Kredi Kartı':        { odeme: 'banka', baglanti: 'Banka / POS',     altSecim: false },
  'Diğer Gelir':              { odeme: 'banka', baglanti: 'Banka / Havale',  altSecim: false },
  'Hizmet / İşçilik Bedeli': {
    odeme: 'banka', baglanti: 'Banka / Havale', altSecim: true,
    secenekler: [
      { key: 'banka', label: 'Havale / EFT', ikon: 'bi-bank',        odeme: 'banka',       baglanti: 'Banka / Havale' },
      { key: 'pos',   label: 'POS / Kart',   ikon: 'bi-credit-card', odeme: 'banka',       baglanti: 'Banka / POS' },
      { key: 'nakit', label: 'Nakit Ödendi', ikon: 'bi-cash-stack',  odeme: 'merkez_kasa', baglanti: 'Merkez Kasa' },
    ],
  },
  'Kira Tahsilatı':              { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Taksit / Vade Tahsilatı':     { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Komisyon / Aracılık Geliri':  { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Kaparo / Avans Alındı': {
    odeme: 'banka', baglanti: 'Banka / Havale', altSecim: true,
    secenekler: [
      { key: 'banka', label: 'Havale / EFT', ikon: 'bi-bank',        odeme: 'banka',       baglanti: 'Banka / Havale' },
      { key: 'pos',   label: 'POS / Kart',   ikon: 'bi-credit-card', odeme: 'banka',       baglanti: 'Banka / POS' },
      { key: 'nakit', label: 'Nakit Alındı', ikon: 'bi-cash-stack',  odeme: 'merkez_kasa', baglanti: 'Merkez Kasa' },
    ],
  },
  'İhracat / Döviz Tahsilatı':   { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Faiz / Repo Geliri':          { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'İade / Geri Ödeme Alındı':    { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Sübvansiyon / Devlet Desteği':{ odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
}

const GIRIS_GIZLE = ['Çek/Senet Tahsilatı', 'Düzenli Tahsilat', 'Çekmece Kapanış', 'Nakit Satış (Çekmece)']
const GIRIS_CORE  = ['Nakit Satış', 'Açık Hesap Tahsilat', 'Havale / EFT', 'POS / Kredi Kartı', 'Diğer Gelir']

// ─── Gider: Kategori ve ödeme kaynağı yapılandırması ─────────────────────────
const CIKIS_GIZLE = ['Çek/Senet Ödemesi', 'Çekmece Kapanış', 'Nakit Satış (Çekmece)']
const CIKIS_CORE  = ['Tedarikçi Ödemesi', 'Günlük İşletme Gideri', 'Personel Maaşı']

// ─── Esnaf Dili: Ekranda gösterilecek kategori adları ────────────────────────
// DB'deki teknik isimler değişmez, sadece arayüzde esnaf diline çevrilir
const GIRIS_GORUNUM_ADI = {
  'Açık Hesap Tahsilat':          'Nakit Giriş',
  'Hizmet / İşçilik Bedeli':      'Hizmet / İş Bedeli',
  'Taksit / Vade Tahsilatı':      'Taksitli Tahsilat',
  'Komisyon / Aracılık Geliri':   'Komisyon Geliri',
  'Kaparo / Avans Alındı':        'Kaparo / Avans',
  'Sübvansiyon / Devlet Desteği': 'Devlet Desteği',
  'Faiz / Repo Geliri':           'Faiz Geliri',
}

const CIKIS_GORUNUM_ADI = {
  'Kredi / Taksit Ödemesi': 'Kredi Kartı Ödemesi',
  'Tedarikçi Ödemesi':      'Mal / Malzeme Alımı',
  'Günlük İşletme Gideri':  'Günlük Masraf',
  'Personel SGK / Prim':    'SGK & Sigorta',
  'Faturalar':              'Elektrik / Su / Fatura',
  'Personel Yemek':         'Personel Yemek & Yol',
}

const _STD3 = [
  { key: 'banka',       label: 'Banka / Havale', ikon: 'bi-bank',       odeme: 'banka',       baglanti: 'Banka / Havale' },
  { key: 'merkez_kasa', label: 'Merkez Kasa',    ikon: 'bi-safe2',      odeme: 'merkez_kasa', baglanti: 'Merkez Kasa' },
]

const CIKIS_KATEGORI_KAYNAK = {
  'Tedarikçi Ödemesi': {
    altSecim: true,
    secenekler: [
      { key: 'banka',       label: 'Banka Havalesi', ikon: 'bi-bank',       odeme: 'banka',       baglanti: 'Banka / Havale' },
      { key: 'merkez_kasa', label: 'Merkez Kasa',    ikon: 'bi-safe2',      odeme: 'merkez_kasa', baglanti: 'Merkez Kasa' },
      { key: 'mail_order',  label: 'Mail Order',     ikon: 'bi-envelope',   odeme: 'banka',       baglanti: 'Mail Order' },
    ],
  },
  'Günlük İşletme Gideri': { altSecim: true, secenekler: _STD3 },
  'Personel Maaşı': {
    altSecim: true,
    secenekler: [
      { key: 'banka',       label: 'Banka EFT',    ikon: 'bi-bank',  odeme: 'banka',       baglanti: 'Banka / Havale' },
      { key: 'merkez_kasa', label: 'Elden / Kasa', ikon: 'bi-safe2', odeme: 'merkez_kasa', baglanti: 'Merkez Kasa' },
    ],
  },
  'Personel SGK / Prim': { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Personel Yemek': {
    altSecim: true,
    secenekler: [
      { key: 'banka',       label: 'Banka',      ikon: 'bi-bank',  odeme: 'banka',       baglanti: 'Banka / Havale' },
      { key: 'merkez_kasa', label: 'Nakit / Elden', ikon: 'bi-safe2', odeme: 'merkez_kasa', baglanti: 'Merkez Kasa' },
    ],
  },
  'Faturalar':              { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Kira / Aidat': {
    altSecim: true,
    secenekler: [
      { key: 'banka',       label: 'Banka Havalesi', ikon: 'bi-bank',  odeme: 'banka',       baglanti: 'Banka / Havale' },
      { key: 'merkez_kasa', label: 'Nakit Elden',    ikon: 'bi-safe2', odeme: 'merkez_kasa', baglanti: 'Merkez Kasa' },
    ],
  },
  'Vergi Ödemesi':          { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Kredi / Taksit Ödemesi': { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Nakliye / Kargo':        { altSecim: true, secenekler: _STD3 },
  'Sigorta':                { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Reklam / Pazarlama':     { odeme: 'banka', baglanti: 'Banka / Havale', altSecim: false },
  'Diğer Gider':            { altSecim: true, secenekler: _STD3 },
}

// ─── Kaynak Modül Rozeti ──────────────────────────────────────────────────────
// ─── Kategori Renk Paleti ──────────────────────────────────────────────────
// Birbirinden belirgin ayrışan renkler — yeşil, mavi, mor, sarı, cyan vb.
const GRAFIK_RENKLER_GIRIS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#6366F1', // indigo
  '#84CC16', // lime
  '#14B8A6', // teal
  '#F97316', // orange
]
// Kırmızı ağırlıklı, diğer renklerle zenginleştirilmiş
const GRAFIK_RENKLER_CIKIS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#3B82F6', // blue
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#10B981', // emerald
  '#6366F1', // indigo
  '#DC2626', // red-dark
]

function KategoriGrafik({ dagilim, toplam, isGiris, ay, yil, p, renkler, onKategoriTikla }) {
  const paletRenkler = isGiris ? GRAFIK_RENKLER_GIRIS : GRAFIK_RENKLER_CIKIS

  // Doughnut verisi
  const doughnutData = useMemo(() => ({
    labels: dagilim.map(d => d.ad),
    datasets: [{
      data: dagilim.map(d => d.tutar),
      backgroundColor: dagilim.map((_, i) => paletRenkler[i % paletRenkler.length]),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverBorderWidth: 3,
      hoverOffset: 6,
    }],
  }), [dagilim, paletRenkler])

  const doughnutOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.92)',
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw || 0
            const pct = toplam > 0 ? Math.round((val / toplam) * 100) : 0
            return ` ${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(val)} ₺ (${pct}%)`
          },
        },
      },
    },
  }), [toplam])

  // Bar verisi
  const barData = useMemo(() => ({
    labels: dagilim.map(d => d.ad.length > 14 ? d.ad.slice(0, 14) + '…' : d.ad),
    datasets: [{
      data: dagilim.map(d => d.tutar),
      backgroundColor: dagilim.map((_, i) => paletRenkler[i % paletRenkler.length] + 'CC'),
      borderRadius: 4,
      borderSkipped: false,
      maxBarThickness: 36,
    }],
  }), [dagilim, paletRenkler])

  const barOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.92)',
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw || 0
            return ` ${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(val)} ₺`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, callback: (v) => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v },
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 11, weight: 500 }, color: '#6B7280' },
      },
    },
  }), [])

  return (
    <div className="row g-3 mb-4">
      {/* Sol — Halka Grafik */}
      <div className="col-12 col-lg-5">
        <div className={`${p}-panel`}>
          <div className={`${p}-panel-header`}>
            <div className={`${p}-panel-title`}>
              <i className="bi bi-pie-chart-fill" />
              Kategori Dağılımı
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-muted)' }}>
              {ay} {yil}
            </span>
          </div>
          <div className={`${p}-panel-body-padded`}>
            <div style={{ position: 'relative', height: 220, margin: '0 auto', maxWidth: 220 }}>
              <Doughnut data={doughnutData} options={doughnutOpts} />
              {/* Ortadaki toplam */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                textAlign: 'center', pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--p-text-muted)' }}>
                  Toplam
                </div>
                <div className="financial-num" style={{
                  fontSize: toplam >= 100000 ? 11 : toplam >= 10000 ? 13 : 15,
                  fontWeight: 700, color: 'var(--p-text)', lineHeight: 1.3,
                  maxWidth: 90, wordBreak: 'break-all', textAlign: 'center',
                }}>
                  {new Intl.NumberFormat('tr-TR', {
                    minimumFractionDigits: toplam >= 1000 ? 0 : 2,
                    maximumFractionDigits: toplam >= 1000 ? 0 : 2,
                  }).format(toplam)} ₺
                </div>
              </div>
            </div>

            {/* Kategori listesi (mini legend — tıklanabilir) */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dagilim.slice(0, 6).map((d, i) => (
                <button
                  key={d.ad}
                  type="button"
                  onClick={() => onKategoriTikla?.(d.ad)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '6px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'transparent', width: '100%', textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--p-bg-page)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                      background: paletRenkler[i % paletRenkler.length],
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--p-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.ad}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span className="financial-num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)' }}>
                      {TL(d.tutar)} ₺
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                      background: isGiris ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: isGiris ? '#059669' : '#DC2626',
                    }}>
                      %{d.yuzde}
                    </span>
                    <i className="bi bi-chevron-right" style={{ fontSize: 12, color: 'var(--p-text-muted)' }} />
                  </div>
                </button>
              ))}
              {dagilim.length > 6 && (
                <p style={{ fontSize: 11, color: 'var(--p-text-muted)', margin: '4px 0 0', textAlign: 'center' }}>
                  +{dagilim.length - 6} kategori daha
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sağ — Yatay Bar Grafik */}
      <div className="col-12 col-lg-7">
        <div className={`${p}-panel`}>
          <div className={`${p}-panel-header`}>
            <div className={`${p}-panel-title`}>
              <i className="bi bi-bar-chart-fill" />
              Kategori Karşılaştırma
            </div>
          </div>
          <div className={`${p}-panel-body-padded`}>
            <div style={{ height: Math.max(220, dagilim.length * 38) }}>
              <Bar data={barData} options={barOpts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KaynakRozeti({ kaynak, p }) {
  if (!kaynak || kaynak === 'manuel' || kaynak === '') {
    return (
      <span className={`${p}-kasa-badge ${p}-kasa-badge-accent`}>
        <i className="bi bi-pencil-fill" style={{ fontSize: 12 }} /> Manuel
      </span>
    )
  }
  if (kaynak === 'cek_senet') {
    return (
      <span className={`${p}-badge ${p}-badge-warning`}>
        <i className="bi bi-lightning-fill" style={{ fontSize: 12 }} /> Çek/Senet
      </span>
    )
  }
  if (kaynak === 'tekrarlayan') {
    return (
      <span className={`${p}-badge-repeat`}>
        <i className="bi bi-arrow-repeat" style={{ fontSize: 12 }} /> Tekrarlayan
      </span>
    )
  }
  return <span style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>{kaynak}</span>
}

// ─── Ödeme Kaynağı Gösterimi ──────────────────────────────────────────────────
function OdemeKaynakGoster({ kaynak, baglanti }) {
  const bulunan = ODEME_KAYNAKLARI.find(o => o.key === kaynak)
  if (bulunan) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--p-text-secondary)' }}>
        <i className={`bi ${bulunan.ikon}`} style={{ fontSize: 11 }} />
        {bulunan.label}
      </span>
    )
  }
  if (baglanti) {
    const ikon = baglanti.includes('POS') ? 'bi-credit-card'
               : baglanti.includes('Banka') || baglanti.includes('Havale') ? 'bi-bank'
               : baglanti.includes('Merkez') ? 'bi-safe2'
               : baglanti.includes('Çekmece') ? 'bi-cash-stack'
               : 'bi-wallet2'
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--p-text-secondary)' }}>
        <i className={`bi ${ikon}`} style={{ fontSize: 11 }} />
        {baglanti}
      </span>
    )
  }
  return <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>—</span>
}

// ─── Kategori Kartı Butonu ────────────────────────────────────────────────────
function KatKarti({ kat, secili, onClick, accentColor, gorunumAd }) {
  const r = parseInt(accentColor.slice(1, 3), 16)
  const g = parseInt(accentColor.slice(3, 5), 16)
  const b = parseInt(accentColor.slice(5, 7), 16)
  return (
    <div className="col-6 col-sm-3">
      <button
        type="button"
        onClick={() => onClick(kat)}
        className="p-kat-karti"
        data-secili={secili ? 'true' : 'false'}
        style={{
          '--kat-accent':    accentColor,
          '--kat-accent-08': `rgba(${r},${g},${b},0.08)`,
          '--kat-accent-18': `rgba(${r},${g},${b},0.18)`,
        }}
      >
        {secili && (
          <span className="p-kat-check" aria-hidden="true">
            <i className="bi bi-check-lg" />
          </span>
        )}
        <i className={`bi ${kat.ikon || 'bi-tag'} p-kat-ikon`} aria-hidden="true" />
        <span className="p-kat-label">{gorunumAd ?? kat.ad}</span>
      </button>
    </div>
  )
}

// ─── Ödeme Yöntemi Butonu ─────────────────────────────────────────────────────
function OdemeBtn({ secenek, aktif, onClick, accentColor }) {
  return (
    <div className="col-6 col-sm-3">
      <button
        type="button"
        onClick={() => onClick(secenek.key)}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '12px 8px',
          borderRadius: 10,
          border: aktif ? `2px solid ${accentColor}` : '1.5px solid var(--p-border)',
          background: aktif ? hexRgba(accentColor, 0.06) : 'var(--p-bg-card)',
          cursor: 'pointer',
          transition: 'all var(--p-transition)',
          minHeight: 72,
        }}
      >
        <i className={`bi ${secenek.ikon}`} style={{ fontSize: 20, color: aktif ? accentColor : 'var(--p-text-muted)' }} />
        <span style={{ fontSize: 11, fontWeight: aktif ? 700 : 500, color: aktif ? accentColor : 'var(--p-text)', textAlign: 'center', lineHeight: 1.3 }}>
          {secenek.label}
        </span>
      </button>
    </div>
  )
}

// ─── Adım Başlığı ─────────────────────────────────────────────────────────────
function AdimBaslik({ numara, baslik }) {
  return (
    <div className="p-adim-baslik">
      <span className="p-adim-numara" aria-hidden="true">{numara}</span>
      <span className="p-adim-metin">{baslik}</span>
    </div>
  )
}

// ─── Nereye / Nereden Bilgi Bandı ─────────────────────────────────────────────
function KaynakBilgiBandi({ ikon, metin, renk }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 10, marginBottom: 16,
      background: hexRgba(renk, 0.07),
      border: `1px solid ${hexRgba(renk, 0.20)}`,
    }}>
      <i className={`bi ${ikon}`} style={{ fontSize: 15, color: renk, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: renk }}>{metin}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GELİR EKLEME MODALI
// ═══════════════════════════════════════════════════════════════════════════════
function GelirEkleModal({ open, onClose, kategoriler, onKaydet, p, renkler }) {
  const [seciliKat, setSeciliKat] = useState(null)
  const [altSecim, setAltSecim]   = useState(null)
  const [tarih, setTarih]         = useState(bugunTarih())
  const [tutar, setTutar]         = useState('')
  const [aciklama, setAciklama]   = useState('')
  const [kaydediyor, setKaydediyor] = useState(false)

  useEffect(() => {
    if (open) {
      setSeciliKat(null); setAltSecim(null)
      setTarih(bugunTarih()); setTutar(''); setAciklama('')
      setKaydediyor(false)
    }
  }, [open])

  useEffect(() => { setAltSecim(null) }, [seciliKat])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Klavye açıldığında aktif input'u görünür alana kaydır
  useEffect(() => {
    if (!open) return
    const scrollToFocused = () => {
      setTimeout(() => {
        const el = document.activeElement
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
    window.addEventListener('resize', scrollToFocused)
    return () => window.removeEventListener('resize', scrollToFocused)
  }, [open])

  if (!open) return null

  const gorunurKategoriler = kategoriler.filter(k => !GIRIS_GIZLE.includes(k.ad))
  const coreKats  = GIRIS_CORE.map(ad => gorunurKategoriler.find(k => k.ad === ad)).filter(Boolean)
  const extraKats = gorunurKategoriler.filter(k => !GIRIS_CORE.includes(k.ad))

  const katKaynak         = seciliKat ? GIRIS_KATEGORI_KAYNAK[seciliKat.ad] : null
  const altSecimGerekli   = katKaynak?.altSecim === true
  const altSecimYapildi   = !altSecimGerekli || altSecim !== null

  const getKaynakBilgi = () => {
    if (!katKaynak) return null
    if (altSecimGerekli && altSecim) {
      const sec = katKaynak.secenekler.find(s => s.key === altSecim)
      return sec ? { odeme: sec.odeme, baglanti: sec.baglanti } : null
    }
    if (!altSecimGerekli) return { odeme: katKaynak.odeme, baglanti: katKaynak.baglanti }
    return null
  }
  const kaynakBilgi = getKaynakBilgi()

  const nereyeInfo = () => {
    if (!kaynakBilgi) return null
    if (kaynakBilgi.odeme === 'merkez_kasa')
      return { ikon: 'bi-safe2', metin: 'Merkez Kasa bakiyesine eklenecek', renk: renkler.success }
    if (kaynakBilgi.baglanti?.includes('POS'))
      return { ikon: 'bi-credit-card', metin: 'Banka bakiyesine eklenecek (POS)', renk: renkler.success }
    return { ikon: 'bi-bank', metin: 'Banka bakiyesine eklenecek', renk: renkler.success }
  }

  const kaydet = async () => {
    if (!seciliKat) { toast.error('Gelir türünü seçiniz'); return }
    if (!altSecimYapildi) { toast.error('Tahsilat yöntemini seçiniz'); return }
    const tutarSayi = parseParaInput(tutar)
    if (tutarSayi <= 0) { toast.error('Geçerli bir tutar giriniz'); return }
    if (!kaynakBilgi) return
    setKaydediyor(true)
    try {
      await onKaydet({
        islem_tipi: 'giris',
        kategori: seciliKat.ad,
        tutar: tutarSayi,
        aciklama: aciklama || '',
        tarih,
        baglanti_turu: kaynakBilgi.baglanti,
        kaynak_modul: 'manuel',
        odeme_kaynagi: kaynakBilgi.odeme,
      })
      onClose()
    } catch { /* hata toast onKaydet içinde */
    } finally { setKaydediyor(false) }
  }

  const hazirMi = seciliKat && altSecimYapildi && parseParaInput(tutar) > 0
  const bilgi   = nereyeInfo()
  let adim = 2
  const adimTahsilat = altSecimGerekli ? adim++ : null
  const adimDetaylar = adim

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} onClick={onClose} />
      <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
        <div className={`${p}-modal-box`} style={{ maxWidth: 640 }}>

      {/* Üst Bar */}
      <div className={`${p}-modal-header ${p}-mh-default`} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={`${p}-modal-icon ${p}-modal-icon-green`}>
            <i className="bi bi-arrow-down-circle-fill" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--p-text)' }}>Yeni Gelir Ekle</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--p-text-muted)' }}>Tahsilat kasaya otomatik yansır</p>
          </div>
        </div>
        <button
          className={`${p}-modal-close`}
          onClick={onClose}
          aria-label="Kapat"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* İçerik — Kaydırılabilir */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Adım 1 — Gelir Türü */}
          <AdimBaslik numara={1} baslik="Kasaya ne girdi?" />
          <div className={`row g-2 mb-2${seciliKat ? ' p-kat-grid--secimli' : ''}`}>
            {coreKats.map(kat => (
              <KatKarti
                key={kat.id} kat={kat}
                secili={seciliKat?.id === kat.id}
                onClick={setSeciliKat}
                accentColor={renkler.success}
                gorunumAd={GIRIS_GORUNUM_ADI[kat.ad]}
              />
            ))}
          </div>

          {extraKats.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--p-border)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-muted)', whiteSpace: 'nowrap' }}>
                  Diğer Gelir Türleri
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--p-border)' }} />
              </div>
              <div className={`row g-2 mb-2${seciliKat ? ' p-kat-grid--secimli' : ''}`}>
                {extraKats.map(kat => (
                  <KatKarti
                    key={kat.id} kat={kat}
                    secili={seciliKat?.id === kat.id}
                    onClick={setSeciliKat}
                    accentColor={renkler.success}
                    gorunumAd={GIRIS_GORUNUM_ADI[kat.ad]}
                  />
                ))}
              </div>
            </>
          )}

          {/* Adım 2 — Tahsilat Yöntemi (varsa) */}
          {altSecimGerekli && (
            <div className="mt-3 mb-2">
              <AdimBaslik numara={adimTahsilat} baslik="Tahsilat Nasıl Yapıldı?" />
              <div className="row g-2">
                {katKaynak.secenekler.map(sec => (
                  <OdemeBtn
                    key={sec.key} secenek={sec}
                    aktif={altSecim === sec.key}
                    onClick={setAltSecim}
                    accentColor={renkler.success}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Nereye giriyor */}
          {bilgi && (
            <div className="mt-3">
              <KaynakBilgiBandi ikon={bilgi.ikon} metin={bilgi.metin} renk={bilgi.renk} />
            </div>
          )}

          {/* Adım — Tutar + Tarih */}
          <div className="mt-3">
            <AdimBaslik numara={adimDetaylar} baslik="Tutar ve Tarih" />
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-7">
                <label className={`${p}-kasa-input-label`}>Tutar (₺)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tutar}
                  onChange={e => setTutar(formatParaInput(e.target.value))}
                  placeholder="0,00"
                  className={`${p}-kasa-input p-tutar-input`}
                  style={{ color: renkler.success, borderRadius: 10 }}
                />
              </div>
              <div className="col-12 col-sm-5">
                <label className={`${p}-kasa-input-label`}>Tarih</label>
                <DateInput value={tarih} onChange={val => setTarih(val)} placeholder="Tarih seçin" />
              </div>
            </div>

            <div>
              <label className={`${p}-kasa-input-label`}>Açıklama (opsiyonel)</label>
              <input
                type="text"
                value={aciklama}
                onChange={e => setAciklama(e.target.value)}
                placeholder="Örn: Müşteri adı, fatura no"
                className={`${p}-kasa-input`}
                style={{ borderRadius: 10 }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Alt Bar — Sabit */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
        padding: '16px 24px',
        background: 'var(--p-bg-card)',
        borderTop: '1px solid var(--p-border)',
        flexShrink: 0,
      }}>
        <button className={`${p}-btn-cancel`} onClick={onClose} disabled={kaydediyor}>
          İptal
        </button>
        <button
          className={`${p}-btn-save ${p}-btn-save-default${kaydediyor ? ' p-btn-loading' : ''}`}
          onClick={kaydet}
          disabled={kaydediyor || !hazirMi}
        >
          {kaydediyor
            ? <><span className="p-btn-spinner" />Kaydediliyor...</>
            : <><i className="bi bi-shield-lock-fill me-2" />Kaydet & Şifrele</>}
        </button>
      </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GİDER EKLEME MODALI
// ═══════════════════════════════════════════════════════════════════════════════
function GiderEkleModal({ open, onClose, kategoriler, onKaydet, p, renkler }) {
  const [seciliKat, setSeciliKat]     = useState(null)
  const [altSecim, setAltSecim]       = useState(null)
  const [detaySecim, setDetaySecim]   = useState(null)
  const [tarih, setTarih]             = useState(bugunTarih())
  const [tutar, setTutar]             = useState('')
  const [aciklama, setAciklama]       = useState('')
  const [kaydediyor, setKaydediyor]   = useState(false)

  useEffect(() => {
    if (open) {
      setSeciliKat(null); setAltSecim(null); setDetaySecim(null)
      setTarih(bugunTarih()); setTutar(''); setAciklama('')
      setKaydediyor(false)
    }
  }, [open])

  useEffect(() => { setAltSecim(null); setDetaySecim(null) }, [seciliKat])
  useEffect(() => { setDetaySecim(null) }, [altSecim])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Klavye açıldığında aktif input'u görünür alana kaydır
  useEffect(() => {
    if (!open) return
    const scrollToFocused = () => {
      setTimeout(() => {
        const el = document.activeElement
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
    window.addEventListener('resize', scrollToFocused)
    return () => window.removeEventListener('resize', scrollToFocused)
  }, [open])

  if (!open) return null

  const tumGorunur    = kategoriler.filter(k => !CIKIS_GIZLE.includes(k.ad))
  const coreKatlar    = CIKIS_CORE.map(ad => tumGorunur.find(k => k.ad === ad)).filter(Boolean)
  const extraKatlar   = tumGorunur.filter(k => !CIKIS_CORE.includes(k.ad))

  const katKaynak            = seciliKat ? CIKIS_KATEGORI_KAYNAK[seciliKat.ad] : null
  const altSecimGerekli      = katKaynak?.altSecim === true
  const seciliAltSecenek     = altSecimGerekli && altSecim ? katKaynak.secenekler.find(s => s.key === altSecim) : null
  const detaySecimGerekli    = seciliAltSecenek?.detaySecim === true
  const detaySecimYapildi    = !detaySecimGerekli || detaySecim !== null
  const altSecimYapildi      = !altSecimGerekli || (altSecim !== null && detaySecimYapildi)

  const getKaynakBilgi = () => {
    if (!katKaynak) return null
    if (!altSecimGerekli) return { odeme: katKaynak.odeme, baglanti: katKaynak.baglanti }
    if (!seciliAltSecenek) return null
    if (detaySecimGerekli) {
      if (!detaySecim) return null
      const detay = seciliAltSecenek.detaylar.find(d => d.key === detaySecim)
      return detay ? { odeme: seciliAltSecenek.odeme, baglanti: detay.baglanti } : null
    }
    return { odeme: seciliAltSecenek.odeme, baglanti: seciliAltSecenek.baglanti }
  }
  const kaynakBilgi = getKaynakBilgi()

  const neredenInfo = () => {
    if (!kaynakBilgi) return null
    if (kaynakBilgi.odeme === 'merkez_kasa')
      return { ikon: 'bi-safe2', metin: 'Merkez Kasa bakiyesinden düşecek', renk: renkler.danger }
    return { ikon: 'bi-bank', metin: 'Banka bakiyesinden düşecek', renk: renkler.danger }
  }

  const kaydet = async () => {
    if (!seciliKat) { toast.error('Gider türünü seçiniz'); return }
    if (!altSecimYapildi) { toast.error('Ödeme yöntemini seçiniz'); return }
    const tutarSayi = parseParaInput(tutar)
    if (tutarSayi <= 0) { toast.error('Geçerli bir tutar giriniz'); return }
    if (!kaynakBilgi) return
    setKaydediyor(true)
    try {
      await onKaydet({
        islem_tipi: 'cikis',
        kategori: seciliKat.ad,
        tutar: tutarSayi,
        aciklama: aciklama || '',
        tarih,
        baglanti_turu: kaynakBilgi.baglanti,
        kaynak_modul: 'manuel',
        odeme_kaynagi: kaynakBilgi.odeme,
      })
      onClose()
    } catch { /* hata toast onKaydet içinde */
    } finally { setKaydediyor(false) }
  }

  const hazirMi = seciliKat && altSecimYapildi && parseParaInput(tutar) > 0
  const bilgi   = neredenInfo()
  let adim = 2
  const adimNereden = altSecimGerekli   ? adim++ : null
  const adimDetay   = detaySecimGerekli ? adim++ : null
  const adimDetaylar = adim

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
        <div className={`${p}-modal-box`} style={{ maxWidth: 560 }}>

          {/* Başlık */}
          <div className={`${p}-modal-header ${p}-mh-default`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`${p}-modal-icon ${p}-modal-icon-red`}>
                <i className="bi bi-arrow-up-circle-fill" />
              </div>
              <div>
                <h2 className={`${p}-modal-title`}>Yeni Gider Ekle</h2>
                <p className={`${p}-modal-sub`}>Ödeme kasadan otomatik düşer</p>
              </div>
            </div>
            <button className={`${p}-modal-close`} onClick={onClose} aria-label="Kapat">
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Gövde */}
          <div className={`${p}-modal-body`}>

            {/* Adım 1 — Gider Türü */}
            <AdimBaslik numara={1} baslik="Ne için ödeme yaptınız?" />
            <div className={`row g-2 mb-2${seciliKat ? ' p-kat-grid--secimli' : ''}`}>
              {coreKatlar.map(kat => (
                <KatKarti
                  key={kat.id} kat={kat}
                  secili={seciliKat?.id === kat.id}
                  onClick={setSeciliKat}
                  accentColor={renkler.danger}
                  gorunumAd={CIKIS_GORUNUM_ADI[kat.ad]}
                />
              ))}
            </div>

            {extraKatlar.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--p-border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-muted)', whiteSpace: 'nowrap' }}>
                    Diğer Gider Türleri
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--p-border)' }} />
                </div>
                <div className={`row g-2 mb-2${seciliKat ? ' p-kat-grid--secimli' : ''}`}>
                  {extraKatlar.map(kat => (
                    <KatKarti
                      key={kat.id} kat={kat}
                      secili={seciliKat?.id === kat.id}
                      onClick={setSeciliKat}
                      accentColor={renkler.danger}
                      gorunumAd={CIKIS_GORUNUM_ADI[kat.ad]}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Adım 2 — Ödeme Kaynağı */}
            {altSecimGerekli && (
              <div className="mt-3 mb-2">
                <AdimBaslik numara={adimNereden} baslik="Nereden Ödendi?" />
                <div className="row g-2">
                  {katKaynak.secenekler.map(sec => (
                    <OdemeBtn
                      key={sec.key} secenek={sec}
                      aktif={altSecim === sec.key}
                      onClick={setAltSecim}
                      accentColor={renkler.danger}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Adım 3 — Mail Order Detay (opsiyonel) */}
            {detaySecimGerekli && (
              <div className="mt-3 mb-2">
                <AdimBaslik numara={adimDetay} baslik="Hesap Türü" />
                <div className="row g-2">
                  {seciliAltSecenek.detaylar.map(det => {
                    const aktif = detaySecim === det.key
                    return (
                      <div key={det.key} className="col-6">
                        <button
                          type="button"
                          onClick={() => setDetaySecim(det.key)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 14px', borderRadius: 10, minHeight: 52,
                            border: aktif ? `2px solid ${renkler.danger}` : '1.5px solid var(--p-border)',
                            background: aktif ? hexRgba(renkler.danger, 0.06) : 'var(--p-bg-card)',
                            cursor: 'pointer', transition: 'all var(--p-transition)',
                          }}
                        >
                          <i className={`bi ${det.ikon}`}
                            style={{ fontSize: 17, color: aktif ? renkler.danger : 'var(--p-text-muted)' }} />
                          <span style={{ fontSize: 12, fontWeight: aktif ? 700 : 500, color: aktif ? renkler.danger : 'var(--p-text)' }}>
                            {det.label}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Nereden düşecek */}
            {bilgi && (
              <div className="mt-3">
                <KaynakBilgiBandi ikon={bilgi.ikon} metin={bilgi.metin} renk={bilgi.renk} />
              </div>
            )}

            {/* Tutar + Tarih */}
            <div className="mt-3">
              <AdimBaslik numara={adimDetaylar} baslik="Tutar ve Tarih" />
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-7">
                  <label className={`${p}-kasa-input-label`}>Tutar (₺)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tutar}
                    onChange={e => setTutar(formatParaInput(e.target.value))}
                    placeholder="0,00"
                    className={`${p}-kasa-input p-tutar-input`}
                    style={{ color: renkler.danger, borderRadius: 10 }}
                  />
                </div>
                <div className="col-12 col-sm-5">
                  <label className={`${p}-kasa-input-label`}>Tarih</label>
                  <DateInput value={tarih} onChange={val => setTarih(val)} placeholder="Tarih seçin" />
                </div>
              </div>

              <div>
                <label className={`${p}-kasa-input-label`}>Açıklama (opsiyonel)</label>
                <input
                  type="text"
                  value={aciklama}
                  onChange={e => setAciklama(e.target.value)}
                  placeholder="Örn: Tedarikçi adı, fatura no"
                  className={`${p}-kasa-input`}
                  style={{ borderRadius: 10 }}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className={`${p}-modal-footer`}>
            <button className={`${p}-btn-cancel`} onClick={onClose} disabled={kaydediyor}>
              İptal
            </button>
            <button
              className={`${p}-btn-save ${p}-btn-save-red${kaydediyor ? ' p-btn-loading' : ''}`}
              onClick={kaydet}
              disabled={kaydediyor || !hazirMi}
            >
              {kaydediyor
                ? <><span className="p-btn-spinner" />Kaydediliyor...</>
                : <><i className="bi bi-shield-lock-fill me-2" />Kaydet & Şifrele</>}
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORİ DETAY MODALI — tıklanan kategorinin tüm işlemleri, gün gün
// ═══════════════════════════════════════════════════════════════════════════════
function KategoriDetayModal({ open, onClose, kategori, hareketler, isGiris, p }) {
  const [secilenGun, setSecilenGun] = useState(null) // null = tüm günler

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => { if (!open) setSecilenGun(null) }, [open])

  if (!open || !kategori) return null

  const accentColor = isGiris ? 'var(--p-color-primary)' : 'var(--p-color-danger)'
  const accentHex   = isGiris ? '#10B981' : '#EF4444'
  const accentBg    = isGiris ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)'

  // Seçili kategorinin hareketleri
  const katHareketler = hareketler
    .filter(h => (h.kategori || 'Diğer') === kategori)
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
  const katToplam = katHareketler.reduce((s, h) => s + (h.tutar ?? 0), 0)

  // Gün gün gruplama
  const gunMap = {}
  katHareketler.forEach(h => {
    const gun = h.tarih
    if (!gunMap[gun]) gunMap[gun] = []
    gunMap[gun].push(h)
  })
  const siraliGunler = Object.keys(gunMap).sort((a, b) => new Date(b) - new Date(a))

  // Gün filtresi uygulanmış liste
  const gosterilecekGunler = secilenGun ? [secilenGun] : siraliGunler
  const filtreliAdet = secilenGun
    ? (gunMap[secilenGun]?.length ?? 0)
    : katHareketler.length
  const filtreliToplam = secilenGun
    ? (gunMap[secilenGun] ?? []).reduce((s, h) => s + (h.tutar ?? 0), 0)
    : katToplam

  const gunKisaFmt = (t) => {
    const d = new Date(t + 'T00:00:00')
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  }
  const gunUzunFmt = (t) => {
    const d = new Date(t + 'T00:00:00')
    return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} onClick={onClose} />
      <div className={`${p}-modal-center ${p}-modal-confirm`} role="dialog" aria-modal="true">
        <div className={`${p}-modal-box`} style={{ maxWidth: 720 }}>

          {/* ─── Başlık ─── */}
          <div className={`${p}-modal-header ${isGiris ? `${p}-mh-success` : `${p}-mh-danger`}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className={`bi ${isGiris ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill'}`} style={{ fontSize: 20 }} />
              </div>
              <div>
                <h2 className={`${p}-modal-title`}>{kategori}</h2>
                <p className={`${p}-modal-sub`} style={{ opacity: 0.9, marginTop: 2 }}>
                  Toplam <span className="financial-num" style={{ fontWeight: 800 }}>{TL(katToplam)} ₺</span> — {katHareketler.length} işlem
                </p>
              </div>
            </div>
            <button className={`${p}-modal-close`} onClick={onClose} style={{ color: '#fff' }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* ─── Gün Filtresi (Pill Seçici) ─── */}
          {siraliGunler.length > 1 && (
            <div style={{
              display: 'flex', gap: 6, padding: '12px 20px',
              overflowX: 'auto', borderBottom: '1px solid var(--p-border)',
              background: 'var(--p-bg-card)',
            }}>
              <button
                type="button"
                onClick={() => setSecilenGun(null)}
                style={{
                  padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: secilenGun === null ? 700 : 500, whiteSpace: 'nowrap', flexShrink: 0,
                  background: secilenGun === null ? accentHex : 'var(--p-bg-page)',
                  color: secilenGun === null ? '#fff' : 'var(--p-text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                Tüm Günler ({katHareketler.length})
              </button>
              {siraliGunler.map(gun => {
                const aktif = secilenGun === gun
                return (
                  <button
                    key={gun}
                    type="button"
                    onClick={() => setSecilenGun(aktif ? null : gun)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: aktif ? 700 : 500, whiteSpace: 'nowrap', flexShrink: 0,
                      background: aktif ? accentHex : 'var(--p-bg-page)',
                      color: aktif ? '#fff' : 'var(--p-text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {gunKisaFmt(gun)} ({gunMap[gun].length})
                  </button>
                )
              })}
            </div>
          )}

          {/* ─── Filtre Özeti ─── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 20px', background: accentBg,
            borderBottom: '1px solid var(--p-border)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)' }}>
              {secilenGun
                ? gunUzunFmt(secilenGun)
                : `${siraliGunler.length} farklı gün`}
            </span>
            <span className="financial-num" style={{ fontSize: 14, fontWeight: 800, color: accentColor }}>
              {isGiris ? '+' : '−'}{TL(filtreliToplam)} ₺
            </span>
          </div>

          {/* ─── Body — İşlem Kartları ─── */}
          <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            {katHareketler.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--p-text-muted)', fontSize: 13 }}>
                Bu kategoride işlem bulunamadı.
              </div>
            ) : (
              <div>
                {gosterilecekGunler.map(gun => {
                  const ghList = gunMap[gun] ?? []
                  const gToplam = ghList.reduce((s, h) => s + (h.tutar ?? 0), 0)
                  return (
                    <div key={gun}>
                      {/* Gün Başlığı — sadece çoklu gün modunda */}
                      {!secilenGun && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 20px',
                          background: 'linear-gradient(90deg, var(--p-bg-page) 0%, var(--p-bg-card) 100%)',
                          borderBottom: '1px solid var(--p-border)',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)', textTransform: 'capitalize' }}>
                            <i className="bi bi-calendar3" style={{ marginRight: 6, opacity: 0.5, fontSize: 10 }} />
                            {gunUzunFmt(gun)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>{ghList.length} işlem</span>
                            <span className="financial-num" style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>
                              {isGiris ? '+' : '−'}{TL(gToplam)} ₺
                            </span>
                          </div>
                        </div>
                      )}

                      {/* O günün işlem kartları */}
                      {ghList.map((h, idx) => (
                        <div
                          key={h.id}
                          style={{
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--p-border)',
                            background: 'var(--p-bg-card)',
                          }}
                        >
                          {/* Üst satır: tutar + rozetler */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span
                              className={`${isGiris ? 'p-amount-pos' : 'p-amount-neg'} financial-num`}
                              style={{ fontSize: 17, fontWeight: 800 }}
                            >
                              {isGiris ? '+' : '−'}{TL(h.tutar)} ₺
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <KaynakRozeti kaynak={h.kaynak_modul} p={p} />
                            </div>
                          </div>

                          {/* Detay grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '6px 16px',
                          }}>
                            {/* Ödeme Kaynağı */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-bank" style={{ fontSize: 12, color: 'var(--p-text-muted)', flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>
                                {h.baglanti_turu || h.odeme_kaynagi || '—'}
                              </span>
                            </div>

                            {/* Kim İşledi */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-person-fill" style={{ fontSize: 12, color: 'var(--p-text-muted)', flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: 'var(--p-text)' }}>
                                {h.ekleyen_adi || '—'}
                              </span>
                            </div>

                            {/* Tarih + Saat */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-clock" style={{ fontSize: 12, color: 'var(--p-text-muted)', flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>
                                {h.olusturma_tarihi
                                  ? new Date(h.olusturma_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                  : tarihFmt(h.tarih)}
                              </span>
                            </div>
                          </div>

                          {/* Açıklama — varsa */}
                          {h.aciklama && (
                            <div style={{
                              marginTop: 8, padding: '8px 12px', borderRadius: 10,
                              background: 'var(--p-bg-page)', border: '1px solid var(--p-border)',
                            }}>
                              <p style={{ fontSize: 12, color: 'var(--p-text)', margin: 0, lineHeight: 1.5 }}>
                                <i className="bi bi-chat-left-text" style={{ marginRight: 6, fontSize: 10, color: 'var(--p-text-muted)' }} />
                                {h.aciklama}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ─── Footer ─── */}
          <div className={`${p}-modal-footer`} style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>
                {filtreliAdet} / {katHareketler.length} işlem gösteriliyor
              </span>
            </div>
            <button className={`${p}-btn-cancel`} onClick={onClose}>Kapat</button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAYFA KÖKEYİ — GelirGiderSayfasi
// ═══════════════════════════════════════════════════════════════════════════════
export default function GelirGiderSayfasi({ islemTipi }) {
  const aktifTema  = useTemaStore((s) => s.aktifTema)
  const p          = { paramgo: 'p' }[aktifTema] || 'p'
  const renkler    = temaRenkleri[aktifTema] || temaRenkleri.paramgo
  const navigate   = useNavigate()

  const isGiris     = islemTipi === 'giris'
  const accentColor = isGiris ? renkler.success : renkler.danger
  const sayfaIkon   = isGiris ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill'

  const bugun = new Date()
  const [secilenAy, setSecilenAy]       = useState(bugun.getMonth() + 1)
  const [secilenYil, setSecilenYil]     = useState(bugun.getFullYear())
  const [hareketler, setHareketler]     = useState([])
  const [kategoriler, setKategoriler]   = useState([])
  const [yukleniyor, setYukleniyor]     = useState(true)
  const [modalAcik, setModalAcik]       = useState(false)
  const [silModalAcik, setSilModalAcik] = useState(false)
  const [silHareket, setSilHareket]     = useState(null)
  const [silYukleniyor, setSilYukleniyor]   = useState(false)
  const [gecenAyToplam, setGecenAyToplam]   = useState(null)
  const [tumZamanlar,   setTumZamanlar]     = useState(false)
  const [secilenDetayKat, setSecilenDetayKat] = useState(null)

  // Kategorileri yükle
  useEffect(() => {
    kategorileriGetir({ islem_tipi: islemTipi })
      .then(res => { if (res.data.basarili) setKategoriler(res.data.veri ?? []) })
      .catch(() => {})
  }, [islemTipi])

  // Hareketleri yükle
  useEffect(() => {
    const params = { islem_tipi: islemTipi, adet: 1000 }
    if (!tumZamanlar) {
      const ay  = String(secilenAy).padStart(2, '0')
      const son = new Date(secilenYil, secilenAy, 0).getDate()
      params.baslangic_tarihi = `${secilenYil}-${ay}-01`
      params.bitis_tarihi     = `${secilenYil}-${ay}-${String(son).padStart(2, '0')}`
    }
    setYukleniyor(true)
    hareketleriGetir(params)
      .then(res => { if (res.data.basarili) setHareketler(res.data.veri.hareketler ?? []) })
      .catch(() => toast.error('Hareketler yüklenemedi'))
      .finally(() => setYukleniyor(false))
  }, [secilenAy, secilenYil, islemTipi, tumZamanlar])

  const handleKaydet = useCallback(async (veri) => {
    const res = await hareketEkle(veri)
    if (res.data.basarili) {
      toast.success(`${isGiris ? 'Gelir' : 'Gider'} başarıyla kaydedildi`)
      const params = { islem_tipi: islemTipi, adet: 1000 }
      if (!tumZamanlar) {
        const ay  = String(secilenAy).padStart(2, '0')
        const son = new Date(secilenYil, secilenAy, 0).getDate()
        params.baslangic_tarihi = `${secilenYil}-${ay}-01`
        params.bitis_tarihi     = `${secilenYil}-${ay}-${String(son).padStart(2, '0')}`
      }
      const yeniRes = await hareketleriGetir(params)
      if (yeniRes.data.basarili) setHareketler(yeniRes.data.veri.hareketler ?? [])
    } else {
      toast.error(res.data.hata || 'Kayıt başarısız')
      throw new Error('fail')
    }
  }, [isGiris, islemTipi, secilenAy, secilenYil, tumZamanlar])

  // Önceki ay verisi — % değişim KPI için (tüm zamanlar modunda geçersiz)
  useEffect(() => {
    if (tumZamanlar) { setGecenAyToplam(null); return }
    const prevAy  = secilenAy === 1 ? 12 : secilenAy - 1
    const prevYil = secilenAy === 1 ? secilenYil - 1 : secilenYil
    const ayStr   = String(prevAy).padStart(2, '0')
    const sonGun  = new Date(prevYil, prevAy, 0).getDate()
    hareketleriGetir({
      islem_tipi:       islemTipi,
      baslangic_tarihi: `${prevYil}-${ayStr}-01`,
      bitis_tarihi:     `${prevYil}-${ayStr}-${String(sonGun).padStart(2, '0')}`,
      adet:             500,
    })
      .then(res => {
        if (res.data.basarili) {
          const top = (res.data.veri.hareketler ?? []).reduce((s, h) => s + (h.tutar ?? 0), 0)
          setGecenAyToplam(top)
        }
      })
      .catch(() => setGecenAyToplam(null))
  }, [secilenAy, secilenYil, islemTipi, tumZamanlar])

  const silOnayla = useCallback(async () => {
    if (!silHareket) return
    setSilYukleniyor(true)
    try {
      const res = await hareketSil(silHareket.id)
      if (res.data.basarili) {
        toast.success('Kayıt silindi')
        setHareketler(prev => prev.filter(h => h.id !== silHareket.id))
        setSilModalAcik(false)
        setSilHareket(null)
      } else {
        toast.error(res.data.hata || 'Silinemedi')
      }
    } catch (e) {
      toast.error(e.response?.data?.hata || 'Silme başarısız')
    } finally { setSilYukleniyor(false) }
  }, [silHareket])

  // Silme modalı ESC ile kapanma
  useEffect(() => {
    if (!silModalAcik) return
    const h = (e) => { if (e.key === 'Escape') { setSilModalAcik(false); setSilHareket(null) } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [silModalAcik])

  // ─── KPI Hesaplamaları ────────────────────────────────────────────────────
  const ozet = useMemo(() => {
    const toplam    = hareketler.reduce((s, h) => s + (h.tutar ?? 0), 0)
    const adet      = hareketler.length
    const katMap    = {}
    hareketler.forEach(h => {
      const k = h.kategori || 'Diğer'
      katMap[k] = (katMap[k] || 0) + (h.tutar ?? 0)
    })
    const enCokKat     = Object.entries(katMap).sort((a, b) => b[1] - a[1])[0]
    const manuelAdet   = hareketler.filter(h => !h.kaynak_modul || h.kaynak_modul === 'manuel').length
    const otomatikAdet = adet - manuelAdet

    // Tekrarlayan vs Manuel toplam (tutar bazlı)
    const tekrarlayanToplam = hareketler
      .filter(h => h.kaynak_modul === 'tekrarlayan')
      .reduce((s, h) => s + (h.tutar ?? 0), 0)
    const manuelToplam = toplam - tekrarlayanToplam

    // Kategori dağılımı — grafik + tablo için (büyükten küçüğe sıralı)
    const katAdetMap = {}
    hareketler.forEach(h => {
      const k = h.kategori || 'Diğer'
      katAdetMap[k] = (katAdetMap[k] || 0) + 1
    })
    const kategoriDagilimi = Object.entries(katMap)
      .sort((a, b) => b[1] - a[1])
      .map(([ad, tutar]) => ({ ad, tutar, adet: katAdetMap[ad] || 0, yuzde: toplam > 0 ? Math.round((tutar / toplam) * 100) : 0 }))
    // Günlük ortalama — seçili ay cari ay ise bugüne kadar geçen gün, değilse tam ay
    const _b = new Date()
    const gecenGunSayisi = (_b.getMonth() + 1 === secilenAy && _b.getFullYear() === secilenYil)
      ? _b.getDate()
      : new Date(secilenYil, secilenAy, 0).getDate()
    const gunlukOrtalama  = gecenGunSayisi > 0 ? toplam / gecenGunSayisi : 0
    const tekrarlayanOrani = toplam > 0 ? Math.round((tekrarlayanToplam / toplam) * 100) : 0

    return { toplam, adet, enCokKat, manuelAdet, otomatikAdet, tekrarlayanToplam, manuelToplam, kategoriDagilimi, gunlukOrtalama, tekrarlayanOrani }
  }, [hareketler, secilenAy, secilenYil])

  const siraliHareketler = useMemo(() =>
    [...hareketler].sort((a, b) => new Date(b.tarih) - new Date(a.tarih)),
    [hareketler]
  )

  return (
    <div className={`${p}-page-root`}>

      {/* ─── Sayfa Başlığı ─────────────────────────────────────────────────── */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon${isGiris ? '' : ` ${p}-page-header-icon-danger`}`}>
            <i className={`bi ${sayfaIkon}`} />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>{isGiris ? 'Gelirler' : 'Giderler'}</h1>
            <p className={`${p}-page-sub`}>
              {isGiris ? 'Tüm gelir hareketleri ve tahsilat takibi' : 'Tüm gider hareketleri ve ödeme takibi'}
            </p>
          </div>
        </div>
        <div className={`${p}-page-header-right`}>
          <button
            onClick={() => navigate('/tekrarlayan-islemler')}
            className={`${p}-cym-btn-outline${isGiris ? '' : '-danger'} d-none d-md-flex align-items-center gap-2`}
          >
            <i className="bi bi-arrow-repeat" /> Tekrarlayan Tanımla
          </button>
          <button
            onClick={() => setModalAcik(true)}
            className={`${p}-${isGiris ? 'cym-btn-new' : 'cym-btn-danger'} d-none d-md-flex align-items-center gap-2`}
          >
            <i className="bi bi-plus-lg" />
            {isGiris ? 'Gelir Ekle' : 'Gider Ekle'}
          </button>
        </div>
      </div>

      {/* ─── Dönem Filtresi (Sayfa Üstü) ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
        background: 'var(--p-bg-card)', borderRadius: 14, padding: '10px 16px',
        border: '1.5px solid var(--p-border)', boxShadow: 'var(--p-shadow-card)',
        flexWrap: 'wrap',
      }}>
        <i className="bi bi-calendar3" style={{ fontSize: 14, color: accentColor, opacity: 0.7, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-muted)', marginRight: 2 }}>Dönem:</span>

        {/* Tüm Zamanlar butonu */}
        <button
          type="button"
          onClick={() => setTumZamanlar(true)}
          style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: tumZamanlar ? 700 : 500,
            background: tumZamanlar ? accentColor : 'var(--p-bg-page)',
            color: tumZamanlar ? '#fff' : 'var(--p-text-muted)',
            transition: 'all 0.2s',
          }}
        >
          Tüm Zamanlar
        </button>

        {/* Ay seçici — Tüm Zamanlar aktifken soluk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: tumZamanlar ? 0.45 : 1, transition: 'opacity 0.2s' }}>
          <select
            value={secilenAy}
            onChange={e => { setSecilenAy(Number(e.target.value)); setTumZamanlar(false) }}
            className={`${p}-kasa-donem-select`}
            style={{ minWidth: 110 }}
          >
            {AY_ADLARI.map((ad, i) => <option key={i} value={i + 1}>{ad}</option>)}
          </select>
          <select
            value={secilenYil}
            onChange={e => { setSecilenYil(Number(e.target.value)); setTumZamanlar(false) }}
            className={`${p}-kasa-donem-select`}
            style={{ minWidth: 72 }}
          >
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Aktif dönem etiketi */}
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: accentColor }}>
          {tumZamanlar ? 'Tüm kayıtlar' : `${AY_ADLARI[secilenAy - 1]} ${secilenYil}`}
        </span>
      </div>

      {/* ─── KPI Kartları ──────────────────────────────────────────────────── */}
      {(() => {
        const degisimYuzde = gecenAyToplam !== null && gecenAyToplam > 0
          ? ((ozet.toplam - gecenAyToplam) / gecenAyToplam * 100)
          : null
        // Gelirde artış = iyi (yeşil), giderde azalış = iyi (yeşil)
        const degisimOlumlu = degisimYuzde !== null
          ? (isGiris ? degisimYuzde >= 0 : degisimYuzde <= 0)
          : null
        const prevAyAdi = AY_ADLARI[secilenAy === 1 ? 11 : secilenAy - 2]
        return (
          <div className="row g-3 mb-4">

            {/* Kart 1 — Ay Toplamı (Hero) */}
            <div className="col-12">
              <div className={`${p}-kpi-card ${p}-kpi-hero`}>
                <div className={`${p}-kpi-hero-accent ${isGiris ? `${p}-kpi-hero-accent-success` : `${p}-kpi-hero-accent-danger`}`} />
                <div className={`${p}-kpi-hero-body`}>
                  <div className={`${p}-kpi-hero-left`}>
                    <div className={`${p}-kpi-icon-circle ${isGiris ? `${p}-kpi-ic-success` : `${p}-kpi-ic-danger`}`}>
                      <i className={`bi ${sayfaIkon}`} />
                    </div>
                    <div className={`${p}-kpi-hero-info`}>
                      <h6 className={`${p}-kpi-label`}>{tumZamanlar ? 'Genel Toplam' : `${AY_ADLARI[secilenAy - 1]} Toplamı`}</h6>
                      <h2 className={`${p}-kpi-value ${isGiris ? `${p}-cym-kpi-value-success` : `${p}-cym-kpi-value-danger`} financial-num`} style={{ marginBottom: 0 }}>
                        {TL(ozet.toplam)} ₺
                      </h2>
                    </div>
                  </div>
                  <div className={`${p}-kpi-hero-chips`}>
                    <div className={`${p}-kpi-chip`}>
                      <i className="bi bi-arrow-repeat" />
                      <span className={`${p}-kpi-chip-label`}>Tekrarlayan</span>
                      <span className={`${p}-kpi-chip-val financial-num`}>{TL(ozet.tekrarlayanToplam)} ₺</span>
                    </div>
                    <div className={`${p}-kpi-chip`}>
                      <i className="bi bi-pencil-square" />
                      <span className={`${p}-kpi-chip-label`}>Manuel</span>
                      <span className={`${p}-kpi-chip-val financial-num`}>{TL(ozet.manuelToplam)} ₺</span>
                    </div>
                    <div className={`${p}-kpi-chip ${p}-kpi-chip-count`}>
                      <i className="bi bi-receipt" />
                      <span className={`${p}-kpi-chip-val`}>{ozet.adet} işlem</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kart 2 — Geçen Aya Göre % Değişim */}
            <div className="col-6 col-md-3">
              <div className={`${p}-kpi-card ${p}-kpi-stat`}>
                <div className={`${p}-kpi-stat-top`}>
                  <div className={`${p}-kpi-icon-circle ${p}-kpi-ic-sm ${
                    degisimYuzde === null ? `${p}-kpi-ic-muted` : degisimOlumlu ? `${p}-kpi-ic-success` : `${p}-kpi-ic-danger`
                  }`}>
                    <i className={`bi ${degisimYuzde === null ? 'bi-bar-chart-line' : degisimOlumlu ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}`} />
                  </div>
                  <h6 className={`${p}-kpi-label`}>Geçen Aya Göre</h6>
                </div>
                {gecenAyToplam === null ? (
                  <h2 className={`${p}-kpi-value`} style={{ color: 'var(--p-text-muted)' }}>—</h2>
                ) : gecenAyToplam === 0 ? (
                  <h2 className={`${p}-kpi-value`} style={{ color: 'var(--p-text-muted)', fontSize: 15 }}>Veri yok</h2>
                ) : (
                  <h2 className={`${p}-kpi-value financial-num`} style={{ color: degisimOlumlu ? 'var(--p-color-primary)' : 'var(--p-color-danger)' }}>
                    {degisimYuzde >= 0 ? '+' : ''}{degisimYuzde.toFixed(1)}%
                  </h2>
                )}
                <p className={`${p}-kpi-stat-foot`}>
                  {prevAyAdi}: <span className="financial-num">{TL(gecenAyToplam ?? 0)} ₺</span>
                </p>
              </div>
            </div>

            {/* Kart 3 — Günlük Ortalama */}
            <div className="col-6 col-md-3">
              <div className={`${p}-kpi-card ${p}-kpi-stat`}>
                <div className={`${p}-kpi-stat-top`}>
                  <div className={`${p}-kpi-icon-circle ${p}-kpi-ic-sm ${p}-kpi-ic-info`}>
                    <i className="bi bi-calendar-day" />
                  </div>
                  <h6 className={`${p}-kpi-label`}>Günlük Ortalama</h6>
                </div>
                <h2 className={`${p}-kpi-value financial-num`} style={{ color: 'var(--p-color-info)' }}>
                  {TL(ozet.gunlukOrtalama)} ₺
                </h2>
                <p className={`${p}-kpi-stat-foot`}>{ozet.adet} işlem / ay</p>
              </div>
            </div>

            {/* Kart 4 — En Yüksek Kategori */}
            <div className="col-6 col-md-3">
              <div className={`${p}-kpi-card ${p}-kpi-stat`}>
                <div className={`${p}-kpi-stat-top`}>
                  <div className={`${p}-kpi-icon-circle ${p}-kpi-ic-sm ${p}-kpi-ic-warning`}>
                    <i className="bi bi-trophy" />
                  </div>
                  <h6 className={`${p}-kpi-label`}>{isGiris ? 'En Yüksek Gelir' : 'En Büyük Gider'}</h6>
                </div>
                {ozet.enCokKat ? (
                  <>
                    <h2 className={`${p}-kpi-value`} style={{ fontSize: 'clamp(13px, 3.5cqw, 17px)', fontWeight: 700, lineHeight: 1.3, color: 'var(--p-text)' }}>
                      {ozet.enCokKat[0]}
                    </h2>
                    <p className={`${p}-kpi-stat-foot`}>
                      <span className="financial-num">{TL(ozet.enCokKat[1])} ₺</span>
                      {ozet.toplam > 0 && (
                        <span className={`${p}-kpi-badge ${isGiris ? `${p}-kpi-badge-success` : `${p}-kpi-badge-danger`}`}>
                          %{Math.round((ozet.enCokKat[1] / ozet.toplam) * 100)}
                        </span>
                      )}
                    </p>
                  </>
                ) : (
                  <h2 className={`${p}-kpi-value`} style={{ color: 'var(--p-text-muted)' }}>—</h2>
                )}
              </div>
            </div>

            {/* Kart 5 — Tekrarlayan Oranı */}
            <div className="col-6 col-md-3">
              <div className={`${p}-kpi-card ${p}-kpi-stat`}>
                <div className={`${p}-kpi-stat-top`}>
                  <div className={`${p}-kpi-icon-circle ${p}-kpi-ic-sm ${p}-kpi-ic-primary`}>
                    <i className="bi bi-arrow-repeat" />
                  </div>
                  <h6 className={`${p}-kpi-label`}>{isGiris ? 'Sabit Gelir Oranı' : 'Sabit Gider Oranı'}</h6>
                </div>
                <h2 className={`${p}-kpi-value financial-num`} style={{ color: 'var(--p-color-primary)' }}>
                  %{ozet.tekrarlayanOrani}
                </h2>
                <p className={`${p}-kpi-stat-foot`}>
                  {ozet.otomatikAdet} otomatik, {ozet.manuelAdet} manuel
                </p>
              </div>
            </div>

          </div>
        )
      })()}

      {/* ─── Kategori Dağılımı Grafiği ─────────────────────────────────────── */}
      {!yukleniyor && ozet.kategoriDagilimi.length > 0 && (
        <KategoriGrafik
          dagilim={ozet.kategoriDagilimi}
          toplam={ozet.toplam}
          isGiris={isGiris}
          ay={tumZamanlar ? 'Tüm Zamanlar' : AY_ADLARI[secilenAy - 1]}
          yil={tumZamanlar ? '' : secilenYil}
          p={p}
          renkler={temaRenkleri}
          onKategoriTikla={setSecilenDetayKat}
        />
      )}


      {/* ─── Hareket Listesi Paneli ─────────────────────────────────────────── */}
      <div className={`${p}-cym-glass-card`}>

        {/* Toolbar — başlık */}
        <div className={`${p}-cym-toolbar`}>
          <div className={`${p}-panel-title`}>
            <i className={`bi ${isGiris ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill'}`} />
            {tumZamanlar
              ? `Tüm Zamanlar — ${isGiris ? 'Gelir Hareketleri' : 'Gider Hareketleri'}`
              : `${AY_ADLARI[secilenAy - 1]} ${secilenYil} — ${isGiris ? 'Gelir Hareketleri' : 'Gider Hareketleri'}`
            }
          </div>
        </div>

        {/* İçerik */}
        {yukleniyor ? (
          <div style={{ padding: '8px 0' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="p-gg-skeleton-row">
                <div className="p-gg-sk" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="p-gg-sk" style={{ width: '55%', height: 13, marginBottom: 6 }} />
                  <div className="p-gg-sk" style={{ width: '35%', height: 10 }} />
                </div>
                <div className="p-gg-sk" style={{ width: 80, height: 16, marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        ) : siraliHareketler.length === 0 ? (
          <div className={`${p}-empty-state`} style={{ padding: '48px 24px' }}>
            <i
              className={`bi ${sayfaIkon}`}
              style={{ fontSize: 40, color: 'var(--p-text-muted)', opacity: 0.35 }}
            />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text)', marginTop: 12, marginBottom: 4 }}>
              Bu dönemde {isGiris ? 'gelir' : 'gider'} kaydı yok
            </p>
            <p style={{ fontSize: 12, color: 'var(--p-text-muted)', marginBottom: 16 }}>
              İlk {isGiris ? 'gelir' : 'gider'} kaydınızı eklemek için butona tıklayın
            </p>
            <button onClick={() => setModalAcik(true)} className={`${p}-${isGiris ? 'cym-btn-new' : 'cym-btn-danger'}`}>
              <i className="bi bi-plus-lg" /> {isGiris ? 'Gelir Ekle' : 'Gider Ekle'}
            </button>
          </div>
        ) : (
          <>
          {/* Desktop Tablo */}
          <div className="table-responsive d-none d-md-block">
            <table className={`${p}-cym-table`} style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th className={`${p}-cym-th`} style={{ width: '11%' }}>Tarih</th>
                  <th className={`${p}-cym-th`} style={{ width: '18%' }}>Kategori</th>
                  <th className={`${p}-cym-th text-end`} style={{ width: '14%' }}>Tutar</th>
                  <th className={`${p}-cym-th`} style={{ width: '17%' }}>{isGiris ? 'Tahsilat Kaynağı' : 'Ödeme Kaynağı'}</th>
                  <th className={`${p}-cym-th`} style={{ width: '10%' }}>Kaynak</th>
                  <th className={`${p}-cym-th`} style={{ width: '24%' }}>Açıklama</th>
                  <th className={`${p}-cym-th`} style={{ width: '6%' }}></th>
                </tr>
              </thead>
              <tbody>
                {siraliHareketler.map((h, idx) => {
                  const manuelMi = !h.kaynak_modul || h.kaynak_modul === 'manuel' || h.kaynak_modul === ''
                  return (
                    <tr key={h.id} className={`${p}-cym-tr ${idx % 2 !== 0 ? `${p}-cym-tr-alt` : ''}`}>
                      <td className={`${p}-cym-td`}>
                        <span className={`${p}-cym-date-text`}>{tarihFmt(h.tarih)}</span>
                      </td>
                      <td className={`${p}-cym-td`}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--p-text)' }}>
                          {h.kategori}
                        </span>
                      </td>
                      <td className={`${p}-cym-td text-end`}>
                        {isGiris
                          ? <span className={`${p}-cym-amount-success financial-num`}>+{TL(h.tutar)} ₺</span>
                          : <span className={`${p}-cym-amount-danger financial-num`}>−{TL(h.tutar)} ₺</span>
                        }
                      </td>
                      <td className={`${p}-cym-td`}>
                        <OdemeKaynakGoster kaynak={h.odeme_kaynagi} baglanti={h.baglanti_turu} />
                      </td>
                      <td className={`${p}-cym-td`}>
                        <KaynakRozeti kaynak={h.kaynak_modul} p={p} />
                      </td>
                      <td className={`${p}-cym-td`} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>{h.aciklama || '—'}</span>
                      </td>
                      <td className={`${p}-cym-td text-end`}>
                        <div className="d-flex justify-content-end gap-1">
                          {manuelMi && (
                            <button
                              className={`${p}-cym-action-btn ${p}-cym-action-danger`}
                              onClick={() => { setSilHareket(h); setSilModalAcik(true) }}
                              title="Sil"
                              aria-label="Sil"
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobil Kart Listesi */}
          <div className="d-md-none">
            <div className="p-swipe-hint"><i className="bi bi-arrow-left-right" /> Sola kaydırarak silebilirsiniz</div>
            {siraliHareketler.map((h) => {
              const manuelMi = !h.kaynak_modul || h.kaynak_modul === 'manuel' || h.kaynak_modul === ''
              const aksiyonlar = manuelMi
                ? [{ icon: 'bi-trash3', label: 'Sil', renk: 'danger', onClick: () => { setSilHareket(h); setSilModalAcik(true) } }]
                : []
              return (
                <SwipeCard key={h.id} aksiyonlar={aksiyonlar}>
                  <div className="p-gg-mcard">
                    <div className="p-gg-mcard-top">
                      <div className="p-gg-mcard-kat">
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--p-text)' }}>{h.kategori}</span>
                        <KaynakRozeti kaynak={h.kaynak_modul} p={p} />
                      </div>
                      {isGiris
                        ? <span className="p-gg-mcard-tutar financial-num" style={{ color: 'var(--p-color-success)' }}>+{TL(h.tutar)} ₺</span>
                        : <span className="p-gg-mcard-tutar financial-num" style={{ color: 'var(--p-color-danger)' }}>−{TL(h.tutar)} ₺</span>
                      }
                    </div>
                    {h.aciklama && <div className="p-gg-mcard-aciklama">{h.aciklama}</div>}
                    <div className="p-gg-mcard-alt">
                      <span className="p-gg-mcard-tarih"><i className="bi bi-calendar3" /> {tarihFmt(h.tarih)}</span>
                      <OdemeKaynakGoster kaynak={h.odeme_kaynagi} baglanti={h.baglanti_turu} />
                    </div>
                  </div>
                </SwipeCard>
              )
            })}
          </div>
          </>
        )}

      </div>

      {/* ─── Mobil FAB Buton ─────────────────────────────────────────────── */}
      <button
        onClick={() => setModalAcik(true)}
        className={`${p}-${isGiris ? 'cym-btn-new' : 'cym-btn-danger'} d-md-none`}
        aria-label={isGiris ? 'Gelir Ekle' : 'Gider Ekle'}
        style={{
          position: 'fixed', bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))', right: 20, zIndex: 1040,
          width: 56, height: 56, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isGiris ? 'var(--p-shadow-fab-success)' : 'var(--p-shadow-fab-danger)',
        }}
      >
        <i className="bi bi-plus-lg" style={{ fontSize: 22 }} />
      </button>

      {/* ─── Modaller ──────────────────────────────────────────────────────── */}
      {isGiris ? (
        <GelirEkleModal
          open={modalAcik}
          onClose={() => setModalAcik(false)}
          kategoriler={kategoriler}
          onKaydet={handleKaydet}
          p={p}
          renkler={renkler}
        />
      ) : (
        <GiderEkleModal
          open={modalAcik}
          onClose={() => setModalAcik(false)}
          kategoriler={kategoriler}
          onKaydet={handleKaydet}
          p={p}
          renkler={renkler}
        />
      )}

      {/* ─── Kategori Detay Modalı ──────────────────────────────────────── */}
      <KategoriDetayModal
        open={secilenDetayKat !== null}
        onClose={() => setSecilenDetayKat(null)}
        kategori={secilenDetayKat}
        hareketler={hareketler}
        isGiris={isGiris}
        p={p}
      />

      {/* ─── Silme Onay Modalı ──────────────────────────────────────────── */}
      {silModalAcik && createPortal(
        <>
          <div className={`${p}-modal-overlay`} />
          <div className={`${p}-modal-center ${p}-modal-confirm`} role="dialog" aria-modal="true">
            <div className={`${p}-modal-box`} style={{ maxWidth: 420 }}>
              <div className={`${p}-modal-header ${p}-mh-danger`}>
                <h2 className={`${p}-modal-title`}>
                  <i className="bi bi-exclamation-triangle-fill" />
                  {isGiris ? ' Gelir Kaydını Sil' : ' Gider Kaydını Sil'}
                </h2>
                <button onClick={() => { setSilModalAcik(false); setSilHareket(null) }} className={`${p}-modal-close`} aria-label="Kapat">
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              <div className={`${p}-modal-body`}>
                <p style={{ margin: 0 }}>
                  <strong>{silHareket?.kategori}</strong> kategorisindeki{' '}
                  <strong className="financial-num">{TL(silHareket?.tutar)} ₺</strong>{' '}
                  tutarındaki kaydı silmek istediğinize emin misiniz?
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--p-text-muted)' }}>
                  Bu işlem geri alınamaz. Kasa bakiyesi otomatik güncellenir.
                </p>
              </div>
              <div className={`${p}-modal-footer`}>
                <button onClick={() => { setSilModalAcik(false); setSilHareket(null) }} className={`${p}-btn-cancel`}>
                  Vazgeç
                </button>
                <button
                  onClick={silOnayla}
                  disabled={silYukleniyor}
                  className={`${p}-btn-save ${p}-btn-save-red d-flex align-items-center justify-content-center gap-2`}
                >
                  {silYukleniyor
                    ? <><i className={`bi bi-arrow-repeat ${p}-cym-spin`} /> İşleniyor...</>
                    : <><i className="bi bi-trash3" /> Sil</>}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

    </div>
  )
}
