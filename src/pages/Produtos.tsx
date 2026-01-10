import { useState } from "react";
import { Plus, Search, MoreVertical, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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

interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  status: "active" | "inactive";
}

const initialProducts: Product[] = [
  { id: "1", name: "Legging Glow Black", category: "Legging", image: "/placeholder.svg", status: "active" },
  { id: "2", name: "Top Neon Support", category: "Top", image: "/placeholder.svg", status: "active" },
  { id: "3", name: "Conjunto Compression Pro", category: "Conjunto", image: "/placeholder.svg", status: "active" },
  { id: "4", name: "Shorts Power Flex", category: "Shorts", image: "/placeholder.svg", status: "active" },
];

const categories = ["Top", "Legging", "Shorts", "Conjunto"];

export default function Produtos() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "" });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.category) {
      setProducts([
        ...products,
        {
          id: Date.now().toString(),
          name: newProduct.name,
          category: newProduct.category,
          image: "/placeholder.svg",
          status: "active",
        },
      ]);
      setNewProduct({ name: "", category: "" });
      setIsDialogOpen(false);
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
                <div className="mt-1.5 border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique para fazer upload
                  </p>
                </div>
              </div>
              <Button onClick={handleAddProduct} className="btn-lime w-full">
                Adicionar Produto
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="aspect-square bg-muted relative overflow-hidden">
              <img
                src={product.image}
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

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  );
}