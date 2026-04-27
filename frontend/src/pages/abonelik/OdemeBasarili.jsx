/**
 * iyzico ödeme sonrası dönüş sayfası
 *
 * Akış:
 *   1. iyzico kullanıcıyı buraya yönlendirir (query: ?plan=standart&donem=aylik)
 *   2. Birkaç saniye bekleriz (webhook'un plan'ı aktifleştirmesi için)
 *   3. /api/abonelik/durum çağırıp planı JWT'ye yansıtırız
 *   4. Kullanıcıyı Ayarlar/Abonelik sayfasına yönlendiririz
 */

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { abonelikApi } from '../../api/abonelik'
import { bildirim as toast } from '../../components/ui/CenterAlert'

export default function OdemeBasarili() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [durum, setDurum] = useState('kontrol')  // kontrol | basarili | basarisiz

  const plan  = params.get('plan')
  const donem = params.get('donem')

  useEffect(() => {
    let iptal = false

    const kontrol = async () => {
      // Webhook'un gelip plan'ı aktifleştirmesi için 5 sn bekle
      await new Promise(r => setTimeout(r, 5000))

      for (let i = 0; i < 5; i++) {
        if (iptal) return
        try {
          const res = await abonelikApi.durum()
          const aktifPlan = res?.data?.veri?.plan
          if (aktifPlan && aktifPlan !== 'deneme') {
            if (iptal) return
            setDurum('basarili')
            toast.success('Aboneliğiniz aktifleştirildi!')
            setTimeout(() => navigate('/ayarlar/abonelik'), 1500)
            return
          }
        } catch {
          // sessiz
        }
        await new Promise(r => setTimeout(r, 3000))
      }
      if (!iptal) setDurum('basarisiz')
    }

    kontrol()
    return () => { iptal = true }
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: '#F8F9FA',
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      }}>
        {durum === 'kontrol' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              <span className="spinner-border" style={{ color: '#10B981', width: 48, height: 48 }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              Aboneliğiniz Aktifleştiriliyor
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 0 }}>
              Ödemeniz alındı. Plan bilgileriniz birkaç saniye içinde güncellenecek.
            </p>
            {plan && (
              <p style={{ fontSize: 13, color: '#059669', marginTop: 12, fontWeight: 600 }}>
                {plan === 'kurumsal' ? 'Kurumsal' : 'Standart'} • {donem === 'yillik' ? 'Yıllık' : 'Aylık'}
              </p>
            )}
          </>
        )}

        {durum === 'basarili' && (
          <>
            <div style={{
              fontSize: 60,
              color: '#10B981',
              marginBottom: 16,
            }}>
              <i className="bi bi-check-circle-fill" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              Hoş geldiniz!
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              Aboneliğiniz aktifleştirildi. Yönlendiriliyorsunuz...
            </p>
          </>
        )}

        {durum === 'basarisiz' && (
          <>
            <div style={{
              fontSize: 60,
              color: '#F59E0B',
              marginBottom: 16,
            }}>
              <i className="bi bi-exclamation-triangle-fill" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              Ödeme Alındı, Plan Güncelleniyor
            </h2>
            <p style={{ fontSize: 13.5, color: '#6B7280', marginBottom: 18, lineHeight: 1.6 }}>
              Ödemeniz başarıyla alındı ancak plan aktivasyonu birkaç dakika sürebilir.
              Sayfayı yenileyerek kontrol edebilir veya destek ile iletişime geçebilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => navigate('/ayarlar/abonelik')}
              className="p-btn-save p-btn-save-green"
              style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700 }}
            >
              Aboneliğim Sayfasına Git
            </button>
          </>
        )}
      </div>
    </div>
  )
}
