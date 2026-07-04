import { useEffect, useState } from 'react'
import { api } from '../services/api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buf = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return buf
}

type State = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'idle'

interface Props {
  caseCode: string
}

export function PushSubscriptionButton({ caseCode }: Props) {
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : 'idle')
      })
    }).catch(() => setState('unsupported'))
  }, [])

  async function subscribe() {
    if (!VAPID_PUBLIC_KEY) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
      })
      await api.savePushSubscription(caseCode, sub.toJSON() as PushSubscriptionJSON)
      setState('subscribed')
    } catch (e) {
      console.error('Push subscription failed:', e)
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading' || state === 'unsupported') return null
  if (state === 'denied') {
    return (
      <p className="text-xs text-gray-400 text-center">
        Notifications blocked in browser settings.
      </p>
    )
  }
  if (state === 'subscribed') {
    return (
      <p className="text-xs text-green-600 text-center">
        Notifications enabled for this case.
      </p>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={busy}
      className="w-full border border-brand text-brand text-sm font-medium rounded-xl py-2.5 hover:bg-brand/5 transition-colors disabled:opacity-40"
    >
      {busy ? 'Enabling…' : 'Enable Notifications'}
    </button>
  )
}
