import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';

const AppContext = createContext(null);
const USER_KEY = 'firebomba_user';

function loadUser() {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {}
  }
  return null;
}

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => loadUser());
  const [sensorReading, setSensorReading] = useState(null);

  const setUser = (u) => {
    if (Platform.OS === 'web') {
      try {
        if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
        else localStorage.removeItem(USER_KEY);
      } catch {}
    }
    setUserState(u);
  };

  return (
    <AppContext.Provider value={{ user, setUser, sensorReading, setSensorReading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
