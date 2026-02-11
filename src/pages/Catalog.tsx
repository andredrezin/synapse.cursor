import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Image as ImageIcon,
  FileText,
  Video,
  Trash2,
  Edit,
  ExternalLink,
  Search,
  Grid,
  List,
  Loader2,
  FolderOpen,
  Package,
  Star,
  DollarSign,
} from "lucide-react";
import { useWorkspaceAssets, WorkspaceAsset } from "@/hooks/useWorkspaceAssets";
import {
  useCatalogProducts,
  ProductCategory,
  CatalogProduct,
} from "@/hooks/useCatalogProducts";

const Catalog = () => {
  const [activeTab, setActiveTab] = useState("assets");

  // Assets hook (existente)
  const {
    assets,
    isLoading: isLoadingAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  } = useWorkspaceAssets();

  // Catalog hook (novo)
  const {
    categories,
    products,
    isLoading: isLoadingCatalog,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    stats,
  } = useCatalogProducts();

  // Asset states
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<WorkspaceAsset | null>(
    null,
  );
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [assetFilterType, setAssetFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [assetFormData, setAssetFormData] = useState({
    title: "",
    description: "",
    file_url: "",
    file_type: "image",
  });

  // Category states
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    icon: "📦",
  });

  // Product states
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productFilterCategory, setProductFilterCategory] =
    useState<string>("all");
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    price: "",
    price_text: "",
    image_url: "",
    is_featured: false,
  });

  // =====================================================
  // ASSET HANDLERS
  // =====================================================

  const handleCreateAsset = async () => {
    if (!assetFormData.title || !assetFormData.file_url) return;
    await createAsset.mutateAsync(assetFormData);
    setAssetFormData({
      title: "",
      description: "",
      file_url: "",
      file_type: "image",
    });
    setIsCreateAssetOpen(false);
  };

  const handleEditAsset = async () => {
    if (!selectedAsset || !assetFormData.title) return;
    await updateAsset.mutateAsync({ id: selectedAsset.id, ...assetFormData });
    setIsEditAssetOpen(false);
    setSelectedAsset(null);
  };

  const handleDeleteAsset = async (assetId: string) => {
    await deleteAsset.mutateAsync(assetId);
  };

  const openEditAssetDialog = (asset: WorkspaceAsset) => {
    setSelectedAsset(asset);
    setAssetFormData({
      title: asset.title,
      description: asset.description || "",
      file_url: asset.file_url,
      file_type: asset.file_type || "image",
    });
    setIsEditAssetOpen(true);
  };

  // =====================================================
  // CATEGORY HANDLERS
  // =====================================================

  const handleCreateCategory = async () => {
    if (!categoryFormData.name) return;
    await createCategory.mutateAsync(categoryFormData);
    setCategoryFormData({ name: "", description: "", icon: "📦" });
    setIsCreateCategoryOpen(false);
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !categoryFormData.name) return;
    await updateCategory.mutateAsync({
      id: selectedCategory.id,
      ...categoryFormData,
    });
    setIsEditCategoryOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await deleteCategory.mutateAsync(categoryId);
  };

  const openEditCategoryDialog = (category: ProductCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "📦",
    });
    setIsEditCategoryOpen(true);
  };

  // =====================================================
  // PRODUCT HANDLERS
  // =====================================================

  const handleCreateProduct = async () => {
    if (!productFormData.name) return;
    await createProduct.mutateAsync({
      name: productFormData.name,
      description: productFormData.description || undefined,
      category_id: productFormData.category_id || undefined,
      price: productFormData.price
        ? parseFloat(productFormData.price)
        : undefined,
      price_text: productFormData.price_text || undefined,
      image_url: productFormData.image_url || undefined,
      is_featured: productFormData.is_featured,
    });
    setProductFormData({
      name: "",
      description: "",
      category_id: "",
      price: "",
      price_text: "",
      image_url: "",
      is_featured: false,
    });
    setIsCreateProductOpen(false);
  };

  const handleEditProduct = async () => {
    if (!selectedProduct || !productFormData.name) return;
    await updateProduct.mutateAsync({
      id: selectedProduct.id,
      name: productFormData.name,
      description: productFormData.description || undefined,
      category_id: productFormData.category_id || null,
      price: productFormData.price ? parseFloat(productFormData.price) : null,
      price_text: productFormData.price_text || undefined,
      image_url: productFormData.image_url || undefined,
      is_featured: productFormData.is_featured,
    });
    setIsEditProductOpen(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct.mutateAsync(productId);
  };

  const openEditProductDialog = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description || "",
      category_id: product.category_id || "",
      price: product.price?.toString() || "",
      price_text: product.price_text || "",
      image_url: product.image_url || "",
      is_featured: product.is_featured,
    });
    setIsEditProductOpen(true);
  };

  // =====================================================
  // FILTERS
  // =====================================================

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(assetSearchTerm.toLowerCase());
    const matchesType =
      assetFilterType === "all" || asset.file_type === assetFilterType;
    return matchesSearch && matchesType;
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.description
        ?.toLowerCase()
        .includes(productSearchTerm.toLowerCase());
    const matchesCategory =
      productFilterCategory === "all" ||
      product.category_id === productFilterCategory;
    return matchesSearch && matchesCategory;
  });

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "pdf":
      case "document":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string | null) => {
    switch (type) {
      case "image":
        return "bg-blue-100 text-blue-800";
      case "pdf":
      case "document":
        return "bg-red-100 text-red-800";
      case "video":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: number | null, priceText: string | null) => {
    if (priceText) return priceText;
    if (price) return `R$ ${price.toFixed(2)}`;
    return "Sob consulta";
  };

  // =====================================================
  // FORM COMPONENTS
  // =====================================================

  const AssetForm = ({
    onSubmit,
    submitLabel,
  }: {
    onSubmit: () => void;
    submitLabel: string;
  }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Ex: Logo, Cardápio..."
          value={assetFormData.title}
          onChange={(e) =>
            setAssetFormData({ ...assetFormData, title: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descrição do ativo..."
          value={assetFormData.description}
          onChange={(e) =>
            setAssetFormData({ ...assetFormData, description: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file_url">URL do Arquivo *</Label>
        <Input
          id="file_url"
          placeholder="https://..."
          value={assetFormData.file_url}
          onChange={(e) =>
            setAssetFormData({ ...assetFormData, file_url: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file_type">Tipo</Label>
        <Select
          value={assetFormData.file_type}
          onValueChange={(value) =>
            setAssetFormData({ ...assetFormData, file_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Imagem</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="video">Vídeo</SelectItem>
            <SelectItem value="document">Documento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button
          onClick={onSubmit}
          disabled={!assetFormData.title || !assetFormData.file_url}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  const CategoryForm = ({
    onSubmit,
    submitLabel,
  }: {
    onSubmit: () => void;
    submitLabel: string;
  }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cat-name">Nome *</Label>
        <Input
          id="cat-name"
          placeholder="Ex: Pizzas, Cortes, Imóveis..."
          value={categoryFormData.name}
          onChange={(e) =>
            setCategoryFormData({ ...categoryFormData, name: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-desc">Descrição</Label>
        <Textarea
          id="cat-desc"
          placeholder="Descrição da categoria..."
          value={categoryFormData.description}
          onChange={(e) =>
            setCategoryFormData({
              ...categoryFormData,
              description: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-icon">Ícone (emoji)</Label>
        <Input
          id="cat-icon"
          placeholder="🍕"
          value={categoryFormData.icon}
          onChange={(e) =>
            setCategoryFormData({ ...categoryFormData, icon: e.target.value })
          }
          maxLength={4}
        />
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={!categoryFormData.name}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  const ProductForm = ({
    onSubmit,
    submitLabel,
  }: {
    onSubmit: () => void;
    submitLabel: string;
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prod-name">Nome *</Label>
          <Input
            id="prod-name"
            placeholder="Ex: Pizza Margherita..."
            value={productFormData.name}
            onChange={(e) =>
              setProductFormData({ ...productFormData, name: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-cat">Categoria</Label>
          <Select
            value={productFormData.category_id}
            onValueChange={(value) =>
              setProductFormData({ ...productFormData, category_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sem categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sem categoria</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="prod-desc">Descrição</Label>
        <Textarea
          id="prod-desc"
          placeholder="Descrição do produto..."
          value={productFormData.description}
          onChange={(e) =>
            setProductFormData({
              ...productFormData,
              description: e.target.value,
            })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prod-price">Preço (R$)</Label>
          <Input
            id="prod-price"
            type="number"
            step="0.01"
            placeholder="99.90"
            value={productFormData.price}
            onChange={(e) =>
              setProductFormData({ ...productFormData, price: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-price-text">Ou texto de preço</Label>
          <Input
            id="prod-price-text"
            placeholder="A partir de R$ 50"
            value={productFormData.price_text}
            onChange={(e) =>
              setProductFormData({
                ...productFormData,
                price_text: e.target.value,
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="prod-img">URL da Imagem</Label>
        <Input
          id="prod-img"
          placeholder="https://..."
          value={productFormData.image_url}
          onChange={(e) =>
            setProductFormData({
              ...productFormData,
              image_url: e.target.value,
            })
          }
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="prod-featured"
          checked={productFormData.is_featured}
          onCheckedChange={(checked) =>
            setProductFormData({ ...productFormData, is_featured: checked })
          }
        />
        <Label htmlFor="prod-featured">Produto em destaque</Label>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={!productFormData.name}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-muted-foreground">
            Gerencie produtos, categorias e ativos para usar nas conversas da IA
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Produtos</span>
              </div>
              <p className="text-2xl font-bold">{stats.availableProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Categorias
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.activeCategories}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Destaques</span>
              </div>
              <p className="text-2xl font-bold">{stats.featuredProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Ativos</span>
              </div>
              <p className="text-2xl font-bold">{assets.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="h-4 w-4" /> Categorias
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-2">
              <ImageIcon className="h-4 w-4" /> Ativos
            </TabsTrigger>
          </TabsList>

          {/* =====================================================
              TAB: PRODUTOS
              ===================================================== */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-1 gap-4 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={productFilterCategory}
                  onValueChange={setProductFilterCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog
                open={isCreateProductOpen}
                onOpenChange={setIsCreateProductOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Novo Produto</DialogTitle>
                    <DialogDescription>
                      Adicione um produto ao seu catálogo
                    </DialogDescription>
                  </DialogHeader>
                  <ProductForm
                    onSubmit={handleCreateProduct}
                    submitLabel="Adicionar"
                  />
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingCatalog ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Adicione produtos para que a IA possa enviá-los nas
                    conversas
                  </p>
                  <Button onClick={() => setIsCreateProductOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden group">
                    <div className="relative aspect-video bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/400x300?text=Sem+Imagem";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {product.is_featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" /> Destaque
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => openEditProductDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Excluir produto?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold truncate">
                            {product.name}
                          </h3>
                          {product.category && (
                            <Badge variant="outline" className="text-xs">
                              {product.category.icon} {product.category.name}
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <DollarSign className="h-3 w-3" />
                          {formatPrice(product.price, product.price_text)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Product Dialog */}
            <Dialog
              open={isEditProductOpen}
              onOpenChange={setIsEditProductOpen}
            >
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Editar Produto</DialogTitle>
                  <DialogDescription>
                    Atualize as informações do produto
                  </DialogDescription>
                </DialogHeader>
                <ProductForm
                  onSubmit={handleEditProduct}
                  submitLabel="Salvar"
                />
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* =====================================================
              TAB: CATEGORIAS
              ===================================================== */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Organize seus produtos em categorias para facilitar a navegação
              </p>
              <Dialog
                open={isCreateCategoryOpen}
                onOpenChange={setIsCreateCategoryOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                    <DialogDescription>
                      Crie uma categoria para organizar seus produtos
                    </DialogDescription>
                  </DialogHeader>
                  <CategoryForm
                    onSubmit={handleCreateCategory}
                    submitLabel="Criar"
                  />
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingCatalog ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma categoria
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crie categorias para organizar seus produtos
                  </p>
                  <Button onClick={() => setIsCreateCategoryOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Criar Categoria
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const productCount = products.filter(
                    (p) => p.category_id === category.id,
                  ).length;
                  return (
                    <Card key={category.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{category.icon}</span>
                            <div>
                              <CardTitle className="text-lg">
                                {category.name}
                              </CardTitle>
                              <CardDescription>
                                {productCount} produtos
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditCategoryDialog(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Excluir categoria?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Os produtos desta categoria ficarão sem
                                    categoria.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteCategory(category.id)
                                    }
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      {category.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Edit Category Dialog */}
            <Dialog
              open={isEditCategoryOpen}
              onOpenChange={setIsEditCategoryOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Categoria</DialogTitle>
                  <DialogDescription>
                    Atualize as informações da categoria
                  </DialogDescription>
                </DialogHeader>
                <CategoryForm
                  onSubmit={handleEditCategory}
                  submitLabel="Salvar"
                />
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* =====================================================
              TAB: ATIVOS (existente)
              ===================================================== */}
          <TabsContent value="assets" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-1 gap-4 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ativos..."
                    value={assetSearchTerm}
                    onChange={(e) => setAssetSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={assetFilterType}
                  onValueChange={setAssetFilterType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="image">Imagens</SelectItem>
                    <SelectItem value="pdf">PDFs</SelectItem>
                    <SelectItem value="video">Vídeos</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Dialog
                open={isCreateAssetOpen}
                onOpenChange={setIsCreateAssetOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Adicionar Ativo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Ativo</DialogTitle>
                    <DialogDescription>
                      Adicione uma imagem, PDF ou vídeo
                    </DialogDescription>
                  </DialogHeader>
                  <AssetForm
                    onSubmit={handleCreateAsset}
                    submitLabel="Adicionar"
                  />
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingAssets ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum ativo encontrado
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Adicione imagens, PDFs ou vídeos para usar nas conversas
                  </p>
                  <Button onClick={() => setIsCreateAssetOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Ativo
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => (
                  <Card key={asset.id} className="overflow-hidden group">
                    <div className="relative aspect-video bg-muted">
                      {asset.file_type === "image" ? (
                        <img
                          src={asset.file_url}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getTypeIcon(asset.file_type)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => openEditAssetDialog(asset)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" asChild>
                          <a
                            href={asset.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Excluir ativo?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAsset(asset.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {asset.title}
                          </h3>
                          {asset.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {asset.description}
                            </p>
                          )}
                        </div>
                        <Badge className={getTypeBadgeColor(asset.file_type)}>
                          {asset.file_type || "arquivo"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50"
                      >
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {asset.file_type === "image" ? (
                            <img
                              src={asset.file_url}
                              alt={asset.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getTypeIcon(asset.file_type)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{asset.title}</h3>
                          {asset.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {asset.description}
                            </p>
                          )}
                        </div>
                        <Badge className={getTypeBadgeColor(asset.file_type)}>
                          {asset.file_type || "arquivo"}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditAssetDialog(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" asChild>
                            <a
                              href={asset.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir ativo?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAsset(asset.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Asset Dialog */}
            <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Ativo</DialogTitle>
                  <DialogDescription>
                    Atualize as informações do ativo
                  </DialogDescription>
                </DialogHeader>
                <AssetForm onSubmit={handleEditAsset} submitLabel="Salvar" />
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Catalog;
