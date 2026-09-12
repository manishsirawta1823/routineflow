import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

export const isPushConfigured = () => Boolean(VAPID_PUBLIC_KEY)

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return Boolean(sub)
}

/** Ask permission, subscribe, and store the subscription for this user. */
export async function subscribeToPush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: 'Push not supported on this device/browser.' }
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'Push not configured (missing VAPID key).' }
  if (!supabase) return { ok: false, reason: 'Cloud not connected.' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'Notification permission denied.' }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
    })
  }

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      keys: json.keys ?? {},
    },
    { onConflict: 'user_id,endpoint' },
  )
  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!isPushSupported() || !supabase) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}
