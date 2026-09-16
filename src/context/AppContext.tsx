import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { StudentProfile, AppSettings } from '@/types'
import { getActiveProfiles, ensureDefaultSettings, saveSettings } from '@/services/dataService'
import { db } from '@/db'

type Theme = 'light' | 'dark' | 'system'

interface AppContextValue {
  profile: StudentProfile | null
  setProfile: (p: StudentProfile | null) => void
  profiles: StudentProfile[]
  settings: AppSettings | null
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  theme: Theme
  setTheme: (t: Theme) => void
  installPrompt: () => Promise<boolean>
  offline: boolean
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<StudentProfile | null>(null)
  const [profiles, setProfiles] = useState<StudentProfile[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [theme, setThemeState] = useState<Theme>('system')
  const [offline, setOffline] = useState(!navigator.onLine)
  const [pendingPrompt, setPrompt] = useState<(() => Promise<boolean>) | null>(null)

  useEffect(() => {
    const onLine = () => setOffline(false)
    const offLine = () => setOffline(true)
    window.addEventListener('online', onLine)
    window.addEventListener('offline', offLine)
    return () => {
      window.removeEventListener('online', onLine)
      window.removeEventListener('offline', offLine)
    }
  }, [])

  async function refresh() {
    const all = await getActiveProfiles()
    setProfiles(all)
    const saved = localStorage.getItem('griet-active-profile')
    const active = all.find((p) => p.id === saved) ?? all[0] ?? null
    if (active) {
      setProfileState(active)
      const s = await ensureDefaultSettings(active.id)
      setSettings(s)
    } else {
      // Preserve theme from saved settings if available
      try {
        const stored = localStorage.getItem('griet-theme')
        if (stored === 'light' || stored === 'dark' || stored === 'system') setThemeState(stored)
      } catch { /* ignore */ }
      setProfileState(null)
      setSettings(null)
    }
  }

  useEffect(() => {
    refresh().catch(() => {
      // DB issues silently fall back to no-profile
    })
  }, [])

  // Apply theme
  const appliedTheme = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', appliedTheme === 'dark')
    document.documentElement.style.colorScheme = appliedTheme
    localStorage.setItem('griet-theme', theme)
  }, [appliedTheme, theme])

  useEffect(() => {
    if (settings?.theme) {
      setThemeState(settings.theme)
    }
  }, [settings?.theme])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        setPrompt(() => async () => {
          try {
            const promptEvent = e as unknown as { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> }
            await promptEvent.prompt()
            return (await promptEvent.userChoice)?.outcome === 'accepted'
          } catch {
            return false
          }
        })
      })
    }
  }, [])

  const setProfile = (p: StudentProfile | null) => {
    setProfileState(p)
    if (p) localStorage.setItem('griet-active-profile', p.id)
    else localStorage.removeItem('griet-active-profile')
  }

  async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
    if (!profile) return
    const current = settings ?? (await ensureDefaultSettings(profile.id))
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
    await saveSettings(next)
    setSettings(next)
  }

  const installPrompt = async () => {
    if (pendingPrompt) {
      const ok = await pendingPrompt()
      setPrompt(null)
      return ok
    }
    return false
  }

  return (
    <AppContext.Provider
      value={{ profile, setProfile, profiles, settings, updateSettings, theme, setTheme: setThemeState, installPrompt, offline, refresh }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function useProfileId(): string | null {
  return useApp().profile?.id ?? null
}

export { db }