import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { Capacitor } from '@capacitor/core'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'
import { capacitorBaslat } from './lib/capacitorInit.js'

// env(safe-area-inset-top) değerini JS'te oku
function getSafeAreaTop() {
  const el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.paddingTop = 'env(safe-area-inset-top, 0px)'
  el.style.visibility = 'hidden'
  document.body.appendChild(el)
  const val = parseFloat(getComputedStyle(el).paddingTop) || 0
  document.body.removeChild(el)
  return val
}

// Native platform entegrasyonu tamamlandıktan sonra React başlar
async function uygulama() {
  await capacitorBaslat()

  // iOS'ta toast status bar altında çıksın
  const toastOffset = Capacitor.isNativePlatform()
    ? Math.max(getSafeAreaTop() + 10, 16)
    : 16

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
      <Toaster
        position="top-center"
        offset={toastOffset}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '14px',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '14px 18px',
          },
        }}
        richColors
      />
    </StrictMode>
  )
}

uygulama()
