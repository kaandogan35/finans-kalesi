import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'
import CenterAlert from './components/ui/CenterAlert.jsx'
import { capacitorBaslat } from './lib/capacitorInit.js'

async function uygulama() {
  await capacitorBaslat()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
      <CenterAlert />
    </StrictMode>
  )
}

uygulama()
