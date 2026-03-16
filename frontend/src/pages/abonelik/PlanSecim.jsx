/**
 * PlanSecim — Abonelik Yönetim Sayfası
 * Route: /abonelik
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'
import useTemaStore from '../../stores/temaStore'
import { abonelikApi } from '../../api/abonelik'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'

const FIYATLAR = {
  standart: { aylik: 399.90, yillik: 3499.00 },
  kurumsal: { aylik: 749.90, yillik: 6490.00 },
}
const KAMPANYA_FIYAT = 99.90

const fmt = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n)
const tarihFmt = (t) => t ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(t)) : '—'

const DURUM_MAP = {
  tamamlandi: { etiket: 'Tamamlandı', cls: 'abn-badge-success' },
  bekliyor:   { etiket: 'Bekliyor',   cls: 'abn-badge-warning' },
  iptal:      { etiket: 'İptal',      cls: 'abn-badge-danger'  },
  iade:       { etiket: 'İade',       cls: 'abn-badge-info'    },
}

const KANAL_MAP = { web: 'Web', apple: 'App Store', google: 'Google Play' }

export default function PlanSecim() {
  const { aktifTema } = useTemaStore()
  const prefixMap = { banking: 'b', earthy: 'e', dark: 'd' }
  const p = prefixMap[aktifTema] || 'd'
  const { plan } = usePlanKontrol()

  const [yukleniyor, setYukleniyor] = useState(true)
  const [gecmisYukleniyor, setGecmisYukleniyor] = useState(true)
  const [durum, setDurum] = useState(null)
  const [gecmis, setGecmis] = useState([])
  const [yillik, setYillik] = useState(false)

  useEffect(() => {
    const durumAl = async () => {
      try {
        const res = await abonelikApi.durum()
        setDurum(res.data.veri)
      } catch {
        toast.error('Plan bilgisi yüklenemedi')
      } finally {
        setYukleniyor(false)
      }
    }
    const gecmisAl = async () => {
      try {
        const res = await abonelikApi.gecmis()
        setGecmis(res.data.veri.gecmis || [])
      } catch { /* sessiz */ } finally {
        setGecmisYukleniyor(false)
      }
    }
    durumAl()
    gecmisAl()
  }, [])

  const kampanyaAktif = durum?.kampanya_kullanici || false
  const standartGosterilen = yillik
    ? Math.round(FIYATLAR.standart.yillik / 12 * 100) / 100
    : (kampanyaAktif ? KAMPANYA_FIYAT : FIYATLAR.standart.aylik)
  const kurumGosterilen = yillik
    ? Math.round(FIYATLAR.kurumsal.yillik / 12 * 100) / 100
    : FIYATLAR.kurumsal.aylik

  const planlar = [
    {
      id: 'ucretsiz', ad: 'Ücretsiz', ikon: 'bi-gift', btnSinif: 'pasif',
      ozellikler: ['Cari yönetimi', 'Çek/Senet takibi', 'Kasa yönetimi', 'Ödeme takibi', 'Vade hesaplayıcı'],
      kisitlamalar: ['PDF/Excel rapor yok', 'Veri dışa aktarma yok', 'Tek kullanıcı'],
    },
    {
      id: 'standart', ad: 'Standart', ikon: 'bi-star-fill', btnSinif: 'amber',
      fiyat: standartGosterilen, fiyatYillik: FIYATLAR.standart.yillik,
      tasarruf: fmt(FIYATLAR.standart.aylik * 12 - FIYATLAR.standart.yillik),
      onerilen: true, kampanya: kampanyaAktif && !yillik,
      ozellikler: ['Ücretsiz plandaki her şey', 'PDF ve Excel raporlar', 'Veri dışa aktarma', '3 kullanıcıya kadar'],
    },
    {
      id: 'kurumsal', ad: 'Kurumsal', ikon: 'bi-building-fill', btnSinif: 'mavi',
      fiyat: kurumGosterilen, fiyatYillik: FIYATLAR.kurumsal.yillik,
      tasarruf: fmt(FIYATLAR.kurumsal.aylik * 12 - FIYATLAR.kurumsal.yillik),
      ozellikler: ['Standart plandaki her şey', 'Sınırsız kullanıcı', 'Yapay zeka asistanı', 'API erişimi', 'Öncelikli destek'],
    },
  ]

  return (
    <>
      <style>{`
        /* ── SHARED ─────────────────────────────────────────────── */
        .abn-page { padding: 28px 24px; max-width: 1100px; }
        .abn-btn {
          display: block; width: 100%; min-height: 44px; border-radius: 10px;
          border: none; cursor: pointer; font-size: 13px; font-weight: 700;
          margin-top: 16px; transition: all 0.15s;
        }
        .abn-btn.amber { background: linear-gradient(135deg,#f59e0b,#d97706); color:#fff; box-shadow:0 4px 14px rgba(245,158,11,0.3); }
        .abn-btn.amber:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(245,158,11,0.4); }
        .abn-btn.mavi  { background: linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; box-shadow:0 4px 14px rgba(59,130,246,0.3); }
        .abn-btn.mavi:hover  { transform:translateY(-1px); box-shadow:0 6px 18px rgba(59,130,246,0.4); }
        .abn-toggle-switch {
          position:relative; width:44px; height:24px;
          border-radius:50px; cursor:pointer; transition:background 0.2s;
        }
        .abn-toggle-knob {
          position:absolute; top:3px; left:3px; width:16px; height:16px;
          border-radius:50%; background:#fff; transition:transform 0.2s;
          box-shadow:0 1px 3px rgba(0,0,0,0.2);
        }
        .abn-toggle-switch.on .abn-toggle-knob { transform:translateX(20px); }
        .abn-kampanya-chip {
          background:linear-gradient(135deg,#f59e0b,#d97706);
          color:#000; font-size:10px; font-weight:800; padding:3px 10px;
          border-radius:20px; white-space:nowrap;
        }
        .abn-tasarruf-chip {
          font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px;
          background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.2);
        }
        /* Semantic status badges */
        .abn-badge-success { background:rgba(5,150,105,0.1);  color:#059669; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
        .abn-badge-warning { background:rgba(217,119,6,0.1);  color:#d97706; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
        .abn-badge-danger  { background:rgba(220,38,38,0.1);  color:#dc2626; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
        .abn-badge-info    { background:rgba(99,102,241,0.1); color:#6366f1; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
        /* Plan icon boxes */
        .abn-icon-standart { background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25); }
        .abn-icon-kurumsal { background:rgba(59,130,246,0.1);  border:1px solid rgba(59,130,246,0.22); }
        @keyframes abnSkel { from{opacity:.45} to{opacity:1} }

        /* ── BANKING (b) ─────────────────────────────────────────── */
        .b-abn-page-title { font-size:20px; font-weight:700; color:var(--b-text); font-family:var(--b-font-display); margin-bottom:4px; }
        .b-abn-page-sub   { font-size:13px; color:var(--b-text-muted); }
        .b-abn-hero {
          background:linear-gradient(135deg,#0a2463 0%,#1a3a80 100%);
          border-radius:16px; padding:28px 32px; margin-bottom:28px; color:#fff;
        }
        .b-abn-current-card {
          background:var(--b-bg-card); border:1px solid var(--b-border);
          border-left:4px solid var(--b-color-gold);
          border-radius:var(--b-radius-card); padding:20px 24px;
          margin-bottom:28px; box-shadow:var(--b-shadow-card);
        }
        .b-abn-current-label { font-size:11px; font-weight:600; color:var(--b-text-label); text-transform:uppercase; letter-spacing:.08em; }
        .b-abn-current-name  { font-size:18px; font-weight:800; color:var(--b-text); font-family:var(--b-font-display); }
        .b-abn-meta-label    { font-size:11px; font-weight:600; color:var(--b-text-label); text-transform:uppercase; letter-spacing:.06em; }
        .b-abn-meta-value    { font-size:14px; font-weight:700; color:var(--b-text); }
        .b-abn-section-title {
          font-size:13px; font-weight:700; color:var(--b-text); text-transform:uppercase;
          letter-spacing:.06em; margin-bottom:16px; display:flex; align-items:center; gap:8px;
        }
        .b-abn-section-title::before { content:''; display:block; width:4px; height:16px; border-radius:2px; background:var(--b-color-navy); }
        .b-abn-toggle-label { font-size:13px; font-weight:600; color:var(--b-text-muted); cursor:pointer; transition:color .15s; }
        .b-abn-toggle-label.aktif { color:var(--b-text); }
        .b-abn-toggle-sw { background:var(--b-border); border:1px solid var(--b-border-strong); }
        .b-abn-toggle-sw.on { background:var(--b-color-navy); }
        .b-abn-plan-card {
          background:var(--b-bg-card); border:1px solid var(--b-border);
          box-shadow:var(--b-shadow-card); border-radius:16px; padding:22px;
          transition:all .2s; position:relative; overflow:hidden; height:100%;
        }
        .b-abn-plan-card:hover { box-shadow:var(--b-shadow-card-hover); transform:translateY(-2px); background:var(--b-bg-card-hover); }
        .b-abn-plan-card.aktif-plan  { border:2px solid var(--b-color-navy); }
        .b-abn-plan-card.onerilen    { border:2px solid var(--b-color-gold); box-shadow:var(--b-shadow-card-hover); }
        .b-abn-plan-price  { font-size:30px; font-weight:800; color:var(--b-text); font-family:var(--b-font-display); line-height:1; }
        .b-abn-price-unit  { font-size:13px; font-weight:600; color:var(--b-text-muted); }
        .b-abn-plan-name   { font-size:16px; font-weight:800; color:var(--b-text); }
        .b-abn-feature     { font-size:12px; color:var(--b-text-sec); display:flex; align-items:flex-start; gap:7px; margin-bottom:8px; line-height:1.4; }
        .b-abn-feature i   { color:#059669; font-size:12px; flex-shrink:0; margin-top:1px; }
        .b-abn-feature.kisit     { color:var(--b-text-muted); }
        .b-abn-feature.kisit i   { color:#dc2626; }
        .b-abn-sep         { height:1px; background:var(--b-border); margin:14px 0; }
        .b-abn-btn-pasif   { display:block; width:100%; min-height:44px; border-radius:10px; border:1px solid var(--b-border); background:var(--b-border); color:var(--b-text-muted); font-size:13px; font-weight:600; margin-top:16px; cursor:default; }
        .b-abn-card        { background:var(--b-bg-card); border:1px solid var(--b-border); box-shadow:var(--b-shadow-card); border-radius:var(--b-radius-card); overflow:hidden; }
        .b-abn-th          { font-size:11px; font-weight:700; color:var(--b-text-label); text-transform:uppercase; letter-spacing:.05em; padding:12px 16px; background:var(--b-bg-card-hover); border:none !important; border-bottom:1px solid var(--b-border) !important; }
        .b-abn-td          { padding:11px 16px; font-size:13px; color:var(--b-text-sec); border:none !important; border-bottom:1px solid var(--b-border) !important; }
        .b-abn-td-bold     { padding:11px 16px; font-size:13px; font-weight:700; color:var(--b-text); border:none !important; border-bottom:1px solid var(--b-border) !important; }
        .b-abn-empty       { color:var(--b-text-muted); }
        .b-abn-savings     { font-size:11px; color:#059669; font-weight:700; }
        .b-abn-yearly-note { font-size:11px; color:var(--b-text-muted); margin-top:3px; }
        .b-abn-strike      { font-size:11px; color:var(--b-text-muted); text-decoration:line-through; }
        .b-abn-icon-box    { width:44px; height:44px; border-radius:12px; background:var(--b-color-navy); display:flex; align-items:center; justify-content:center; }
        .b-abn-icon-ucretsiz { background:rgba(10,36,99,0.07); border:1px solid rgba(10,36,99,0.14); }
        .b-abn-badge-active { font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.06em; background:rgba(10,36,99,0.1); color:var(--b-color-navy); }
        .b-abn-badge-rec    { font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.06em; background:rgba(184,134,11,0.12); color:var(--b-color-gold); }
        .b-abn-skel        { background:var(--b-border); border-radius:6px; animation:abnSkel 1.4s ease infinite alternate; }
        .b-abn-hero-stat   { color:#fff; opacity:.9; }

        /* ── EARTHY (e) ─────────────────────────────────────────── */
        .e-abn-page-title { font-size:20px; font-weight:700; color:var(--e-text); font-family:var(--e-font-display); margin-bottom:4px; }
        .e-abn-page-sub   { font-size:13px; color:var(--e-text-muted); }
        .e-abn-hero {
          background:linear-gradient(135deg, var(--e-color-terracotta) 0%, #9b2a1e 100%);
          border-radius:16px; padding:28px 32px; margin-bottom:28px; color:#fff;
        }
        .e-abn-current-card {
          background:var(--e-bg-card); border:1px solid var(--e-border);
          border-bottom:4px solid var(--e-color-mustard);
          border-radius:var(--e-radius-card); padding:20px 24px;
          margin-bottom:28px; box-shadow:var(--e-shadow-card);
        }
        .e-abn-current-label { font-size:11px; font-weight:600; color:var(--e-text-muted); text-transform:uppercase; letter-spacing:.08em; }
        .e-abn-current-name  { font-size:18px; font-weight:800; color:var(--e-text); font-family:var(--e-font-display); }
        .e-abn-meta-label    { font-size:11px; font-weight:600; color:var(--e-text-muted); text-transform:uppercase; letter-spacing:.06em; }
        .e-abn-meta-value    { font-size:14px; font-weight:700; color:var(--e-text); }
        .e-abn-section-title {
          font-size:13px; font-weight:700; color:var(--e-text); text-transform:uppercase;
          letter-spacing:.06em; margin-bottom:16px; display:flex; align-items:center; gap:8px;
        }
        .e-abn-section-title::before { content:''; display:block; width:4px; height:16px; border-radius:2px; background:var(--e-color-terracotta); }
        .e-abn-toggle-label { font-size:13px; font-weight:600; color:var(--e-text-muted); cursor:pointer; transition:color .15s; }
        .e-abn-toggle-label.aktif { color:var(--e-text); }
        .e-abn-toggle-sw { background:var(--e-border); border:1px solid #d4c9b8; }
        .e-abn-toggle-sw.on { background:var(--e-color-terracotta); }
        .e-abn-plan-card {
          background:var(--e-bg-card); border:1px solid var(--e-border);
          box-shadow:var(--e-shadow-card); border-radius:16px; padding:22px;
          transition:all .2s; position:relative; overflow:hidden; height:100%;
        }
        .e-abn-plan-card:hover { box-shadow:var(--e-shadow-card-hover); transform:translateY(-2px); background:var(--e-bg-card-hover); }
        .e-abn-plan-card.aktif-plan { border:2px solid var(--e-color-terracotta); }
        .e-abn-plan-card.onerilen   { border:2px solid var(--e-color-mustard); box-shadow:var(--e-shadow-card-hover); }
        .e-abn-plan-price  { font-size:30px; font-weight:800; color:var(--e-text); font-family:var(--e-font-display); line-height:1; }
        .e-abn-price-unit  { font-size:13px; font-weight:600; color:var(--e-text-muted); }
        .e-abn-plan-name   { font-size:16px; font-weight:800; color:var(--e-text); }
        .e-abn-feature     { font-size:12px; color:var(--e-text-sec); display:flex; align-items:flex-start; gap:7px; margin-bottom:8px; line-height:1.4; }
        .e-abn-feature i   { color:var(--e-color-success); font-size:12px; flex-shrink:0; margin-top:1px; }
        .e-abn-feature.kisit     { color:var(--e-text-muted); }
        .e-abn-feature.kisit i   { color:var(--e-color-danger); }
        .e-abn-sep         { height:1px; background:var(--e-border); margin:14px 0; }
        .e-abn-btn-pasif   { display:block; width:100%; min-height:44px; border-radius:10px; border:1px solid var(--e-border); background:var(--e-border); color:var(--e-text-muted); font-size:13px; font-weight:600; margin-top:16px; cursor:default; }
        .e-abn-card        { background:var(--e-bg-card); border:1px solid var(--e-border); box-shadow:var(--e-shadow-card); border-radius:var(--e-radius-card); overflow:hidden; }
        .e-abn-th          { font-size:11px; font-weight:700; color:var(--e-text-muted); text-transform:uppercase; letter-spacing:.05em; padding:12px 16px; background:var(--e-bg-card-hover); border:none !important; border-bottom:1px solid var(--e-border) !important; }
        .e-abn-td          { padding:11px 16px; font-size:13px; color:var(--e-text-sec); border:none !important; border-bottom:1px solid var(--e-border) !important; }
        .e-abn-td-bold     { padding:11px 16px; font-size:13px; font-weight:700; color:var(--e-text); border:none !important; border-bottom:1px solid var(--e-border) !important; }
        .e-abn-empty       { color:var(--e-text-muted); }
        .e-abn-savings     { font-size:11px; color:var(--e-color-success); font-weight:700; }
        .e-abn-yearly-note { font-size:11px; color:var(--e-text-muted); margin-top:3px; }
        .e-abn-strike      { font-size:11px; color:var(--e-text-muted); text-decoration:line-through; }
        .e-abn-icon-box    { width:44px; height:44px; border-radius:12px; background:var(--e-color-terracotta); display:flex; align-items:center; justify-content:center; }
        .e-abn-icon-ucretsiz { background:rgba(120,60,20,0.07); border:1px solid rgba(120,60,20,0.14); }
        .e-abn-badge-active { font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.06em; background:rgba(192,57,43,0.1); color:var(--e-color-terracotta); }
        .e-abn-badge-rec    { font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.06em; background:rgba(212,146,11,0.12); color:var(--e-color-mustard); }
        .e-abn-skel        { background:var(--e-border); border-radius:6px; animation:abnSkel 1.4s ease infinite alternate; }
        .e-abn-hero-stat   { color:#fff; opacity:.9; }

        /* ── DARK (d) ────────────────────────────────────────────── */
        .d-abn-page-title { font-size:20px; font-weight:700; color:var(--d-text); margin-bottom:4px; }
        .d-abn-page-sub   { font-size:13px; color:rgba(255,255,255,0.45); }
        .d-abn-hero {
          background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.04));
          border:1px solid rgba(245,158,11,0.2); border-radius:16px; padding:28px 32px; margin-bottom:28px;
        }
        .d-abn-current-card {
          background:linear-gradient(135deg,rgba(245,158,11,0.06),rgba(245,158,11,0.02));
          border:1px solid rgba(245,158,11,0.2); border-radius:16px; padding:20px 24px; margin-bottom:28px;
        }
        .d-abn-current-label { font-size:11px; font-weight:600; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:.08em; }
        .d-abn-current-name  { font-size:18px; font-weight:800; color:var(--d-text); }
        .d-abn-meta-label    { font-size:11px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:.06em; }
        .d-abn-meta-value    { font-size:14px; font-weight:700; color:var(--d-text); }
        .d-abn-section-title {
          font-size:13px; font-weight:700; color:rgba(255,255,255,0.7); text-transform:uppercase;
          letter-spacing:.06em; margin-bottom:16px; display:flex; align-items:center; gap:8px;
        }
        .d-abn-section-title::before { content:''; display:block; width:4px; height:16px; border-radius:2px; background:#f59e0b; }
        .d-abn-toggle-label { font-size:13px; font-weight:600; color:rgba(255,255,255,0.45); cursor:pointer; transition:color .15s; }
        .d-abn-toggle-label.aktif { color:var(--d-text); }
        .d-abn-toggle-sw { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.12); }
        .d-abn-toggle-sw.on { background:#f59e0b; }
        .d-abn-plan-card {
          background:var(--d-bg-card); border:1px solid var(--d-border);
          box-shadow:var(--d-shadow-card); border-radius:16px; padding:22px;
          transition:all .2s; position:relative; overflow:hidden; height:100%;
        }
        .d-abn-plan-card:hover { box-shadow:var(--d-shadow-card-hover); transform:translateY(-2px); background:var(--d-bg-card-hover); }
        .d-abn-plan-card.aktif-plan { border-color:rgba(245,158,11,0.35); background:rgba(245,158,11,0.04); }
        .d-abn-plan-card.onerilen   { border-color:rgba(245,158,11,0.4);  background:rgba(245,158,11,0.04); box-shadow:0 0 28px rgba(245,158,11,0.1); }
        .d-abn-plan-price  { font-size:30px; font-weight:800; color:var(--d-text); line-height:1; }
        .d-abn-price-unit  { font-size:13px; font-weight:600; color:rgba(255,255,255,0.4); }
        .d-abn-plan-name   { font-size:16px; font-weight:800; color:var(--d-text); }
        .d-abn-feature     { font-size:12px; color:rgba(255,255,255,0.6); display:flex; align-items:flex-start; gap:7px; margin-bottom:8px; line-height:1.4; }
        .d-abn-feature i   { color:#10b981; font-size:12px; flex-shrink:0; margin-top:1px; }
        .d-abn-feature.kisit     { color:rgba(255,255,255,0.25); }
        .d-abn-feature.kisit i   { color:rgba(255,255,255,0.18); }
        .d-abn-sep         { height:1px; background:rgba(255,255,255,0.07); margin:14px 0; }
        .d-abn-btn-pasif   { display:block; width:100%; min-height:44px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.35); font-size:13px; font-weight:600; margin-top:16px; cursor:default; }
        .d-abn-card        { background:var(--d-bg-card); border:1px solid var(--d-border); box-shadow:var(--d-shadow-card); border-radius:16px; overflow:hidden; }
        .d-abn-th          { font-size:11px; font-weight:700; color:rgba(255,255,255,0.45); text-transform:uppercase; letter-spacing:.05em; padding:12px 16px; background:rgba(255,255,255,0.02); border:none !important; border-bottom:1px solid rgba(255,255,255,0.08) !important; }
        .d-abn-td          { padding:11px 16px; font-size:13px; color:rgba(255,255,255,0.6); border:none !important; border-bottom:1px solid rgba(255,255,255,0.04) !important; }
        .d-abn-td-bold     { padding:11px 16px; font-size:13px; font-weight:700; color:var(--d-text); border:none !important; border-bottom:1px solid rgba(255,255,255,0.04) !important; }
        .d-abn-empty       { color:rgba(255,255,255,0.3); }
        .d-abn-savings     { font-size:11px; color:#10b981; font-weight:700; }
        .d-abn-yearly-note { font-size:11px; color:rgba(255,255,255,0.35); margin-top:3px; }
        .d-abn-strike      { font-size:11px; color:rgba(255,255,255,0.3); text-decoration:line-through; }
        .d-abn-icon-box    { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#f59e0b,#d97706); box-shadow:0 4px 12px rgba(245,158,11,0.3); display:flex; align-items:center; justify-content:center; }
        .d-abn-icon-ucretsiz { background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); }
        .d-abn-badge-active { font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.06em; background:rgba(245,158,11,0.15); color:#f59e0b; }
        .d-abn-badge-rec    { font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.06em; background:rgba(245,158,11,0.15); color:#f59e0b; }
        .d-abn-skel        { background:rgba(255,255,255,0.08); border-radius:6px; animation:abnSkel 1.4s ease infinite alternate; }
        .d-abn-hero-stat   { color:var(--d-text); opacity:.85; }

        @media (max-width: 767px) {
          .abn-page { padding: 16px; }
          .b-abn-plan-price, .e-abn-plan-price, .d-abn-plan-price { font-size: 24px; }
          .b-abn-hero, .e-abn-hero, .d-abn-hero { padding: 20px 18px; }
        }
      `}</style>

      <div className="abn-page">

        {/* SAYFA BAŞLIĞI */}
        <div className="mb-4">
          <div className={`${p}-abn-page-title`}>
            <i className="bi bi-credit-card me-2" />
            Abonelik Yönetimi
          </div>
          <div className={`${p}-abn-page-sub`}>Planınızı yönetin, işletmenizi büyütün</div>
        </div>

        {/* HERO — Satış odaklı */}
        <div className={`${p}-abn-hero`}>
          <div className="row align-items-center">
            <div className="col-12 col-md-8">
              <div style={{ fontSize: 11, fontWeight: 700, opacity: .75, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                {kampanyaAktif ? '🎉 Lansman Kampanyası Aktif' : 'Finans Kalesi Premium'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, marginBottom: 8, color: '#fff' }}>
                Tüm finans süreçleriniz tek platformda — hiçbir şey gözden kaçmasın
              </div>
              <div style={{ fontSize: 13, opacity: .75, lineHeight: 1.6, color: '#fff' }}>
                Cari hesaplar, çek/senet, ödeme takibi, kasa ve daha fazlası.
              </div>
              {kampanyaAktif && (
                <div style={{ marginTop: 12 }}>
                  <span className="abn-kampanya-chip">🎉 Standart Plan — İlk 3 Ay 99,90₺ Lansman Fiyatı</span>
                </div>
              )}
            </div>
            <div className="col-12 col-md-4 d-none d-md-flex justify-content-end align-items-center gap-4 mt-3 mt-md-0">
              <div className={`${p}-abn-hero-stat`} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#fff' }}>500+</div>
                <div style={{ fontSize: 11, marginTop: 3, color: '#fff', opacity: .65 }}>İşletme</div>
              </div>
              <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.2)' }} />
              <div className={`${p}-abn-hero-stat`} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#fff' }}>%99</div>
                <div style={{ fontSize: 11, marginTop: 3, color: '#fff', opacity: .65 }}>Memnuniyet</div>
              </div>
            </div>
          </div>
        </div>

        {/* MEVCUT PLAN */}
        <div className={`${p}-abn-current-card`}>
          {yukleniyor ? (
            <div className="d-flex gap-3 align-items-center">
              <div className={`${p}-abn-skel`} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
              <div>
                <div className={`${p}-abn-skel`} style={{ width: 80, height: 12, marginBottom: 8 }} />
                <div className={`${p}-abn-skel`} style={{ width: 140, height: 20 }} />
              </div>
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className={`${p}-abn-icon-box`}>
                  <i className="bi bi-award-fill" style={{ color: '#fff', fontSize: 20 }} />
                </div>
                <div>
                  <div className={`${p}-abn-current-label`}>Mevcut Plan</div>
                  <div className={`${p}-abn-current-name`}>{durum?.plan_adi || 'Ücretsiz'}</div>
                </div>
                {durum?.kampanya_kullanici && (
                  <span className="abn-kampanya-chip">🎉 Kampanya Fiyatı — 99,90₺/ay</span>
                )}
              </div>
              <div className="d-flex gap-4 flex-wrap">
                {durum?.bitis_tarihi && (
                  <div>
                    <div className={`${p}-abn-meta-label`}>BİTİŞ TARİHİ</div>
                    <div className={`${p}-abn-meta-value`}>{tarihFmt(durum.bitis_tarihi)}</div>
                  </div>
                )}
                {durum?.odeme_kanali && (
                  <div>
                    <div className={`${p}-abn-meta-label`}>ÖDEME KANALI</div>
                    <div className={`${p}-abn-meta-value`}>{KANAL_MAP[durum.odeme_kanali] || durum.odeme_kanali}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PLAN SEÇİMİ */}
        <div className={`${p}-abn-section-title`}>Plan Seçin</div>

        {/* Dönem toggle */}
        <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
          <span
            className={`${p}-abn-toggle-label ${!yillik ? 'aktif' : ''}`}
            onClick={() => setYillik(false)}
          >Aylık</span>
          <div
            className={`abn-toggle-switch ${p}-abn-toggle-sw ${yillik ? 'on' : ''}`}
            onClick={() => setYillik(v => !v)}
          >
            <div className="abn-toggle-knob" />
          </div>
          <span
            className={`${p}-abn-toggle-label ${yillik ? 'aktif' : ''}`}
            onClick={() => setYillik(true)}
          >
            Yıllık
            <span className="abn-tasarruf-chip ms-2">%27'ye kadar tasarruf</span>
          </span>
        </div>

        <div className="row g-3 mb-4">
          {planlar.map((pl) => {
            const aktif = plan === pl.id
            const iconBoxCls = pl.id === 'ucretsiz'
              ? `${p}-abn-icon-ucretsiz`
              : `abn-icon-${pl.id}`
            const iconColor = pl.id === 'standart' ? '#f59e0b' : pl.id === 'kurumsal' ? '#3b82f6' : undefined

            return (
              <div key={pl.id} className="col-12 col-md-4">
                <div className={`${p}-abn-plan-card ${aktif ? 'aktif-plan' : ''} ${pl.onerilen && !aktif ? 'onerilen' : ''}`}>

                  {/* Rozet satırı */}
                  <div className="d-flex align-items-center justify-content-between mb-3" style={{ minHeight: 24 }}>
                    <div className="d-flex gap-2">
                      {aktif && <span className={`${p}-abn-badge-active`}>✓ Aktif Plan</span>}
                      {pl.onerilen && !aktif && <span className={`${p}-abn-badge-rec`}>★ Önerilen</span>}
                    </div>
                    {pl.kampanya && <span className="abn-kampanya-chip">🎉 Kampanya</span>}
                  </div>

                  {/* İkon + Ad */}
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div
                      className={iconBoxCls}
                      style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <i
                        className={`bi ${pl.ikon}`}
                        style={{ fontSize: 14, color: iconColor || (p === 'b' ? 'var(--b-text-muted)' : p === 'e' ? 'var(--e-text-muted)' : 'rgba(255,255,255,0.4)') }}
                      />
                    </div>
                    <span className={`${p}-abn-plan-name`}>{pl.ad}</span>
                  </div>

                  {/* Fiyat */}
                  <div className="mb-2">
                    {pl.id === 'ucretsiz' ? (
                      <div className={`${p}-abn-plan-price`}>Ücretsiz</div>
                    ) : (
                      <>
                        {pl.kampanya && (
                          <div className={`${p}-abn-strike`}>{fmt(FIYATLAR.standart.aylik)}₺/ay</div>
                        )}
                        <div className="d-flex align-items-baseline gap-1">
                          <span className={`${p}-abn-plan-price`}>{fmt(pl.fiyat)}</span>
                          <span className={`${p}-abn-price-unit`}>₺/ay</span>
                        </div>
                        {yillik && pl.fiyatYillik && (
                          <div className={`${p}-abn-yearly-note`}>
                            Yılda {fmt(pl.fiyatYillik)}₺ —{' '}
                            <span className={`${p}-abn-savings`}>{pl.tasarruf}₺ tasarruf</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className={`${p}-abn-sep`} />

                  {/* Özellikler */}
                  <div>
                    {pl.ozellikler.map((oz) => (
                      <div key={oz} className={`${p}-abn-feature`}>
                        <i className="bi bi-check-circle-fill" />
                        <span>{oz}</span>
                      </div>
                    ))}
                    {pl.kisitlamalar?.map((k) => (
                      <div key={k} className={`${p}-abn-feature kisit`}>
                        <i className="bi bi-x-circle-fill" />
                        <span>{k}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buton */}
                  {aktif ? (
                    <button className={`${p}-abn-btn-pasif`} disabled>✓ Mevcut Planınız</button>
                  ) : pl.id === 'ucretsiz' ? (
                    <button className={`${p}-abn-btn-pasif`} disabled>Ücretsiz Kullan</button>
                  ) : (
                    <button
                      className={`abn-btn ${pl.btnSinif}`}
                      onClick={() => toast.info('Ödeme sistemi yakında entegre edilecek. Detaylar için bizimle iletişime geçin.')}
                    >
                      <i className="bi bi-arrow-up-circle me-2" />
                      {pl.ad}&#39;a Geç
                    </button>
                  )}

                </div>
              </div>
            )
          })}
        </div>

        {/* ÖDEME GEÇMİŞİ */}
        <div className={`${p}-abn-section-title mt-2`}>Ödeme Geçmişi</div>
        <div className={`${p}-abn-card`}>
          {gecmisYukleniyor ? (
            <div style={{ padding: 24 }}>
              {[60, 80, 50].map((w, i) => (
                <div key={i} className={`${p}-abn-skel`} style={{ height: 16, width: `${w}%`, marginBottom: i < 2 ? 10 : 0 }} />
              ))}
            </div>
          ) : gecmis.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <i className={`bi bi-receipt ${p}-abn-empty`} style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: .5 }} />
              <div className={`${p}-abn-empty`} style={{ fontSize: 14, fontWeight: 600 }}>Henüz ödeme geçmişi yok</div>
              <div className={`${p}-abn-empty`} style={{ fontSize: 12, marginTop: 4 }}>Abonelik aldığınızda burada görünecek</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    {['Tarih', 'Plan', 'Dönem', 'Tutar', 'Kanal', 'Durum'].map((h) => (
                      <th key={h} className={`${p}-abn-th`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gecmis.map((kayit) => {
                    const d = DURUM_MAP[kayit.durum] || { etiket: kayit.durum, cls: 'abn-badge-info' }
                    return (
                      <tr key={kayit.id}>
                        <td className={`${p}-abn-td`}>{tarihFmt(kayit.odeme_tarihi || kayit.olusturma_tarihi)}</td>
                        <td className={`${p}-abn-td-bold`}>{kayit.plan_adi === 'standart' ? 'Standart' : 'Kurumsal'}</td>
                        <td className={`${p}-abn-td`}>{kayit.odeme_donemi === 'yillik' ? 'Yıllık' : 'Aylık'}</td>
                        <td className={`${p}-abn-td`} style={{ color: '#059669', fontWeight: 700 }}>{fmt(kayit.tutar)}₺</td>
                        <td className={`${p}-abn-td`}>{KANAL_MAP[kayit.odeme_kanali] || '—'}</td>
                        <td className={`${p}-abn-td`}><span className={d.cls}>{d.etiket}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
