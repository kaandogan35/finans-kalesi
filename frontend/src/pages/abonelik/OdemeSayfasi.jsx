/**
 * iyzico Ödeme Sayfası
 *
 * Backend'ten gelen form_content (iyzico iframe scripti) bu sayfada render edilir.
 * PaywallModal veya PlanSecim'den sessionStorage'a yazılan veri okunur.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OdemeSayfasi() {
  const navigate = useNavigate()
  const kapsayici = useRef(null)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    const formContent = sessionStorage.getItem('iyzico_form_content')
    if (!formContent) {
      setHata('Ödeme oturumu bulunamadı. Lütfen planı tekrar seçin.')
      return
    }

    // Temizle
    sessionStorage.removeItem('iyzico_form_content')

    // Form içeriğini DOM'a ekle
    if (kapsayici.current) {
      kapsayici.current.innerHTML = formContent

      // innerHTML ile eklenen <script> tag'leri otomatik çalışmaz — manuel çalıştır
      const scriptler = kapsayici.current.querySelectorAll('script')
      scriptler.forEach((eskiScript) => {
        const yeniScript = document.createElement('script')
        if (eskiScript.src) {
          yeniScript.src = eskiScript.src
        } else {
          yeniScript.textContent = eskiScript.textContent
        }
        if (eskiScript.type) yeniScript.type = eskiScript.type
        eskiScript.parentNode.replaceChild(yeniScript, eskiScript)
      })
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F9FA',
      padding: '20px 12px',
    }}>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 16,
        padding: '20px 16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
      }}>

        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
            Güvenli Ödeme
          </h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            iyzico güvenli ödeme altyapısı ile tamamlayın
          </p>
        </div>

        {hata ? (
          <div style={{
            padding: 20,
            textAlign: 'center',
            color: '#991B1B',
            background: '#FEE2E2',
            borderRadius: 12,
          }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>{hata}</div>
            <button
              type="button"
              onClick={() => navigate('/abonelik')}
              style={{
                marginTop: 16,
                padding: '10px 20px',
                background: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Plan Seçimine Dön
            </button>
          </div>
        ) : (
          <div ref={kapsayici} id="iyzipay-checkout-form" className="responsive" />
        )}

      </div>
    </div>
  )
}
