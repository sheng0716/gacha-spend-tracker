import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AntdProvider from './components/AntdProvider'
import { initTheme } from './lib/theme'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AntdProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AntdProvider>
  </StrictMode>,
)
