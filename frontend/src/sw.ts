/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  const data = event.data.json() as { title?: string; body?: string; case_code?: string }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'NavyaSathi', {
      body: data.body ?? 'You have a new case update.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { case_code: data.case_code },
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const code = (event.notification.data as { case_code?: string } | null)?.case_code
  event.waitUntil(
    self.clients.openWindow(code ? `/case/${code}` : '/')
  )
})
