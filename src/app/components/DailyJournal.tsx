import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { AlertCircle, TrendingUp, CheckCircle, Bell, Pill, Syringe, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  type: 'tablet' | 'insulin';
  time: string;
  label: string;
}

export function DailyJournal() {
  const { language, addRecord, setCurrentFasting, setCurrentPostMeal } = useApp();
  const t = translations[language];

  // Mavjud state-lar
  const [fasting, setFasting] = useState('');
  const [postMeal, setPostMeal] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Yangi Eslatmalar qismi uchun state-lar ---
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('sugar_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderType, setNewReminderType] = useState<'tablet' | 'insulin'>('tablet');

  // Eslatmalarni xotiraga saqlash
  useEffect(() => {
    localStorage.setItem('sugar_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Vaqtni tekshirib turish (Notification mantiqi)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      reminders.forEach(r => {
        if (r.time === currentTime) {
          // Brauzer bildirishnomasi
          if (Notification.permission === 'granted') {
            new Notification(r.type === 'tablet' ? "Dori vaqti!" : "Insulin vaqti!", {
              body: `${r.time} bo'ldi. Dorilaringizni qabul qilishni unutmang.`,
              icon: '/logo.png'
            });
          }
          toast.info(`${r.time} - ${r.type === 'tablet' ? "Dori" : "Insulin"} vaqti bo'ldi!`);
        }
      });
    }, 60000); // Har daqiqada tekshiradi

    return () => clearInterval(timer);
  }, [reminders]);

  const addReminder = () => {
    if (!newReminderTime) return;
    
    // Bildirishnomaga ruxsat so'rash
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const newRem: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      type: newReminderType,
      time: newReminderTime,
      label: newReminderType === 'tablet' ? (language === 'uz' ? 'Tabletka' : 'Таблетка') : 'Insulin'
    };

    setReminders([...reminders, newRem].sort((a, b) => a.time.localeCompare(b.time)));
    setNewReminderTime('');
    toast.success(language === 'uz' ? 'Eslatma qo\'shildi' : 'Напоминание добавлено');
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };
  // --- Eslatmalar qismi tugadi ---

  const getAdvice = () => {
    const fastingNum = parseFloat(fasting);
    const postMealNum = parseFloat(postMeal);
    let advice: string[] = [];

    if (!isNaN(fastingNum)) {
      if (fastingNum < 3.9) {
        advice.push(`⚠️ ${t.fastingBloodSugar}: ${t.advice} - Qand darajasi juda past! Tezda shirinlik iste'mol qiling.`);
      } else if (fastingNum <= 5.5) {
        advice.push(`✅ ${t.fastingBloodSugar}: ${t.normalFasting}`);
      } else if (fastingNum <= 6.9) {
        advice.push(`⚠️ ${t.fastingBloodSugar}: ${t.preDiabeticFasting}`);
      } else {
        advice.push(`🚨 ${t.fastingBloodSugar}: ${t.diabeticFasting}`);
      }
    }

    if (!isNaN(postMealNum)) {
      if (postMealNum < 7.8) {
        advice.push(`✅ ${t.postMealBloodSugar}: ${t.normalPostMeal}`);
      } else if (postMealNum <= 11.0) {
        advice.push(`⚠️ ${t.postMealBloodSugar}: ${t.preDiabeticPostMeal}`);
      } else {
        advice.push(`🚨 ${t.postMealBloodSugar}: ${t.diabeticPostMeal}`);
      }
    }
    return advice;
  };

  const handleSave = () => {
    const fastingNum = parseFloat(fasting);
    const postMealNum = parseFloat(postMeal);

    if (!isNaN(fastingNum) && !isNaN(postMealNum)) {
      addRecord({
        date,
        fastingLevel: fastingNum,
        postMealLevel: postMealNum,
        notes,
      });
      setCurrentFasting(fastingNum);
      setCurrentPostMeal(postMealNum);
      setFasting('');
      setPostMeal('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      toast.success(language === 'uz' ? 'Ma\'lumot saqlandi' : 'Данные сохранены');
    }
  };

  const advice = getAdvice();
  const hasValidInput = !isNaN(parseFloat(fasting)) || !isNaN(parseFloat(postMeal));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* 1. Asosiy Shakar kiritish formasi */}
      <Card className="p-6 bg-white dark:bg-slate-800 shadow-xl border-none">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="fasting">{t.fastingBloodSugar}</Label>
              <div className="relative mt-2">
                <Input
                  id="fasting"
                  type="number"
                  step="0.1"
                  placeholder="5.5"
                  value={fasting}
                  onChange={(e) => setFasting(e.target.value)}
                  className="pr-20 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {t.mmol}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="postMeal">{t.postMealBloodSugar}</Label>
              <div className="relative mt-2">
                <Input
                  id="postMeal"
                  type="number"
                  step="0.1"
                  placeholder="7.0"
                  value={postMeal}
                  onChange={(e) => setPostMeal(e.target.value)}
                  className="pr-20 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {t.mmol}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="date">{t.date}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="notes">{t.notes}</Label>
              <Textarea
                id="notes"
                placeholder={t.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 min-h-[80px]"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={!hasValidInput}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
          >
            {t.saveRecord}
          </Button>
        </div>
      </Card>

      {/* 2. Yangi: Dori Eslatmalari (Reminders) Sektsiyasi */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-slate-800 border-none shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg">
              {language === 'uz' ? 'Dori eslatmalari' : 'Напоминания'}
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setNewReminderType('tablet')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${newReminderType === 'tablet' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700'}`}
              >
                <Pill className="w-4 h-4" /> Tabletka
              </button>
              <button 
                onClick={() => setNewReminderType('insulin')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${newReminderType === 'insulin' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700'}`}
              >
                <Syringe className="w-4 h-4" /> Insulin
              </button>
            </div>
            
            <div className="flex gap-2">
              <Input 
                type="time" 
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addReminder} className="bg-blue-600">
                +
              </Button>
            </div>
          </div>
        </Card>

        {/* Eslatmalar Ro'yxati */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-none shadow-lg overflow-hidden relative">
          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
            <AnimatePresence>
              {reminders.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Hozircha eslatmalar yo'q</p>
              ) : (
                reminders.map((r) => (
                  <motion.div 
                    key={r.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg group"
                  >
                    <div className="flex items-center gap-3">
                      {r.type === 'tablet' ? <Pill className="w-4 h-4 text-emerald-500" /> : <Syringe className="w-4 h-4 text-blue-500" />}
                      <div>
                        <p className="font-bold">{r.time}</p>
                        <p className="text-xs text-muted-foreground">{r.label}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteReminder(r.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* 3. Maslahatlar va Normal qiymatlar (O'z holicha qoldi) */}
      {advice.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-3 text-blue-900 dark:text-blue-100">{t.advice}</h3>
                <div className="space-y-2">
                  {advice.map((item, index) => (
                    <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900">
                      <p className="text-sm leading-relaxed">{item}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-md border-none">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">
            {language === 'uz' ? 'Normal qiymatlar' : language === 'ru' ? 'Нормальные значения' : 'Normal Values'}
          </h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-green-100 dark:border-green-900">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium">{t.fastingBloodSugar}</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">3.9 - 5.5 {t.mmol}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-green-100 dark:border-green-900">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium">{t.postMealBloodSugar}</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">&lt; 7.8 {t.mmol}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}