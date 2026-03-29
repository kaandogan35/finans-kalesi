/**
 * KvkkOnay — KVKK İlk Açılış Onay Ekranı
 *
 * Görev:
 *   Native Capacitor uygulamasında ilk açılışta KVKK/Gizlilik onayı alır.
 *   Onay @capacitor/preferences'a kaydedilir — bir daha gösterilmez.
 *
 *   Web (tarayıcı) ortamında gösterilmez.
 *
 * App Store / Play Store zorunluluğu:
 *   - Apple Guideline 5.1.1: Veri toplama öncesi açık kullanıcı onayı
 *   - KVKK Madde 5: İşleme öncesi açık rıza zorunlu
 */

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const KVKK_ONAY_ANAHTARI = 'kvkk_onaylandi_v1'

export default function KvkkOnay({ children }) {
  const [kontrol, setKontrol] = useState(false) // Preferences kontrol edildi mi?
  const [goster, setGoster] = useState(false)   // Ekranı göster?
  const [onay1, setOnay1] = useState(false)      // Gizlilik politikası onayı
  const [onay2, setOnay2] = useState(false)      // Açık rıza beyanı

  const nativeMi = Capacitor.isNativePlatform()

  useEffect(() => {
    if (!nativeMi) {
      setKontrol(true)
      return
    }
    ;(async () => {
      const { value } = await Preferences.get({ key: KVKK_ONAY_ANAHTARI })
      if (!value) {
        setGoster(true)
      }
      setKontrol(true)
    })()
  }, [nativeMi])

  async function onayla() {
    await Preferences.set({
      key: KVKK_ONAY_ANAHTARI,
      value: JSON.stringify({ tarih: new Date().toISOString(), versiyon: 1 }),
    })
    setGoster(false)
  }

  async function reddet() {
    // Uygulamayı kapat — onay olmadan kullanılamaz
    const { App } = await import('@capacitor/app')
    App.exitApp()
  }

  // Preferences kontrol edilmeden hiçbir şey render etme (flash önleme)
  if (!kontrol) return null

  // Onay gerekmiyorsa direkt içeriği göster
  if (!goster) return children

  const onaylandi = onay1 && onay2

  return (
    <div className="p-kvkk-overlay">
      {/* Başlık */}
      <div className="p-kvkk-header">
        <div className="p-kvkk-header-ikon">
          <i className="bi bi-shield-check" />
        </div>
        <p className="p-kvkk-baslik">Gizlilik ve Veri Politikası</p>
        <p className="p-kvkk-altyazi">
          ParamGo'yu kullanmadan önce lütfen<br />
          aşağıdaki bilgileri okuyun
        </p>
      </div>

      {/* İçerik — kaydırılabilir */}
      <div className="p-kvkk-icerik">

        <div className="p-kvkk-madde">
          <div className="p-kvkk-madde-baslik">
            <div className="p-kvkk-madde-ikon"><i className="bi bi-person-badge" /></div>
            Toplanan Veriler
          </div>
          <p className="p-kvkk-madde-metin">
            Ad-soyad, e-posta adresi ve uygulama içinde girdiğiniz finansal veriler (gelir, gider, cari bakiye). Kişisel finansal verileriniz üçüncü taraflarla paylaşılmaz.
          </p>
        </div>

        <div className="p-kvkk-madde">
          <div className="p-kvkk-madde-baslik">
            <div className="p-kvkk-madde-ikon"><i className="bi bi-lock" /></div>
            Verileriniz Nasıl Korunur?
          </div>
          <p className="p-kvkk-madde-metin">
            Tüm veriler AES-256-GCM şifreleme ile saklanır. Tokenlarınız cihazınızın güvenli depolama alanında (iOS Keychain / Android EncryptedSharedPreferences) tutulur.
          </p>
        </div>

        <div className="p-kvkk-madde">
          <div className="p-kvkk-madde-baslik">
            <div className="p-kvkk-madde-ikon"><i className="bi bi-bell" /></div>
            Bildirimler
          </div>
          <p className="p-kvkk-madde-metin">
            İzin vermeniz halinde vade hatırlatmaları ve önemli işlem bildirimleri gönderilebilir. Bildirimleri istediğiniz zaman kapatabilirsiniz.
          </p>
        </div>

        <div className="p-kvkk-madde">
          <div className="p-kvkk-madde-baslik">
            <div className="p-kvkk-madde-ikon"><i className="bi bi-trash3" /></div>
            Hesap Silme
          </div>
          <p className="p-kvkk-madde-metin">
            Hesabınızı ve tüm verilerinizi istediğiniz zaman Güvenlik → Hesabım bölümünden kalıcı olarak silebilirsiniz.
          </p>
        </div>

        <div className="p-kvkk-madde">
          <div className="p-kvkk-madde-baslik">
            <div className="p-kvkk-madde-ikon"><i className="bi bi-building" /></div>
            Veri Sorumlusu
          </div>
          <p className="p-kvkk-madde-metin">
            ParamGo — info@paramgo.com — paramgo.com/gizlilik adresinde güncel gizlilik politikamıza ulaşabilirsiniz.
          </p>
        </div>

        {/* Alt boşluk */}
        <div style={{ height: 8 }} />
      </div>

      {/* Alt çubuk — onay kutuları ve buton */}
      <div className="p-kvkk-footer">

        <div className="p-kvkk-onay-satir">
          <input
            type="checkbox"
            id="kvkk-onay1"
            checked={onay1}
            onChange={(e) => setOnay1(e.target.checked)}
          />
          <label className="p-kvkk-onay-metin" htmlFor="kvkk-onay1">
            <a href="https://paramgo.com/gizlilik" target="_blank" rel="noreferrer">
              Gizlilik Politikası
            </a>{'ı '}
            ve{' '}
            <a href="https://paramgo.com/kullanim-sartlari" target="_blank" rel="noreferrer">
              Kullanım Şartları
            </a>
            'nı okudum, kabul ediyorum.
          </label>
        </div>

        <div className="p-kvkk-onay-satir">
          <input
            type="checkbox"
            id="kvkk-onay2"
            checked={onay2}
            onChange={(e) => setOnay2(e.target.checked)}
          />
          <label className="p-kvkk-onay-metin" htmlFor="kvkk-onay2">
            Kişisel verilerimin yukarıda açıklanan amaçlarla işlenmesine{' '}
            <strong>açık rıza</strong> veriyorum. (KVKK Madde 5)
          </label>
        </div>

        <button
          className="p-kvkk-onay-btn"
          onClick={onayla}
          disabled={!onaylandi}
        >
          Kabul Ediyorum — Uygulamaya Geç
        </button>

        <button className="p-kvkk-red-btn" onClick={reddet}>
          Kabul etmiyorum — Uygulamayı kapat
        </button>
      </div>
    </div>
  )
}
