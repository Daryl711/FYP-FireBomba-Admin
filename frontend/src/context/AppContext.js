import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';

const AppContext = createContext(null);
const USER_KEY = 'firebomba_user';
const SETTINGS_KEY = 'firebomba_settings';

export const DEFAULT_SETTINGS = {
  // How often the Sensors and Pump pages re-fetch in the background. 0 = off.
  refreshIntervalSec: 60,
  // Page shown first after logging in.
  defaultTab: 'AdminUsers',
  // UI language: 'en' (English) or 'ms' (Bahasa Malaysia).
  language: 'en',
};

function loadUser() {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {}
  }
  return null;
}

function loadSettings() {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {}
  }
  return DEFAULT_SETTINGS;
}

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => loadUser());
  const [sensorReading, setSensorReading] = useState(null);
  const [settings, setSettingsState] = useState(() => loadSettings());

  const setUser = (u) => {
    if (Platform.OS === 'web') {
      try {
        if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
        else localStorage.removeItem(USER_KEY);
      } catch {}
    }
    setUserState(u);
  };

  const updateSettings = (patch) => {
    setSettingsState((prev) => {
      // Reset (patch = null) keeps the chosen language so the admin isn't
      // suddenly switched to a language they may not read.
      const next = patch
        ? { ...prev, ...patch }
        : { ...DEFAULT_SETTINGS, language: prev.language };
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{ user, setUser, sensorReading, setSensorReading, settings, updateSettings }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
