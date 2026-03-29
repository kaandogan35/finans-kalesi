/**
 * RaporlarEkrani.jsx — Raporlama Ana Sayfası
 * Tab navigasyonlu 5 rapor tipi + rapor geçmişi
 * Tema: ParamGo v2 — rpr- prefix
 */

import { useState } from 'react'
import CariYaslandirma from './CariYaslandirma'
import NakitAkis from './NakitAkis'
import CekPortfoy from './CekPortfoy'
import OdemeOzet from './OdemeOzet'
import GenelOzet from './GenelOzet'
import RaporGecmisi from './RaporGecmisi'

const p = 'p'

const TABLAR = [
  { id: 'genel',       ikon: 'bi-bar-chart-line-fill',       etiket: 'Genel Özet'          },
  { id: 'cari',        ikon: 'bi-people-fill',               etiket: 'Alacak Durumu'       },
  { id: 'nakit',       ikon: 'bi-graph-up-arrow',            etiket: 'Para Akışım'         },
  { id: 'cek',         ikon: 'bi-file-earmark-text-fill',    etiket: 'Çek & Senet Durumu'  },
  { id: 'odeme',       ikon: 'bi-credit-card-2-front-fill',  etiket: 'Tahsilat Özeti'      },
  { id: 'gecmis',      ikon: 'bi-clock-history',             etiket: 'Rapor Geçmişi'       },
]

export default function RaporlarEkrani() {
  const [aktifTab, setAktifTab] = useState('genel')

  return (
    <div className={`${p}-page-root`}>
      {/* ── Sayfa Header ─────────────────────────────────── */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-bar-chart-line-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>Raporlar</h1>
            <p className={`${p}-page-sub`}>Finansal verilerinizi analiz edin, grafik ve tablo olarak görüntüleyin</p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigasyon ───────────────────────────────── */}
      <div className={`${p}-rpr-tab-bar`}>
        <div className={`${p}-rpr-tab-scroll`}>
          {TABLAR.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${p}-rpr-tab-btn${aktifTab === tab.id ? ` ${p}-rpr-tab-active` : ''}`}
              onClick={() => setAktifTab(tab.id)}
            >
              <i className={`bi ${tab.ikon}`} />
              <span>{tab.etiket}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab İçeriği ──────────────────────────────────── */}
      <div className={`${p}-rpr-tab-content`}>
        {aktifTab === 'genel'  && <GenelOzet />}
        {aktifTab === 'cari'   && <CariYaslandirma />}
        {aktifTab === 'nakit'  && <NakitAkis />}
        {aktifTab === 'cek'    && <CekPortfoy />}
        {aktifTab === 'odeme'  && <OdemeOzet />}
        {aktifTab === 'gecmis' && <RaporGecmisi />}
      </div>

    </div>
  )
}
