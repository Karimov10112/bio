import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../utils/translations';

export interface BloodSugarRecord {
  id: string;
  date: string;
  fastingLevel: number;
  postMealLevel: number;
  notes: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  records: BloodSugarRecord[];
  addRecord: (record: Omit<BloodSugarRecord, 'id'>) => void;
  currentFasting: number | undefined;
  currentPostMeal: number | undefined;
  setCurrentFasting: (value: number | undefined) => void;
  setCurrentPostMeal: (value: number | undefined) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'uz';
  });

  const [records, setRecords] = useState<BloodSugarRecord[]>(() => {
    const saved = localStorage.getItem('bloodSugarRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentFasting, setCurrentFasting] = useState<number | undefined>();
  const [currentPostMeal, setCurrentPostMeal] = useState<number | undefined>();

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('bloodSugarRecords', JSON.stringify(records));
  }, [records]);

  const addRecord = (record: Omit<BloodSugarRecord, 'id'>) => {
    const newRecord: BloodSugarRecord = {
      ...record,
      id: Date.now().toString(),
    };
    setRecords(prev => [newRecord, ...prev]);
    
    // Update current values
    setCurrentFasting(record.fastingLevel);
    setCurrentPostMeal(record.postMealLevel);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        records,
        addRecord,
        currentFasting,
        currentPostMeal,
        setCurrentFasting,
        setCurrentPostMeal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
