import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function DailyJournal() {
  const { language, addRecord, setCurrentFasting, setCurrentPostMeal } = useApp();
  const t = translations[language];

  const [fasting, setFasting] = useState('');
  const [postMeal, setPostMeal] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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

      // Update current values for product filtering
      setCurrentFasting(fastingNum);
      setCurrentPostMeal(postMealNum);

      // Reset form
      setFasting('');
      setPostMeal('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
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
      <Card className="p-6 bg-white dark:bg-slate-800">
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
                  className="pr-20"
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
                  className="pr-20"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t.saveRecord}
          </Button>
        </div>
      </Card>

      {advice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-3 text-blue-900 dark:text-blue-100">
                  {t.advice}
                </h3>
                <div className="space-y-2">
                  {advice.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                    >
                      <p className="text-sm leading-relaxed">{item}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">
            {language === 'uz' ? 'Normal qiymatlar' : language === 'ru' ? 'Нормальные значения' : 'Normal Values'}
          </h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium">{t.fastingBloodSugar}</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">3.9 - 5.5 {t.mmol}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
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
