import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { StudentSelfRegister } from './App.jsx'

// Hash-based check (no router, no server rewrite rules needed) --
// gives students a real, shareable link to submit their own project
// details without logging in: yourdomain.com/#register
const isRegisterPath = window.location.hash.replace(/\/+$/, '') === '#register'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isRegisterPath ? <StudentSelfRegister /> : <App />}
  </StrictMode>,
)
