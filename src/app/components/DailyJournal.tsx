import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { AlertCircle, TrendingUp, CheckCircle, Bell, Pill, Syringe, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  type: 'tablet' | 'insulin';
  time: string;
}

const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3";

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
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  useEffect(() => {
    localStorage.setItem('sugar_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // --- BUDULNIK VA OVOZ TRIGGERI (10 SEKUNDLIK) ---
  // --- BUDULNIK VA BILDIRISHNOMA TRIGGERI ---
  const triggerAlarm = useCallback((reminder: Reminder) => {
    // 1. Vibratsiya (Android uchun)
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // 2. Budulnik ovozini ijro etish
    const audio = new Audio(ALERT_SOUND);
    audio.volume = 1.0;
    audio.play().catch((e) => console.log("Ovoz ruxsati uchun ekranni bosing", e));

    // 10 soniyadan keyin ovozni to'xtatish
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 10000);

    // 3. Matnlar (Tillar bo'yicha)
    const label = reminder.type === 'tablet' 
      ? (language === 'uz' ? '💊 DORI VAQTI!' : '💊 ВРЕМЯ ЛЕКАРСТВА!') 
      : (language === 'uz' ? '💉 INSULIN VAQTI!' : '💉 ВРЕМЯ ИНСУЛИНА!');
    
    const desc = language === 'uz' ? 'Muolajani o\'z vaqtida bajaring!' : 'Выполните процедуру вовремя!';

    // 4. BRAUZER BILDIRISHNOMASI (Push Notification)
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(label, { body: desc, icon: "/vite.svg" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(label, { body: desc, icon: "/vite.svg" });
          }
        });
      }
    }

    // 5. EKRANDAGI BILDIRISHNOMA (Toast)
    toast.error(label, {
      description: `${reminder.time} - ${desc}`,
      duration: 10000,
      action: {
        label: "OK",
        onClick: () => {
          audio.pause();
          audio.currentTime = 0;
        },
      },
    });
  }, [language]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      reminders.forEach(r => {
        if (r.time === currentTime && now.getSeconds() === 0) triggerAlarm(r);
      });
    }, 1000);
    return () => clearInterval(checkInterval);
  }, [reminders, triggerAlarm]);

  const addReminder = () => {
    if (!newReminderTime) return;
    const newRem: Reminder = { id: Date.now().toString(), type: newReminderType, time: newReminderTime };
    setReminders([...reminders, newRem].sort((a, b) => a.time.localeCompare(b.time)));
    setNewReminderTime('');
    setIsAddingReminder(false);
  };

  // --- REALISTIK VA ANIQ MASLAHATLAR MANTIQI ---
  const getAdvice = () => {
    const f = parseFloat(fasting);
    const p = parseFloat(postMeal);
    let adviceList: { title: string; text: string; level: 'low' | 'normal' | 'high' | 'critical' }[] = [];

    // 1. Och qoringa tahlil
    if (!isNaN(f)) {
      if (f < 3.3) {
        adviceList.push({ 
          title: t.fastingBloodSugar, 
          text: language === 'uz' ? "🚨 KRITIK PAST: Gipoglikemiya xavfi! Tezda 15g tez so'riluvchi uglevod (shakarli suv, sharbat) iste'mol qiling va 15 daqiqadan so'ng qayta o'lchang." : "🚨 КРИТИЧЕСКИ НИЗКИЙ: Риск гипогликемии! Срочно примите 15г быстрых углеводов и перемерьте через 15 мин.", 
          level: 'critical' 
        });
      } else if (f >= 3.3 && f < 3.9) {
        adviceList.push({ 
          title: t.fastingBloodSugar, 
          text: language === 'uz' ? "⚠️ PAST: Shakar miqdori tushmoqda. Yengil tamaddi qilib olishingiz tavsiya etiladi." : "⚠️ НИЗКИЙ: Сахар падает. Рекомендуется легкий перекус.", 
          level: 'low' 
        });
      } else if (f >= 3.9 && f <= 5.5) {
        adviceList.push({ title: t.fastingBloodSugar, text: t.normalFasting, level: 'normal' });
      } else if (f > 5.5 && f <= 7.0) {
        adviceList.push({ 
          title: t.fastingBloodSugar, 
          text: language === 'uz' ? "⚠️ YUQORI: Diabet oldi holati ko'rsatkichi. Uglevodlar va stressni nazorat qiling." : "⚠️ ВЫСОКИЙ: Показатель предиабета. Контролируйте углеводы и стресс.", 
          level: 'high' 
        });
      } else {
        adviceList.push({ 
          title: t.fastingBloodSugar, 
          text: language === 'uz' ? "🚨 XAVFLI BALAND: Shoshilinch ravishda shifokoringiz bilan bog'laning va insulin/dori dozasini tekshiring." : "🚨 ОПАСНО ВЫСОКИЙ: Срочно свяжитесь с врачом и проверьте дозировку препаратов.", 
          level: 'critical' 
        });
      }
    }

    // 2. Ovqatdan keyingi tahlil
    if (!isNaN(p)) {
      if (p < 4.5) {
        adviceList.push({ 
          title: t.postMealBloodSugar, 
          text: language === 'uz' ? "🚨 KRITIK PAST: Ovqatdan keyin bunday ko'rsatkich noto'g'ri dori dozasidan dalolat berishi mumkin." : "🚨 КРИТИЧЕСКИ НИЗКИЙ: Такой показатель после еды может указывать на избыток препарата.", 
          level: 'critical' 
        });
      } else if (p < 7.8) {
        adviceList.push({ title: t.postMealBloodSugar, text: t.normalPostMeal, level: 'normal' });
      } else if (p >= 7.8 && p < 11.1) {
        adviceList.push({ 
          title: t.postMealBloodSugar, 
          text: language === 'uz' ? "⚠️ YUQORI: Ovqatdagi uglevodlar miqdori ko'plik qilgan bo'lishi mumkin. Keyingi safar porsiyani kamaytiring." : "⚠️ ВЫСОКИЙ: Возможно, в еде было много углеводов. Уменьшите порцию в следующий раз.", 
          level: 'high' 
        });
      } else {
        adviceList.push({ 
          title: t.postMealBloodSugar, 
          text: language === 'uz' ? "🚨 JUDA YUQORI: Qand miqdori kritik darajada! Ko'proq suv iching va jismoniy zo'riqishdan saqlaning. Shifokorga murojaat qiling." : "🚨 ОЧЕНЬ ВЫСОКИЙ: Сахар на критическом уровне! Пейте больше воды и избегайте нагрузок. Обратитесь к врачу.", 
          level: 'critical' 
        });
      }
    }
    return adviceList;
  };

  const handleSave = () => {
    const f = parseFloat(fasting);
    const p = parseFloat(postMeal);
    if (!isNaN(f) || !isNaN(p)) {
      addRecord({ date, fastingLevel: f || 0, postMealLevel: p || 0, notes });
      setCurrentFasting(f || 0); setCurrentPostMeal(p || 0);
      setFasting(''); setPostMeal(''); setNotes('');
      toast.success(t.saveRecord);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6 pb-10 px-4">
      
      {/* 1. ESLATMALAR */}
      <div className="flex flex-col items-end space-y-3">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1 pl-4 rounded-full border shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <Bell size={16} className="text-blue-500" />
            <span>{language === 'uz' ? 'Eslatmalar' : 'Напоминания'}</span>
          </div>
          <button onClick={() => setIsAddingReminder(!isAddingReminder)} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors">
            <Plus size={14} /> {language === 'uz' ? 'Qo\'shish' : 'Добавить'}
          </button>
        </div>

        <AnimatePresence>
          {isAddingReminder && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="z-10">
              <Card className="p-3 shadow-xl border-blue-100 flex gap-2 items-center bg-white dark:bg-slate-800">
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                  <button onClick={() => setNewReminderType('tablet')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${newReminderType === 'tablet' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{language === 'uz' ? 'Dori' : 'Доза'}</button>
                  <button onClick={() => setNewReminderType('insulin')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${newReminderType === 'insulin' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Insulin</button>
                </div>
                <Input type="time" value={newReminderTime} onChange={(e) => setNewReminderTime(e.target.value)} className="w-32 h-8 text-sm" />
                <Button onClick={addReminder} size="sm" className="h-8 bg-blue-600">OK</Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 flex-wrap justify-end">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-full shadow-sm">
              {r.type === 'tablet' ? <Pill size={12} className="text-emerald-500"/> : <Syringe size={12} className="text-blue-500"/>}
              <span className="font-bold text-xs">{r.time}</span>
              <button onClick={() => setReminders(reminders.filter(rem => rem.id !== r.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. FORMA */}
      <Card className="p-6 bg-white dark:bg-slate-800 shadow-xl border-none">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><Label>{t.fastingBloodSugar}</Label><Input type="number" step="0.1" value={fasting} onChange={(e) => setFasting(e.target.value)} className="text-lg py-6 mt-2" placeholder="5.5" /></div>
            <div><Label>{t.postMealBloodSugar}</Label><Input type="number" step="0.1" value={postMeal} onChange={(e) => setPostMeal(e.target.value)} className="text-lg py-6 mt-2" placeholder="7.0" /></div>
          </div>
          <div className="space-y-4">
            <div><Label>{t.date}</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 py-6" /></div>
            <div><Label>{t.notes}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-[110px]" placeholder={t.notes} /></div>
          </div>
        </div>
        <Button onClick={handleSave} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-6 text-lg font-bold shadow-lg transition-transform active:scale-[0.98]">{t.saveRecord}</Button>
      </Card>

      {/* 3. MASLAHATLAR (DINAMIK) */}
      <div className="space-y-3">
        {getAdvice().map((item, i) => (
          <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <Card className={`p-4 border-l-4 shadow-md ${
              item.level === 'critical' ? 'bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-200' : 
              item.level === 'high' ? 'bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200' : 
              item.level === 'low' ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200' : 
              'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200'
            }`}>
              <div className="flex gap-3 items-start">
                {item.level === 'critical' ? <AlertTriangle className="shrink-0 mt-1" /> : <AlertCircle className="shrink-0 mt-1" />}
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-60 tracking-wider mb-1">{item.title}</p>
                  <p className="text-sm font-semibold leading-relaxed">{item.text}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 4. ME'YORIY QIYMATLAR */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-900/40 border-none">
        <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold text-sm uppercase tracking-wider"><TrendingUp size={16} /> {language === 'uz' ? 'Me\'yoriy ko\'rsatkichlar' : 'Нормальные показатели'}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div><p className="text-xs text-slate-400 mb-1">{t.fastingBloodSugar}</p><p className="text-xl font-black text-emerald-600">3.9 - 5.5 <span className="text-xs font-normal">mmol/L</span></p></div>
            <CheckCircle size={24} className="text-emerald-500 opacity-40" />
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div><p className="text-xs text-slate-400 mb-1">{t.postMealBloodSugar}</p><p className="text-xl font-black text-emerald-600">&lt; 7.8 <span className="text-xs font-normal">mmol/L</span></p></div>
            <CheckCircle size={24} className="text-emerald-500 opacity-40" />
          </div>
        </div>
      </Card>

    </motion.div>
  );
}