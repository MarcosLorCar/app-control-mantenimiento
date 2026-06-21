import { registerSW } from 'virtual:pwa-register'

function showUpdateToast() {
  if (document.getElementById('pwa-update-toast')) return
  const el = document.createElement('div')
  el.id = 'pwa-update-toast'
  el.textContent = 'Nueva versión disponible. Actualizando…'
  el.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:24px',
    'transform:translateX(-50%)',
    'background:#2563EB',
    'color:#fff',
    'padding:10px 16px',
    'border-radius:9999px',
    'font:600 13px system-ui,-apple-system,sans-serif',
    'box-shadow:0 8px 24px rgba(0,0,0,.25)',
    'z-index:2147483647',
    'pointer-events:none',
  ].join(';')
  document.body.appendChild(el)
}

/**
 * Registers the service worker (registerType: 'autoUpdate'). Because we force an
 * update check on initial load, when the tab regains focus, and periodically,
 * a redeployed build is detected and activated even if the app was fully closed
 * and reopened — the new SW skips waiting + claims clients, which triggers an
 * automatic reload into the fresh version. No manual cache clearing needed.
 */
export function setupPWA() {
  let refreshing = false
  const hasController = !!navigator.serviceWorker?.controller

  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    if (hasController) {
      window.location.reload()
    }
  })

  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      const check = () => registration.update().catch(() => {})
      check()

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })

      // Periodic background check while the app stays open.
      setInterval(check, 60 * 1000)

      // Surface a brief notice when a new version is downloading; autoUpdate
      // reloads on its own once the new SW activates.
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast()
          }
        })
      })
    },
  })
}
