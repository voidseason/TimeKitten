import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Theme } from '@shared/theme/types'
import { getThemeById, defaultThemeId, themes } from '@shared/theme/themes'
import { applyThemeToDocument } from '@shared/theme/applyTheme'

interface ThemeContextValue {
  theme: Theme
  themeId: string
  setThemeId: (id: string) => void
  available: Theme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'timekitten.themeId'

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [themeId, setThemeIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? defaultThemeId
  })

  const theme = useMemo(() => getThemeById(themeId), [themeId])

  useEffect(() => {
    applyThemeToDocument(theme)
    localStorage.setItem(STORAGE_KEY, theme.id)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeId,
      setThemeId: setThemeIdState,
      available: themes
    }),
    [theme, themeId]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}
