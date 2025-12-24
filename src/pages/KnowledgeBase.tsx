import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Plus,
  Search,
  Folder,
  FileText,
  Bot,
  Trash2,
  Edit,
  Tag,
  EyeOff,
  Shield,
  Globe,
} from 'lucide-react';
import { useKnowledge } from '@/hooks/useKnowledge';
import { PremiumFeatureGate } from '@/components/subscription/PremiumFeatureGate';

const KnowledgeBase = () => {
  const { t } = useTranslation();
  const { 
    categories, 
    entries, 
    isLoading,
    createCategory,
    deleteCategory,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useKnowledge();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    summary: '',
    category_id: '',
    keywords: '',
    tags: '',
    is_ai_accessible: true,
    is_public: false,
    sensitivity_level: 'public',
  });

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || entry.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateCategory = () => {
    createCategory.mutate({
      name: newCategory.name,
      slug: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      description: newCategory.description,
    });
    setNewCategory({ name: '', description: '' });
    setIsAddCategoryOpen(false);
  };

  const handleCreateEntry = () => {
    createEntry.mutate({
      title: newEntry.title,
      content: newEntry.content,
      summary: newEntry.summary || undefined,
      category_id: newEntry.category_id || undefined,
      keywords: newEntry.keywords ? newEntry.keywords.split(',').map(k => k.trim()) : undefined,
      tags: newEntry.tags ? newEntry.tags.split(',').map(t => t.trim()) : undefined,
      is_ai_accessible: newEntry.is_ai_accessible,
      is_public: newEntry.is_public,
      sensitivity_level: newEntry.sensitivity_level,
    });
    setNewEntry({
      title: '',
      content: '',
      summary: '',
      category_id: '',
      keywords: '',
      tags: '',
      is_ai_accessible: true,
      is_public: false,
      sensitivity_level: 'public',
    });
    setIsAddEntryOpen(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PremiumFeatureGate feature="knowledge_base">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              {t('knowledge.title')}
            </h1>
            <p className="text-muted-foreground">{t('knowledge.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Folder className="w-4 h-4 mr-2" />
                  {t('knowledge.newCategory')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('knowledge.newCategoryTitle')}</DialogTitle>
                  <DialogDescription>{t('knowledge.newCategoryDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t('knowledge.categoryName')}</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder={t('knowledge.categoryNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('knowledge.categoryDescription')}</Label>
                    <Input
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder={t('knowledge.categoryDescPlaceholder')}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleCreateCategory} disabled={!newCategory.name || createCategory.isPending}>
                    {createCategory.isPending ? t('knowledge.creating') : t('knowledge.createCategory')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('knowledge.addKnowledge')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('knowledge.addKnowledgeTitle')}</DialogTitle>
                  <DialogDescription>{t('knowledge.addKnowledgeDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t('knowledge.titleField')} *</Label>
                    <Input
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                      placeholder={t('knowledge.titlePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('knowledge.contentField')} *</Label>
                    <Textarea
                      value={newEntry.content}
                      onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                      placeholder={t('knowledge.contentPlaceholder')}
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label>{t('knowledge.summaryField')}</Label>
                    <Textarea
                      value={newEntry.summary}
                      onChange={(e) => setNewEntry({ ...newEntry, summary: e.target.value })}
                      placeholder={t('knowledge.summaryPlaceholder')}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('knowledge.category')}</Label>
                      <Select
                        value={newEntry.category_id}
                        onValueChange={(value) => setNewEntry({ ...newEntry, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('knowledge.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('knowledge.sensitivityLevel')}</Label>
                      <Select
                        value={newEntry.sensitivity_level}
                        onValueChange={(value) => setNewEntry({ ...newEntry, sensitivity_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">{t('knowledge.public')}</SelectItem>
                          <SelectItem value="internal">{t('knowledge.internal')}</SelectItem>
                          <SelectItem value="confidential">{t('knowledge.confidential')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{t('knowledge.keywords')}</Label>
                    <Input
                      value={newEntry.keywords}
                      onChange={(e) => setNewEntry({ ...newEntry, keywords: e.target.value })}
                      placeholder={t('knowledge.keywordsPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('knowledge.tags')}</Label>
                    <Input
                      value={newEntry.tags}
                      onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                      placeholder={t('knowledge.tagsPlaceholder')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newEntry.is_ai_accessible}
                        onCheckedChange={(checked) => setNewEntry({ ...newEntry, is_ai_accessible: checked })}
                      />
                      <Label className="flex items-center gap-1">
                        <Bot className="w-4 h-4" />
                        {t('knowledge.aiAccessible')}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newEntry.is_public}
                        onCheckedChange={(checked) => setNewEntry({ ...newEntry, is_public: checked })}
                      />
                      <Label className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        {t('knowledge.public')}
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddEntryOpen(false)}>{t('common.cancel')}</Button>
                  <Button 
                    onClick={handleCreateEntry} 
                    disabled={!newEntry.title || !newEntry.content || createEntry.isPending}
                  >
                    {createEntry.isPending ? t('knowledge.saving') : t('common.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('knowledge.totalEntries')}</p>
                  <p className="text-2xl font-bold">{entries.length}</p>
                </div>
                <FileText className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('knowledge.categoriesCount')}</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <Folder className="w-8 h-8 text-chart-blue/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('knowledge.aiAccessibleCount')}</p>
                  <p className="text-2xl font-bold">{entries.filter(e => e.is_ai_accessible).length}</p>
                </div>
                <Bot className="w-8 h-8 text-chart-green/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('knowledge.publicCount')}</p>
                  <p className="text-2xl font-bold">{entries.filter(e => e.is_public).length}</p>
                </div>
                <Globe className="w-8 h-8 text-chart-orange/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="entries" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="entries">{t('knowledge.entries')}</TabsTrigger>
              <TabsTrigger value="categories">{t('knowledge.categoriesCount')}</TabsTrigger>
            </TabsList>
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('knowledge.searchKnowledge')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={selectedCategory || 'all'}
                onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('knowledge.filterCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('knowledge.allCategories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="entries">
            <Card>
              <CardContent className="p-0">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? t('knowledge.noResults') : t('knowledge.noKnowledge')}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredEntries.map((entry) => (
                      <div key={entry.id} className="p-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{entry.title}</h3>
                              {entry.category && (
                                <Badge variant="outline" className="text-xs">{entry.category.name}</Badge>
                              )}
                              {entry.is_ai_accessible ? (
                                <Bot className="w-4 h-4 text-chart-green" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                              {entry.sensitivity_level === 'confidential' && (
                                <Shield className="w-4 h-4 text-chart-red" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{entry.summary || entry.content}</p>
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {entry.tags.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    <Tag className="w-3 h-3 mr-1" />{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('knowledge.deleteEntry')}</AlertDialogTitle>
                                  <AlertDialogDescription>{t('knowledge.deleteEntryDesc')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteEntry.mutate(entry.id)}>
                                    {t('common.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardContent className="p-0">
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t('knowledge.noKnowledge')}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                        <div>
                          <h3 className="font-medium">{cat.name}</h3>
                          <p className="text-sm text-muted-foreground">{cat.description || '-'}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {entries.filter(e => e.category_id === cat.id).length} {t('knowledge.entries').toLowerCase()}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('knowledge.deleteCategory')}</AlertDialogTitle>
                              <AlertDialogDescription>{t('knowledge.deleteCategoryDesc')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCategory.mutate(cat.id)}>
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </PremiumFeatureGate>
    </DashboardLayout>
  );
};

export default KnowledgeBase;