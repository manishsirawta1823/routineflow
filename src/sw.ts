/// <reference lib="webworker" />
// RoutineFlow service worker (injectManifest strategy).
// Precaches the app shell and handles Web Push + notification clicks.
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> }

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
self.skipWaiting()
clientsClaim()

interface PushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = {}
  try {
    data = event.data ? (event.data.json() as PushPayload) : {}
  } catch {
    data = { body: event.data?.text() }
  }
  const title = data.title ?? 'Rozy'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body ?? '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: data.tag,
      data: { url: data.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string })?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          ;(client as WindowClient).navigate(url)
          return (client as WindowClient).focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
