import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Card } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';

export function Statistics() {
  const { language, records } = useApp();
  const t = translations[language];

  // Calculate statistics
  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        avgFasting: 0,
        avgPostMeal: 0,
        avgDifference: 0,
        recentRecords: [],
        chartData: [],
      };
    }

    const recentRecords = records.slice(0, 14).reverse();

    const avgFasting = recentRecords.reduce((sum, r) => sum + r.fastingLevel, 0) / recentRecords.length;
    const avgPostMeal = recentRecords.reduce((sum, r) => sum + r.postMealLevel, 0) / recentRecords.length;
    const avgDifference = avgPostMeal - avgFasting;

    const chartData = recentRecords.map(record => ({
      date: new Date(record.date).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
      [t.fasting]: record.fastingLevel,
      [t.postMeal]: record.postMealLevel,
    }));

    return {
      avgFasting: avgFasting.toFixed(1),
      avgPostMeal: avgPostMeal.toFixed(1),
      avgDifference: avgDifference.toFixed(1),
      recentRecords,
      chartData,
    };
  }, [records, language, t]);

  const getStatusColor = (value: number, isPostMeal: boolean = false) => {
    if (isPostMeal) {
      if (value < 7.8) return 'text-green-600 dark:text-green-400';
      if (value <= 11.0) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    } else {
      if (value >= 3.9 && value <= 5.5) return 'text-green-600 dark:text-green-400';
      if (value <= 6.9) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    }
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Activity className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">{t.noRecords}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {language === 'uz' ? 'Kundalik bo\'limida qand darajangizni kiriting' : 
           language === 'ru' ? 'Введите уровень сахара в разделе Дневник' : 
           'Enter your blood sugar levels in the Daily Journal section'}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{t.averageFasting}</p>
                <p className={`text-3xl font-bold ${getStatusColor(parseFloat(stats.avgFasting))}`}>
                  {stats.avgFasting}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t.mmol}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{t.averagePostMeal}</p>
                <p className={`text-3xl font-bold ${getStatusColor(parseFloat(stats.avgPostMeal), true)}`}>
                  {stats.avgPostMeal}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t.mmol}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{t.averageDifference}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.avgDifference}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t.mmol}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold mb-4">{t.last14Days}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                label={{ 
                  value: t.mmol, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'currentColor' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={t.fasting} 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey={t.postMeal} 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* All Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold mb-4">{t.allRecords}</h3>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.date}</TableHead>
                  <TableHead>{t.fasting}</TableHead>
                  <TableHead>{t.postMeal}</TableHead>
                  <TableHead>{t.difference}</TableHead>
                  <TableHead>{t.notes}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const difference = (record.postMealLevel - record.fastingLevel).toFixed(1);
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US')}
                      </TableCell>
                      <TableCell className={getStatusColor(record.fastingLevel)}>
                        {record.fastingLevel.toFixed(1)}
                      </TableCell>
                      <TableCell className={getStatusColor(record.postMealLevel, true)}>
                        {record.postMealLevel.toFixed(1)}
                      </TableCell>
                      <TableCell>{difference}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </motion.div>
    </motion.div>
  );
}
