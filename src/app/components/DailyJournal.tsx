import React, { useState, useEffect, useCallback } from 'react';
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

// Mobil qurilmalarda ovoz chiqishi uchun standart URL
const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export function DailyJournal() {
  const { language, addRecord, setCurrentFasting, setCurrentPostMeal } = useApp();
  const t = translations[language];

  const [fasting, setFasting] = useState('');
  const [postMeal, setPostMeal] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('sugar_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderType, setNewReminderType] = useState<'tablet' | 'insulin'>('tablet');

  useEffect(() => {
    localStorage.setItem('sugar_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Mobil bildirishnoma va signalizatsiya funksiyasi
  const triggerAlarm = useCallback((reminder: Reminder) => {
    // 1. Vibratsiya (Mobil uchun juda muhim)
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // 2. Ovozli xabar
    const audio = new Audio(ALERT_SOUND);
    audio.play().catch(e => console.log("Ovoz ruxsati kerak"));

    // 3. Push Notification
    if (Notification.permission === 'granted') {
      new Notification(reminder.type === 'tablet' ? "Dori vaqti!" : "Insulin vaqti!", {
        body: `${reminder.time} bo'ldi. Dorilaringizni unutmang.`,
        icon: '/favicon.ico',
        tag: 'diabetes-reminder', // Bir xil bildirishnomalar yig'ilib qolmasligi uchun
        renotify: true
      });
    }

    // 4. Ekrandagi xabar
    toast.error(`${reminder.time} - ${reminder.label} vaqti bo'ldi!`, {
      duration: 30000, // 30 soniya turadi
      action: {
        label: "OK",
        onClick: () => {
          if ('vibrate' in navigator) navigator.vibrate(0); // Vibratsiyani to'xtatish
        }
      }
    });
  }, []);

  // Vaqtni tekshirish mantiqi (Har 30 soniyada)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      reminders.forEach(r => {
        // Agar soniya 0 bo'lsa va vaqt to'g'ri kelsa
        if (r.time === currentTime && now.getSeconds() < 30) {
          triggerAlarm(r);
        }
      });
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [reminders, triggerAlarm]);

  const addReminder = () => {
    if (!newReminderTime) return;
    
    // Mobil brauzerlarda bildirishnomaga ruxsat so'rash
    if (Notification.permission === 'default') {
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
    toast.success(language === 'uz' ? 'Eslatma saqlandi' : 'Напоминание сохранено');
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const getAdvice = () => {
    const fastingNum = parseFloat(fasting);
    const postMealNum = parseFloat(postMeal);
    let advice: string[] = [];

    if (!isNaN(fastingNum)) {
      if (fastingNum < 3.9) advice.push(`⚠️ ${t.fastingBloodSugar}: Juda past! Shoshilinch shirinlik yeng.`);
      else if (fastingNum <= 5.5) advice.push(`✅ ${t.fastingBloodSugar}: ${t.normalFasting}`);
      else if (fastingNum <= 6.9) advice.push(`⚠️ ${t.fastingBloodSugar}: ${t.preDiabeticFasting}`);
      else advice.push(`🚨 ${t.fastingBloodSugar}: ${t.diabeticFasting}`);
    }

    if (!isNaN(postMealNum)) {
      if (postMealNum < 7.8) advice.push(`✅ ${t.postMealBloodSugar}: ${t.normalPostMeal}`);
      else if (postMealNum <= 11.0) advice.push(`⚠️ ${t.postMealBloodSugar}: ${t.preDiabeticPostMeal}`);
      else advice.push(`🚨 ${t.postMealBloodSugar}: ${t.diabeticPostMeal}`);
    }
    return advice;
  };

  const handleSave = () => {
    const f = parseFloat(fasting);
    const p = parseFloat(postMeal);
    if (!isNaN(f) || !isNaN(p)) {
      addRecord({ date, fastingLevel: f || 0, postMealLevel: p || 0, notes });
      setCurrentFasting(f || 0);
      setCurrentPostMeal(p || 0);
      setFasting(''); setPostMeal(''); setNotes('');
      toast.success(language === 'uz' ? 'Ma\'lumot saqlandi' : 'Данные сохранены');
    }
  };

  const adviceList = getAdvice();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Shakar kiritish formasi */}
      <Card className="p-6 bg-white dark:bg-slate-800 shadow-xl border-none mx-4 md:mx-0">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>{t.fastingBloodSugar}</Label>
              <div className="relative mt-2">
                <Input type="number" step="0.1" inputMode="decimal" value={fasting} onChange={(e) => setFasting(e.target.value)} className="text-lg py-6" placeholder="5.5" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{t.mmol}</span>
              </div>
            </div>
            <div>
              <Label>{t.postMealBloodSugar}</Label>
              <div className="relative mt-2">
                <Input type="number" step="0.1" inputMode="decimal" value={postMeal} onChange={(e) => setPostMeal(e.target.value)} className="text-lg py-6" placeholder="7.0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{t.mmol}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div><Label>{t.date}</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 py-6" /></div>
            <div><Label>{t.notes}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-[100px]" /></div>
          </div>
        </div>
        <Button onClick={handleSave} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-6 text-lg">{t.saveRecord}</Button>
      </Card>

      {/* Dori Eslatmalari */}
      <div className="grid md:grid-cols-2 gap-6 px-4 md:px-0">
        <Card className="p-6 bg-white dark:bg-slate-800 border-none shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold">{language === 'uz' ? 'Eslatma qo\'shish' : 'Добавить напоминание'}</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setNewReminderType('tablet')} className={`flex-1 p-3 rounded-xl border-2 transition-all ${newReminderType === 'tablet' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700'}`}>
                <Pill className="w-4 h-4 mx-auto mb-1" /> Tabletka
              </button>
              <button onClick={() => setNewReminderType('insulin')} className={`flex-1 p-3 rounded-xl border-2 transition-all ${newReminderType === 'insulin' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700'}`}>
                <Syringe className="w-4 h-4 mx-auto mb-1" /> Insulin
              </button>
            </div>
            <div className="flex gap-2">
              <Input type="time" value={newReminderTime} onChange={(e) => setNewReminderTime(e.target.value)} className="text-lg py-6 flex-1" />
              <Button onClick={addReminder} className="bg-blue-600 px-8">+</Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-800 border-none shadow-lg max-h-[300px] overflow-y-auto">
          <AnimatePresence>
            {reminders.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Eslatmalar yo'q</p>
            ) : (
              reminders.map((r) => (
                <motion.div key={r.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex items-center justify-between p-3 mb-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    {r.type === 'tablet' ? <Pill className="text-emerald-500" /> : <Syringe className="text-blue-500" />}
                    <div><p className="font-bold">{r.time}</p><p className="text-xs text-muted-foreground">{r.label}</p></div>
                  </div>
                  <button onClick={() => deleteReminder(r.id)} className="text-red-500 p-2"><Trash2 size={18} /></button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Maslahatlar va Normal Qiymatlar */}
      <div className="px-4 md:px-0 space-y-6">
        {adviceList.length > 0 && (
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <h3 className="font-bold mb-4 flex items-center gap-2"><AlertCircle size={20} className="text-blue-600"/> {t.advice}</h3>
            <div className="space-y-2">
              {adviceList.map((item, i) => <p key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm text-sm">{item}</p>)}
            </div>
          </Card>
        )}

        <Card className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-none">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-600"/> Normal qiymatlar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-sm text-muted-foreground">{t.fastingBloodSugar}</span>
              <p className="text-2xl font-bold text-emerald-600">3.9 - 5.5 {t.mmol}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-sm text-muted-foreground">{t.postMealBloodSugar}</span>
              <p className="text-2xl font-bold text-emerald-600">&lt; 7.8 {t.mmol}</p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}