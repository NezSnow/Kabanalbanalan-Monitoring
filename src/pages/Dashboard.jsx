import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import App from '../App'
import ConfirmDialog from '../components/ConfirmDialog'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  function requestLogout() {
    setConfirmOpen(true)
  }

  async function handleLogoutConfirm() {
    setBusy(true)
    try {
      await supabase.auth.signOut()
    } finally {
      localStorage.removeItem('user')
      localStorage.removeItem('role')
      setBusy(false)
      setConfirmOpen(false)
      navigate('/')
    }
  }

  function handleLogoutCancel() {
    if (busy) return
    setConfirmOpen(false)
  }

  return (
    <>
      <App onLogout={requestLogout} />
      <ConfirmDialog
        open={confirmOpen}
        title="Logout"
        message="Do you want to log out?"
        confirmLabel="Yes"
        cancelLabel="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        danger
        busy={busy}
      />
    </>
  )
}
