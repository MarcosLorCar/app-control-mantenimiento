import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { setupPWA } from './pwa'
import 'leaflet/dist/leaflet.css'
import './index.css'

setupPWA()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
