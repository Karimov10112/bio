import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { translations, Language } from './utils/translations';
import { DailyJournal } from './components/DailyJournal';
import { Products } from './components/Products';
import { Statistics } from './components/Statistics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Moon, Sun, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { language, setLanguage } = useApp();
  const { theme, toggleTheme } = useTheme();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('journal');

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 transition-colors duration-300">
      <Toaster />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                💙
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {language === 'uz' ? 'Qand Nazorati' : language === 'ru' ? 'Контроль Сахара' : 'Sugar Control'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {language === 'uz' ? 'Qon shakarini kuzatish' : language === 'ru' ? 'Мониторинг сахара в крови' : 'Blood Sugar Monitoring'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative group">
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Globe className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 ${
                        language === lang.code ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="text-sm">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
              >
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div
                      key="moon"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sun"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-lg">
            <TabsTrigger 
              value="journal" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              📝 {t.dailyJournal}
            </TabsTrigger>
            <TabsTrigger 
              value="products"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              🍎 {t.products}
            </TabsTrigger>
            <TabsTrigger 
              value="statistics"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              📊 {t.statistics}
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="journal" className="mt-0">
                <DailyJournal />
              </TabsContent>

              <TabsContent value="products" className="mt-0">
                <Products />
              </TabsContent>

              <TabsContent value="statistics" className="mt-0">
                <Statistics />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            {language === 'uz' 
              ? '© 2026 Qand Nazorati. Barcha huquqlar himoyalangan.' 
              : language === 'ru' 
              ? '© 2026 Контроль Сахара. Все права защищены.' 
              : '© 2026 Sugar Control. All rights reserved.'}
          </p>
          <p className="mt-2 text-xs">
            {language === 'uz' 
              ? 'Bu dastur faqat ma\'lumot berish maqsadida. Tibbiy maslahat uchun shifokorga murojaat qiling.' 
              : language === 'ru' 
              ? 'Это приложение только для информационных целей. Обратитесь к врачу за медицинской консультацией.' 
              : 'This app is for informational purposes only. Consult a doctor for medical advice.'}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
