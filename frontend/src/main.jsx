import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'
import { capacitorBaslat } from './lib/capacitorInit.js'

// Native platform entegrasyonu tamamlandıktan sonra React başlar
// (window.__statusBarSetLight/Dark hazır olsun — splash sırasında beklenir)
async function uygulama() {
  await capacitorBaslat()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
      {/* Toast bildirimleri — tüm uygulama genelinde */}
      <Toaster
        position="top-center"
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
