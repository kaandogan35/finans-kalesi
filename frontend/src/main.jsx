import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* Toast bildirimleri — tüm uygulama genelinde */}
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '13px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        },
      }}
      richColors
    />
  </StrictMode>
)
