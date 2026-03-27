/**
 * ParamGo — Plan Kontrol Hook
 *
 * Kullanıcının planına göre özellik erişimini kontrol eder.
 *
 * Kullanım:
 *   const { izinVarMi, plan, planAdi } = usePlanKontrol()
 *   if (!izinVarMi('pdf_rapor')) { ... }
 */

import useAuthStore from '../stores/authStore'

const IZINLER = {
  pdf_rapor:          ['standart', 'kurumsal'],
  excel_rapor:        ['standart', 'kurumsal'],
  veri_aktarma:       ['standart', 'kurumsal'],
  cok_kullanici:      ['standart', 'kurumsal'],
  whatsapp_destek:    ['standart', 'kurumsal'],
  gelismis_raporlama: ['kurumsal'],
  ozel_entegrasyon:   ['kurumsal'],
  sirket_yetkilendirme: ['kurumsal'],
  oncelikli_destek:   ['kurumsal'],
}

const PLAN_ADLARI = {
  ucretsiz: 'Ücretsiz',
  standart:  'Standart',
  kurumsal:  'Kurumsal',
}

export function usePlanKontrol() {
  const { kullanici } = useAuthStore()
  const plan = kullanici?.plan || 'ucretsiz'
  const planAdi = PLAN_ADLARI[plan] || 'Ücretsiz'

  /**
   * Belirtilen özelliğe erişim var mı?
   * @param {string} ozellik - 'pdf_rapor' | 'excel_rapor' | 'veri_aktarma' | 'cok_kullanici' | 'yapay_zeka' | 'api_erisim'
   * @returns {boolean}
   */
  const izinVarMi = (ozellik) => {
    if (!IZINLER[ozellik]) return false // Tanımsız özellik → güvenli varsayılan: erişim yok
    return IZINLER[ozellik].includes(plan)
  }

  /**
   * Hangi planlardan itibaren bu özellik açılıyor?
   * Hata mesajı ve modal için kullanılır.
   */
  const gerekliPlan = (ozellik) => {
    const planlar = IZINLER[ozellik] || []
    if (planlar.includes('standart')) return 'Standart'
    if (planlar.includes('kurumsal')) return 'Kurumsal'
    return null
  }

  return { plan, planAdi, izinVarMi, gerekliPlan }
}
