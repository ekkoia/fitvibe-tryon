import { useState, useRef, useEffect } from "react";
import { Plus, Search, MoreVertical, Tag, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  status: string;
}

const categories = ["Top", "Legging", "Shorts", "Conjunto"];

export default function Produtos() {
  const { store } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "" });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!store?.id) {
      toast.error('Loja não encontrada. Faça login novamente.');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          category: newProduct.category,
          image_url: selectedImage,
          status: 'active',
          store_id: store.id
        })
        .select()
        .single();

      if (error) throw error;

      setProducts([data, ...products]);
      setNewProduct({ name: "", category: "" });
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsDialogOpen(false);
      toast.success('Produto adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Erro ao adicionar produto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl title-display text-foreground">
            CATÁLOGO DE <span className="text-primary">PRODUTOS</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Gerencie as peças fitness disponíveis para try-on virtual.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-lime flex items-center gap-2 w-full sm:w-auto">
              <Plus className="w-5 h-5" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-[calc(100%-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="title-display text-xl">
                ADICIONAR <span className="text-primary">PRODUTO</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Formulário para adicionar um novo produto ao catálogo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ex: Legging Power Black"
                  className="mt-1.5 bg-muted border-border"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                >
                  <SelectTrigger className="mt-1.5 bg-muted border-border">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Imagem do Produto</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                {selectedImage ? (
                  <div className="mt-1.5 relative rounded-xl overflow-hidden border border-border">
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearSelectedImage}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clique para fazer upload
                    </p>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleAddProduct} 
                className="btn-lime w-full"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Adicionar Produto'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar produto..."
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="aspect-square bg-muted relative overflow-hidden">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors">
                    <MoreVertical className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-2">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {product.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  );
}
