import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { ToastProvider } from '@/components/ui'
import App from '@/App'
import '@/index.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found in index.html')
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
)