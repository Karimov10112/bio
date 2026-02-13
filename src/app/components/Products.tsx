import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { products, categories, getProductStatus, Product } from '../data/products';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollArea } from './ui/scroll-area';

export function Products() {
  const { language, currentFasting, currentPostMeal } = useApp();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        product.name[language].toLowerCase().includes(searchLower) ||
        product.name.en.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Status filter based on blood sugar
      if (selectedStatus !== 'all') {
        const status = getProductStatus(product, currentFasting, currentPostMeal);
        if (status !== selectedStatus) return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedStatus, language, currentFasting, currentPostMeal]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(product => {
      if (!groups[product.category]) {
        groups[product.category] = [];
      }
      groups[product.category].push(product);
    });
    return groups;
  }, [filteredProducts]);

  const getStatusColor = (status: 'safe' | 'caution' | 'avoid') => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'caution':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'avoid':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getStatusText = (status: 'safe' | 'caution' | 'avoid') => {
    switch (status) {
      case 'safe':
        return t.safe;
      case 'caution':
        return t.caution;
      case 'avoid':
        return t.avoid;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-4 bg-white dark:bg-slate-800">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {language === 'uz' ? 'Filtrlar' : language === 'ru' ? 'Фильтры' : 'Filters'}
              </span>
            </button>
            <div className="text-sm text-muted-foreground">
              {filteredProducts.length} {t.productsCount}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid md:grid-cols-2 gap-4 overflow-hidden"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.category}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  >
                    <option value="all">{t.allCategories}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {t[cat.nameKey as keyof typeof t] as string}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t.status}</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  >
                    <option value="all">{t.allStatuses}</option>
                    <option value="safe">🟢 {t.safe}</option>
                    <option value="caution">🟡 {t.caution}</option>
                    <option value="avoid">🔴 {t.avoid}</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Products Grid */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-8 pb-6">
          {categories.filter(cat => groupedProducts[cat.id]?.length > 0).map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{category.emoji}</span>
                <h2 className="text-xl font-semibold">
                  {t[category.nameKey as keyof typeof t] as string}
                </h2>
                <Badge variant="secondary" className="ml-2">
                  {groupedProducts[category.id].length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedProducts[category.id].map((product) => {
                  const status = getProductStatus(product, currentFasting, currentPostMeal);
                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-white dark:bg-slate-800"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-4xl">{product.emoji}</span>
                          <Badge className={getStatusColor(status)}>
                            {getStatusText(status)}
                          </Badge>
                        </div>

                        <h3 className="font-semibold mb-2 line-clamp-1">
                          {product.name[language]}
                        </h3>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{t.gi}:</span>
                            <span className="font-medium">{product.gi}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{t.gl}:</span>
                            <span className="font-medium">{product.gl}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1">
                            <span className="text-muted-foreground">{t.calories}:</span>
                            <span className="font-medium">{product.nutrition.calories} kcal</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {language === 'uz' ? 'Mahsulot topilmadi' : language === 'ru' ? 'Продукты не найдены' : 'No products found'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <span className="text-6xl">{selectedProduct.emoji}</span>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">
                      {selectedProduct.name[language]}
                    </DialogTitle>
                    <Badge className={getStatusColor(getProductStatus(selectedProduct, currentFasting, currentPostMeal))}>
                      {getStatusText(getProductStatus(selectedProduct, currentFasting, currentPostMeal))}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* GI and GL */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950">
                    <div className="text-sm text-muted-foreground mb-1">{t.glycemicIndex}</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{selectedProduct.gi}</div>
                  </Card>
                  <Card className="p-4 bg-purple-50 dark:bg-purple-950">
                    <div className="text-sm text-muted-foreground mb-1">{t.glycemicLoad}</div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{selectedProduct.gl}</div>
                  </Card>
                </div>

                {/* Nutritional Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">{t.nutritionalInfo} ({t.per100g})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{t.calories}</div>
                      <div className="font-semibold">{selectedProduct.nutrition.calories} kcal</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{t.carbs}</div>
                      <div className="font-semibold">{selectedProduct.nutrition.carbs}g</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{t.sugar}</div>
                      <div className="font-semibold">{selectedProduct.nutrition.sugar}g</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{t.fiber}</div>
                      <div className="font-semibold">{selectedProduct.nutrition.fiber}g</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{t.protein}</div>
                      <div className="font-semibold">{selectedProduct.nutrition.protein}g</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{t.fat}</div>
                      <div className="font-semibold">{selectedProduct.nutrition.fat}g</div>
                    </div>
                  </div>
                </div>

                {/* Carb Distribution */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">{t.carbDistribution}</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t.sugar}</span>
                        <span>{selectedProduct.nutrition.sugar}g</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(selectedProduct.nutrition.sugar / selectedProduct.nutrition.carbs) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t.fiber}</span>
                        <span>{selectedProduct.nutrition.fiber}g</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${(selectedProduct.nutrition.fiber / selectedProduct.nutrition.carbs) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Macronutrients */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">{t.macronutrients}</h3>
                  <div className="h-8 flex rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(selectedProduct.nutrition.carbs * 4 / selectedProduct.nutrition.calories) * 100}%` }}
                      title={`${t.carbs}: ${selectedProduct.nutrition.carbs}g`}
                    >
                      {((selectedProduct.nutrition.carbs * 4 / selectedProduct.nutrition.calories) * 100).toFixed(0)}%
                    </div>
                    <div
                      className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(selectedProduct.nutrition.protein * 4 / selectedProduct.nutrition.calories) * 100}%` }}
                      title={`${t.protein}: ${selectedProduct.nutrition.protein}g`}
                    >
                      {((selectedProduct.nutrition.protein * 4 / selectedProduct.nutrition.calories) * 100).toFixed(0)}%
                    </div>
                    <div
                      className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(selectedProduct.nutrition.fat * 9 / selectedProduct.nutrition.calories) * 100}%` }}
                      title={`${t.fat}: ${selectedProduct.nutrition.fat}g`}
                    >
                      {((selectedProduct.nutrition.fat * 9 / selectedProduct.nutrition.calories) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-blue-500 rounded"></span>
                      {t.carbs}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-red-500 rounded"></span>
                      {t.protein}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                      {t.fat}
                    </span>
                  </div>
                </div>

                {/* Detailed Advice */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{t.detailedAdvice}</h3>
                  <p className="text-sm leading-relaxed">{selectedProduct.advice[language]}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
