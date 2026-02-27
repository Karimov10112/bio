import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { AlertCircle, Bell, Pill, Syringe, Trash2, Plus, AlertTriangle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Reminder {
  
  id: string;
  type: 'tablet' | 'insulin';
  time: string;
  name: string;      // "?" belgisini olib tashlang, nomi majburiy bo'lsin
  dosage?: string;    // Qo'shimcha maydon
  isDaily?: boolean;  // Qo'shimcha maydon
  notes?: string;     // Qo'shimcha maydon
}

const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3";
const translations = {
  uz: { fasting: "Och qoringa qand", save: "SAQLASH", date: "Sana", notes: "Izohlar" },
  ru: { fasting: "Сахар натощак", save: "СОХРАНИТЬ", date: "Дата", notes: "Заметки" },
  en: { fasting: "Fasting Sugar", save: "SAVE", date: "Date", notes: "Notes" }
};
export function DailyJournal() {
  const { language, addRecord, records, setCurrentFasting, setCurrentPostMeal } = useApp();
  const t = translations[language as keyof typeof translations] || translations.uz;

  const [fasting, setFasting] = useState('');
  const [postMeal, setPostMeal] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Eslatmalar holati
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('sugar_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Modal oynasi holatlari
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderName, setNewReminderName] = useState('');
  const [newReminderType, setNewReminderType] = useState<'tablet' | 'insulin'>('tablet');

  useEffect(() => {
    localStorage.setItem('sugar_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Bildirishnoma va Budilnik mantiqi
  const triggerAlarm = useCallback((reminder: Reminder) => {
    const audio = new Audio(ALERT_SOUND);
    audio.play().catch(() => {});
    
    const title = reminder.type === 'tablet' ? `💊 Dori vaqti!` : `💉 Insulin vaqti!`;
    const body = `${reminder.name || ''} muolajasini bajarish vaqti keldi (${reminder.time}).`;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }

    toast.error(title, {
      description: body,
      duration: 20000,
      action: { label: "OK", onClick: () => audio.pause() },
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      reminders.forEach(r => {
        if (r.time === currentTime && now.getSeconds() === 0) triggerAlarm(r);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [reminders, triggerAlarm]);

  // Tahlil mantiqi (Rasm 0545c8.png uslubida)
  const getAdvice = () => {
    const f = parseFloat(fasting);
    const p = parseFloat(postMeal);
    let adviceList: { category: string; title: string; text: string; level: 'low' | 'normal' | 'high' | 'critical' }[] = [];

    if (!isNaN(f) && f > 0) {
      if (f < 3.3) adviceList.push({ category: "OCH QORINGA QAND", title: "🚨 KRITIK PAST (Gipoglikemiya)", text: "Zudlik bilan 15g shakarli suv yoki asal iste'mol qiling! Hayot uchun xavfli.", level: 'critical' });
      else if (f <= 5.5) adviceList.push({ category: "OCH QORINGA QAND", title: "✅ ME'YORDA", text: "Sizning ko'rsatkichingiz sog'lom darajada. Barakalla!", level: 'normal' });
      else if (f <= 7.0) adviceList.push({ category: "OCH QORINGA QAND", title: "⚠️ YUQORI (Diabet oldi)", text: "Me'yordan biroz baland. Kechki ovqatni va uglevodlarni nazorat qiling.", level: 'high' });
      else adviceList.push({ category: "OCH QORINGA QAND", title: "🚨 XAVFLI BALAND", text: "Shoshilinch ravishda shifokoringiz bilan bog'laning va dori/insulin dozasini tekshiring.", level: 'critical' });
    }

    if (!isNaN(p) && p > 0) {
      if (p < 4.5) adviceList.push({ category: "OVQATDAN KEYINGI QAND", title: "🚨 KRITIK PAST", text: "Ovqatdan keyin bunday past natija dori dozasining ortiqchaligini ko'rsatadi.", level: 'critical' });
      else if (p <= 7.8) adviceList.push({ category: "OVQATDAN KEYINGI QAND", title: "✅ ME'YORDA", text: "Ovqatdan keyingi shakar miqdori ideal darajada. To'g'ri ovqatlanmoqdasiz.", level: 'normal' });
      else if (p <= 11.1) adviceList.push({ category: "OVQATDAN KEYINGI QAND", title: "⚠️ YUQORI", text: "Shakar miqdori baland. Bir oz piyoda yurish va ko'p suv ichish tavsiya etiladi.", level: 'high' });
      else adviceList.push({ category: "OVQATDAN KEYINGI QAND", title: "🚨 O'TA YUQORI", text: "Kritik darajada yuqori! Zudlik bilan uglevodlarni cheklang va shifokorga xabar bering.", level: 'critical' });
    }
    return adviceList;
  };

  const handleSave = () => {
    const f = parseFloat(fasting);
    const p = parseFloat(postMeal);
    if (isNaN(f) && isNaN(p)) return toast.warning("Qiymat kiriting!");

    addRecord({ date, fastingLevel: f || 0, postMealLevel: p || 0, notes });
    toast.success("Muvaffaqiyatli saqlandi!");
    setFasting(''); setPostMeal(''); setNotes('');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      
      {/* 1. ESLATMALAR QATORI (image_f8f7df.jpg uslubida) */}
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 font-medium bg-white px-4 py-2 rounded-full shadow-sm border">
            <Bell size={18} className="text-blue-500" />
            <span>Eslatmalar</span>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border-none shadow-none text-xs font-bold">
            + Qo'shish
          </Button>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {reminders.map(r => (
            <div key={r.id} className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
              {r.type === 'tablet' ? <Pill size={14} className="text-emerald-500"/> : <Syringe size={14} className="text-blue-500"/>}
              <span className="font-bold text-xs">{r.time}</span>
              <button onClick={() => setReminders(reminders.filter(rem => rem.id !== r.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ASOSIY FORMA (image_f8f7df.jpg uslubida) */}
      <Card className="p-8 bg-white dark:bg-slate-900 shadow-xl rounded-[2rem] border-none transition-colors">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label className="text-slate-500 font-bold ml-1">Och qoringa qand</Label>
              <Input type="number" step="0.1" value={fasting} onChange={(e) => setFasting(e.target.value)} className="h-14 text-lg rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none mt-2 transition-colors" />
            </div>
            <div>
              <Label className="text-slate-500 font-bold ml-1">Ovqatdan keyingi qand</Label>
              <Input type="number" step="0.1" value={postMeal} onChange={(e) => setPostMeal(e.target.value)} className="h-14 text-lg rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none mt-2 transition-colors" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <Label className="text-slate-500 font-bold ml-1">Sana</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none mt-2 transition-colors" />
            </div>
            <div>
              <Label className="text-slate-500 font-bold ml-1">Izohlar</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-2xl bg-slate-50 border-none mt-2 min-h-[110px]" placeholder="Izohlar" />
            </div>
          </div>
        </div>
        <Button onClick={handleSave} className="w-full mt-8 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-bold shadow-lg shadow-blue-200 uppercase tracking-wider">
          Saqlash
        </Button>
      </Card>

      {/* 3. TAHLIL NATIJALARI (image_0545c8.png uslubida) */}
      <div className="space-y-3">
        {getAdvice().map((item, i) => (
          <div key={i} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-4 items-center animate-in fade-in slide-in-from-left">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{item.category}</p>
              <p className="text-sm font-bold text-re d-900 leading-tight">
                🚨 {item.title}: <span className="font-medium text-red-800">{item.text}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. ME'YORIY KO'RSATKICHLAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 rounded-[1.5rem] border-none bg-slate-50/50 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Och qoringa qand</p>
            <p className="text-2xl font-black text-emerald-600">3.6 - 5.5 <span className="text-sm font-medium opacity-40">mmol/L</span></p>
          </div>
          <CheckCircle className="text-emerald-500 opacity-20" size={40}/>
        </Card>
        <Card className="p-6 rounded-[1.5rem] border-none bg-slate-50/50 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Ovqatdan keyingi qand</p>
            <p className="text-2xl font-black text-emerald-600">&lt; 7.8 <span className="text-sm font-medium opacity-40">mmol/L</span></p>
          </div>
          <CheckCircle className="text-emerald-500 opacity-20" size={40}/>
        </Card>
      </div>

      {/* MODAL OYNA (image_059bc2.png uslubida) */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)} // Tashqarini bossa yopiladi
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} // Ichkarini bossa yopilmaydi
              className="bg-white w-full max-w-[400px] rounded-[2.5rem] p-10 shadow-2xl relative"
            >
              <h3 className="text-2xl font-black text-slate-800 mb-8 text-center">Yangi eslatma</h3>
              
              <div className="space-y-6">
                {/* Dori / Insulin selektori */}
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button 
                    onClick={() => setNewReminderType('tablet')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${newReminderType === 'tablet' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                  >
                    💊 DORI
                  </button>
                  <button 
                    onClick={() => setNewReminderType('insulin')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${newReminderType === 'insulin' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                  >
                    💉 INSULIN
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomi</Label>
                  <Input 
                    placeholder="Masalan: Metformin" 
                    value={newReminderName} 
                    onChange={(e) => setNewReminderName(e.target.value)}
                    className="h-14 rounded-2xl bg-slate-50 border-none px-5"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vaqti</Label>
                  <div className="relative">
                    <Input 
                      type="time" 
                      value={newReminderTime} 
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      className="h-14 rounded-2xl bg-slate-50 border-none px-5 text-lg font-bold"
                    />
                    <Clock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Yopish
                  </button>
                  <Button 
                    onClick={() => {
                      if(!newReminderTime) return toast.error("Vaqtni kiriting!");
                      setReminders([...reminders, { id: Date.now().toString(), type: newReminderType, time: newReminderTime, name: newReminderName }]);
                      setIsModalOpen(false);
                      setNewReminderName('');
                      setNewReminderTime('');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-bold shadow-lg shadow-blue-100"
                  >
                    Saqlash
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
  {isModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[450px] rounded-[1.5rem] p-6 shadow-2xl relative"
      >
        {/* Sarlavha */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Eslatma qo'shish</h3>
          <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* 1. Dori / Insulin selektori */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Dori / Insulin</Label>
            <select 
              value={newReminderType}
              onChange={(e) => setNewReminderType(e.target.value as 'tablet' | 'insulin')}
              className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="tablet">Dori</option>
              <option value="insulin">Insulin</option>
            </select>
          </div>

          {/* 2. Nomi */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Dori/Insulin nomi</Label>
            <Input 
              placeholder="masalan, Metformin" 
              value={newReminderName} 
              onChange={(e) => setNewReminderName(e.target.value)}
              className="h-12 rounded-xl bg-slate-50 border-slate-200 px-4"
            />
          </div>

          {/* 3. Doza */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Doza</Label>
            <Input 
              placeholder="masalan, 500mg" 
              className="h-12 rounded-xl bg-slate-50 border-slate-200 px-4"
              id="dosage_input"
            />
          </div>

          {/* 4. Vaqt */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Vaqt</Label>
            <div className="relative">
              <Input 
                type="time" 
                value={newReminderTime} 
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-slate-200 px-4 text-lg"
              />
              <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>

          {/* 5. Kundalik takrorlash (Switch ko'rinishida) */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-sm font-medium text-slate-700">Kundalik takrorlash</span>
            <input type="checkbox" className="w-10 h-5 accent-blue-600 cursor-pointer" id="daily_repeat" defaultChecked />
          </div>

          {/* 6. Izohlar */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Izohlar (ixtiyoriy)</Label>
            <Textarea 
              placeholder="Qo'shimcha izohlar..." 
              className="rounded-xl bg-slate-50 border-slate-200 min-h-[80px]"
              id="reminder_notes"
            />
          </div>

          {/* Tugmalar */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <Button 
              onClick={() => {
                if(!newReminderTime || !newReminderName) return toast.error("Ma'lumotlarni to'ldiring!");
                
                const dosage = (document.getElementById('dosage_input') as HTMLInputElement).value;
                const isDaily = (document.getElementById('daily_repeat') as HTMLInputElement).checked;
                const notes = (document.getElementById('reminder_notes') as HTMLTextAreaElement).value;

                setReminders([...reminders, { 
                  id: Date.now().toString(), 
                  type: newReminderType, 
                  time: newReminderTime, 
                  name: newReminderName,
                  dosage,
                  isDaily,
                  notes
                }]);
                
                setIsModalOpen(false);
                setNewReminderName('');
                setNewReminderTime('');
                toast.success("Eslatma saqlandi!");
              }}
              className="flex-1 h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg"
            >
              Saqlash
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

    </div>
  );
}

// Yordamchi komponent
function CheckCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}