'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
type TextSize = 'small' | 'medium' | 'large';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  textSizeClass: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const TEXT_SIZE_CLASSES: Record<TextSize, string> = {
  small: 'text-size-small',
  medium: 'text-size-medium',
  large: 'text-size-large',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [textSize, setTextSizeState] = useState<TextSize>('medium');
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const savedTextSize = localStorage.getItem('textSize') as TextSize | null;
    
    if (savedTheme) setThemeState(savedTheme);
    if (savedTextSize) setTextSizeState(savedTextSize);
  }, []);

  // Resolve theme based on system preference
  useEffect(() => {
    if (!mounted) return;

    const updateResolvedTheme = () => {
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(systemDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme, mounted]);

  // Apply text size class to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    // Remove all text size classes
    Object.values(TEXT_SIZE_CLASSES).forEach(cls => root.classList.remove(cls));
    // Add current text size class
    root.classList.add(TEXT_SIZE_CLASSES[textSize]);
  }, [textSize, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  const setTextSize = useCallback((newSize: TextSize) => {
    setTextSizeState(newSize);
    localStorage.setItem('textSize', newSize);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <SettingsContext.Provider
        value={{
          theme: 'system',
          setTheme: () => {},
          resolvedTheme: 'light',
          textSize: 'medium',
          setTextSize: () => {},
          textSizeClass: TEXT_SIZE_CLASSES.medium,
        }}
      >
        {children}
      </SettingsContext.Provider>
    );
  }

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        textSize,
        setTextSize,
        textSizeClass: TEXT_SIZE_CLASSES[textSize],
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
