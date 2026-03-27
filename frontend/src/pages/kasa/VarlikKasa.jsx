/**
 * VarlikKasa.jsx — Kasa & Varlık Yönetimi (Ana Bileşen)
 * ParamGo v2 — Tek Tema
 * 4 Sekme: Gösterge Paneli | Aylık Bilanço | Ortak Carisi | Yatırım Kalesi
 * Bootstrap 5 + Saf React | ParamGo
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useLocation } from 'react-router-dom'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri } from '../../lib/temaRenkleri'
import useAuthStore from '../../stores/authStore'
import {
  hareketleriGetir,
  yatirimlariGetir,
  ortaklariGetir,
  bilancoListele,
  kasaOzeti,
} from '../../api/kasa'

import GostergePaneli from './GostergePaneli'
import AylikBilanco from './AylikBilanco'
import OrtakCarisi from './OrtakCarisi'
import YatirimKalesi from './YatirimKalesi'

const prefixMap = { paramgo: 'p' }

const SAYFA_BILGI = {
  gosterge:  { baslik: 'Gösterge Paneli',  alt: 'Nakit akışı, gelir-gider özeti ve finansal durum',  ikon: 'bi-graph-up-arrow' },
  bilanco:   { baslik: 'Aylık Bilanço',     alt: 'Ay sonu kapanış ve performans karşılaştırması',      ikon: 'bi-journal-text' },
  ortak:     { baslik: 'Ortak Carisi',      alt: 'Ortak para giriş-çıkışları ve bakiye takibi',        ikon: 'bi-people-fill' },
  yatirim:   { baslik: 'Yatırım Kalesi',    alt: 'Altın, döviz ve yatırım portföyü takibi',            ikon: 'bi-gem' },
}

// ─── Ana Bileşen (Route-Aware) ─────────────────────────────────────────────────
export default function VarlikKasa() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'p'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.paramgo

  const { kullanici } = useAuthStore()
  const location = useLocation()

  // URL'den aktif sekmeyi belirle
  const aktifSekme = location.pathname === '/kasa/bilanco'    ? 'bilanco'
                   : location.pathname === '/kasa/ortaklar'   ? 'ortak'
                   : location.pathname === '/kasa/yatirimlar' ? 'yatirim'
                   : 'gosterge'

  const sayfa = SAYFA_BILGI[aktifSekme]

  const bugun = new Date()
  const [secilenAy,   setSecilenAy]   = useState(bugun.getMonth() + 1)
  const [secilenYil,  setSecilenYil]  = useState(bugun.getFullYear())
  const [tumZamanlar, setTumZamanlar] = useState(false)
  const [hareketler,  setHareketler]  = useState([])
  const [gecmisKisitli, setGecmisKisitli] = useState(false)
  const [kapanislar,      setKapanislar]      = useState([])
  const [ortakHareketler, setOrtakHareketler] = useState([])
  const [yatirimlar,      setYatirimlar]      = useState([])
  const [kasaOzet,        setKasaOzet]        = useState(null)
  const [yukleniyor,      setYukleniyor]      = useState(true)

  // Yatırımlar, ortak hareketler, bilanço ve kasa özeti: sadece bir kez yükle
  useEffect(() => {
    Promise.allSettled([yatirimlariGetir(), ortaklariGetir(), bilancoListele(), kasaOzeti()])
      .then(([yRes, oRes, bRes, kRes]) => {
        if (yRes.status === 'fulfilled' && yRes.value.data.basarili)
          setYatirimlar(yRes.value.data.veri.yatirimlar ?? [])
        if (oRes.status === 'fulfilled' && oRes.value.data.basarili)
          setOrtakHareketler(oRes.value.data.veri.ortaklar ?? [])
        if (bRes.status === 'fulfilled' && bRes.value.data.basarili)
          setKapanislar(bRes.value.data.veri.kapanislar ?? [])
        if (kRes.status === 'fulfilled' && kRes.value.data.basarili)
          setKasaOzet(kRes.value.data.veri)
      })
  }, [])

  // Kapanışlar değiştiğinde kasa özetini yeniden çek (kalibrasyon güncellenir)
  const [ilkYukleme, setIlkYukleme] = useState(true)
  useEffect(() => {
    if (ilkYukleme) { setIlkYukleme(false); return }
    kasaOzeti().then(res => {
      if (res.data.basarili) setKasaOzet(res.data.veri)
    }).catch(() => {})
  }, [kapanislar])

  // Kasa hareketleri: seçili ay/yıl değiştiğinde yeniden çek
  useEffect(() => {
    const params = { adet: 500 }
    if (!tumZamanlar) {
      const ay  = String(secilenAy).padStart(2, '0')
      const son = new Date(secilenYil, secilenAy, 0).getDate()
      params.baslangic_tarihi = `${secilenYil}-${ay}-01`
      params.bitis_tarihi = `${secilenYil}-${ay}-${String(son).padStart(2, '0')}`
    }
    setYukleniyor(true)
    hareketleriGetir(params)
      .then(res => {
        if (res.data.basarili) {
          setHareketler(res.data.veri.hareketler ?? [])
          setGecmisKisitli(res.data.veri.gecmis_kisitli === true)
        }
      })
      .catch(() => toast.error('Hareketler yüklenemedi.'))
      .finally(() => setYukleniyor(false))
  }, [secilenAy, secilenYil, tumZamanlar])

  const yatirimGuncelDeger = yatirimlar
    .filter(y => y.guncel_fiyat !== null)
    .reduce((s, y) => s + y.miktar * y.guncel_fiyat, 0)

  return (
    <div className={`${p}-page-root`}>

      {/* ─── Sayfa Başlığı (route'a göre değişir) ─── */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className={`bi ${sayfa.ikon}`} />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>{sayfa.baslik}</h1>
            <p className={`${p}-page-sub`}>{sayfa.alt}</p>
          </div>
        </div>
      </div>

      {yukleniyor ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className={`${p}-kasa-spinner`} />
        </div>
      ) : (
      <>
        {/* ─── Sekme İçerikleri (URL tabanlı) ─── */}
        {aktifSekme === 'gosterge' && <GostergePaneli hareketler={hareketler} kapanislar={kapanislar} yatirimGuncelDeger={yatirimGuncelDeger} secilenAy={secilenAy} secilenYil={secilenYil} p={p} renkler={renkler} kasaOzet={kasaOzet} />}
        {aktifSekme === 'bilanco'  && <div data-tur="aylik-bilanco"><AylikBilanco kapanislar={kapanislar} setKapanislar={setKapanislar} yatirimGuncelDeger={yatirimGuncelDeger} bankaBakiye={kasaOzet?.banka_bakiye ?? 0} p={p} renkler={renkler} /></div>}
        {aktifSekme === 'ortak'    && <OrtakCarisi ortakHareketler={ortakHareketler} setOrtakHareketler={setOrtakHareketler} p={p} renkler={renkler} />}
        {aktifSekme === 'yatirim'  && <YatirimKalesi yatirimlar={yatirimlar} setYatirimlar={setYatirimlar} p={p} renkler={renkler} />}
      </>
      )}
    </div>
  )
}
