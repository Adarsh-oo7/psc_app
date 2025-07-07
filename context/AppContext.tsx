import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/lib/apiClient';
import { SWRConfig } from 'swr';
import { useColorScheme } from 'react-native';

// --- Defines ALL values the context will provide ---
interface AppContextType {
  user: any | null;
  isContentCreator: boolean;
  profile: any | null;
  isInstituteOwner: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fetcher: (url: string) => Promise<any>;
  login: (access: string, refresh: string) => Promise<any>;
  logout: () => void;
  examId: string | null;
  setExamId: (id: string | null) => void;
  topicId: string | null;
  setTopicId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isInstituteOwner, setIsInstituteOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemTheme || 'light');
  const [isContentCreator, setIsContentCreator] = useState(false);

  // State for quiz selections
  const [examId, setExamId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('app-theme', newTheme);
  }, [theme]);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('app-theme') as 'light' | 'dark' | null;
      if (savedTheme) setTheme(savedTheme);
    };
    loadTheme();
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUser(null);
    setProfile(null);
    setIsInstituteOwner(false);
  }, []);

  const fetchAndSetUser = useCallback(async () => {
    try {
      const profileData = await fetcher('/auth/profile/');
      setUser(profileData.user || profileData);
      setProfile(profileData);
      setIsInstituteOwner(profileData.is_owner === true);
      setIsContentCreator(profileData.is_content_creator === true);
      return profileData;
    } catch (error) {
      await logout();
      throw error;
    }
  }, [logout]);

  const login = async (access: string, refresh: string) => {
    await AsyncStorage.setItem('access_token', access);
    await AsyncStorage.setItem('refresh_token', refresh);
    return await fetchAndSetUser();
  };

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        try { await fetchAndSetUser(); } catch (e) {}
      }
      setIsLoading(false);
    };
    loadSession();
  }, [fetchAndSetUser]);

  const value: AppContextType = {
    user, profile, isInstituteOwner, isLoading, login, logout, fetcher,isContentCreator,
    theme, toggleTheme, examId, setExamId, topicId, setTopicId,
  };

  return (
    <AppContext.Provider value={value}>
      <SWRConfig value={{ fetcher }}>{children}</SWRConfig>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
