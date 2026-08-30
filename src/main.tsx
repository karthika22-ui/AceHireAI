import React from 'react'
import ReactDOMClient from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { registerAceHireServiceWorker } from './utils/webPushHelper'

// Register Service Worker for mobile web push support
if (typeof window !== 'undefined') {
  registerAceHireServiceWorker();
}

ReactDOMClient.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
