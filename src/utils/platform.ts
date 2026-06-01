export type Platform = 'web' | 'capacitor' | 'desktop' | 'unknown'

export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop'
  // @ts-expect-error Capacitor global
  if (typeof window.Capacitor !== 'undefined') return 'capacitor'
  // @ts-expect-error Tauri global
  if (typeof window.__TAURI__ !== 'undefined') return 'desktop'
  return 'web'
}
