/**
 * pdfExport.js — Ortak PDF export yardimci fonksiyonu
 * Tum rapor dosyalarindaki tekrar eden PDF header kodunu birlestir
 */

import { toast } from 'sonner'

const PDF_LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="pg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs>
  <rect width="120" height="120" rx="28" fill="url(#pg)"/>
  <path d="M38 88V36H62C70.837 36 78 43.163 78 52C78 60.837 70.837 68 62 68H38" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M68 62L82 48M82 48L68 34M82 48H56" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
</svg>`

/**
 * PDF indir — ortak fonksiyon
 * @param {string} elementId - PDF'e donusturulecek HTML element ID'si
 * @param {string} raporBaslik - Rapor basligi (orn: "Nakit Akis Raporu")
 * @param {string} dosyaAdi - Dosya adi prefix (orn: "nakit_akis")
 * @param {'portrait'|'landscape'} yonelim - Sayfa yonelimi
 */
export async function pdfIndir(elementId, raporBaslik, dosyaAdi, yonelim = 'landscape') {
  const html2pdf = (await import('html2pdf.js')).default
  const el = document.getElementById(elementId)
  if (!el) return

  toast.info('PDF hazirlaniyor\u2026')

  const wrapper = document.createElement('div')
  wrapper.innerHTML = `
    <div style="padding:20px;font-family:Arial,sans-serif">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        ${PDF_LOGO_SVG}
        <div>
          <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-weight:800;font-size:18px;color:#1A1A1A;letter-spacing:-0.04em">Param<span style="color:#10B981;font-weight:700">Go</span></div>
        </div>
      </div>
      <h2 style="color:#10B981;margin:12px 0 4px">${raporBaslik}</h2>
      <p style="color:#6B7280;font-size:12px;margin-bottom:16px">${new Date().toLocaleDateString('tr-TR')} tarihli rapor</p>
      ${el.outerHTML}
    </div>`

  document.body.appendChild(wrapper)
  try {
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `${dosyaAdi}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: yonelim },
    }).from(wrapper).save()
    toast.success('PDF indirildi')
  } catch {
    toast.error('PDF olusturulamadi')
  } finally {
    document.body.removeChild(wrapper)
  }
}
