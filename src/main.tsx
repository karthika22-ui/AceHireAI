import React from 'react'
import ReactDOMClient from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { registerHasHireServiceWorker } from './utils/webPushHelper'

// Register Service Worker for mobile web push support
if (typeof window !== 'undefined') {
  registerHasHireServiceWorker();
}

ReactDOMClient.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
