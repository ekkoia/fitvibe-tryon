import { useState } from "react";
import { MessageSquare, Upload, Image, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessingModal } from "@/components/tryon/ProcessingModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  phone: string;
  time: string;
  status: "pending" | "completed";
  hasPhoto: boolean;
}

interface Product {
  id: string;
  name: string;
  image: string;
}

const mockLeads: Lead[] = [
  { id: "r1", phone: "5511999998888", time: "11:14", status: "pending", hasPhoto: true },
  { id: "r2", phone: "5511988887777", time: "10:45", status: "completed", hasPhoto: true },
];

const mockProducts: Product[] = [
  { id: "1", name: "Legging Glow Black", image: "/placeholder.svg" },
  { id: "2", name: "Top Neon Support", image: "/placeholder.svg" },
  { id: "3", name: "Conjunto Compression Pro", image: "/placeholder.svg" },
];

export default function Atendimento() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(mockLeads[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clientPhoto, setClientPhoto] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClientPhoto(reader.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!clientPhoto || !selectedProduct) return;
    
    setIsProcessing(true);
    
    try {
      // Get the clothing image - for now using the product image
      // In production, you'd have actual base64 images for products
      const clothingImage = selectedProduct.image;
      
      // If product image is a URL, fetch and convert to base64
      let clothingBase64 = clothingImage;
      if (clothingImage.startsWith('/') || clothingImage.startsWith('http')) {
        const response = await fetch(clothingImage);
        const blob = await response.blob();
        clothingBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const { data, error } = await supabase.functions.invoke('tryon', {
        body: { 
          clientImage: clientPhoto, 
          clothingImage: clothingBase64 
        }
      });

      if (error) {
        console.error("Try-on error:", error);
        toast.error(error.message || "Erro ao gerar try-on");
        setIsProcessing(false);
        return;
      }

      if (data?.resultImage) {
        setResultImage(data.resultImage);
        toast.success("Try-on gerado com sucesso!");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error("Try-on error:", err);
      toast.error("Erro ao conectar com o serviço de IA");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessingComplete = () => {
    // This is now handled by the async function
    setIsProcessing(false);
  };

  const canGenerate = clientPhoto && selectedProduct;

  return (
    <div className="animate-fade-in min-h-[calc(100vh-7rem)]">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 h-full">
        {/* Leads Panel */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-48 lg:max-h-none">
          <div className="p-3 lg:p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground text-sm lg:text-base">INBOX LEADS</span>
            </div>
            <span className="px-2 lg:px-3 py-1 bg-primary text-primary-foreground text-[10px] lg:text-xs font-semibold rounded-full">
              NOVO LEAD
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {mockLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full p-3 lg:p-4 border-b border-border text-left transition-colors ${
                  selectedLead?.id === lead.id 
                    ? "bg-muted/50" 
                    : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1 lg:mb-2">
                  <span className="font-medium text-foreground text-sm lg:text-base">{lead.phone}</span>
                  <span className="text-[10px] lg:text-xs text-muted-foreground">{lead.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  {lead.hasPhoto && (
                    <Image className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground" />
                  )}
                  <span className={`status-badge text-[10px] lg:text-xs ${
                    lead.status === "pending" ? "status-pending" : "status-success"
                  }`}>
                    {lead.status === "pending" ? "PENDENTE" : "FINALIZADO"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Try-On Studio */}
        <div className="lg:col-span-9 bg-card border border-border rounded-xl overflow-hidden flex flex-col flex-1">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-border">
            <h1 className="text-xl lg:text-2xl title-display text-foreground">
              TRY-ON <span className="text-primary">STUDIO</span>
            </h1>
            {selectedLead && (
              <p className="text-xs lg:text-sm text-muted-foreground mt-1">
                Lead ID: {selectedLead.id}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-y-auto">
            {/* Client Photo Section */}
            <div className="flex-1 flex flex-col min-h-[200px] lg:min-h-0">
              <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 lg:mb-4">
                1. FOTO DO CLIENTE
              </h3>
              
              <div className="flex-1 border-2 border-dashed border-border rounded-xl flex items-center justify-center relative overflow-hidden hover:border-primary/50 transition-colors min-h-[180px]">
                {resultImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={resultImage}
                      alt="Resultado"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 lg:top-4 lg:right-4 flex items-center gap-1 lg:gap-2 bg-success/90 text-success-foreground px-2 lg:px-3 py-1 lg:py-1.5 rounded-full">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="text-[10px] lg:text-xs font-semibold">Try-On Completo</span>
                    </div>
                  </div>
                ) : clientPhoto ? (
                  <img
                    src={clientPhoto}
                    alt="Cliente"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 lg:gap-3 p-4 lg:p-8">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground text-sm lg:text-base">Upload Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Product Selection */}
            <div className="w-full lg:w-72 flex flex-col">
              <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 lg:mb-4">
                2. ESCOLHER ROUPA
              </h3>
              
              <div className="flex-1 space-y-2 lg:space-y-3 overflow-y-auto max-h-48 lg:max-h-none">
                {mockProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setResultImage(null);
                    }}
                    className={`w-full flex items-center gap-2 lg:gap-3 p-2 lg:p-3 rounded-xl border transition-all ${
                      selectedProduct?.id === product.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-muted/30"
                    }`}
                  >
                    <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium text-foreground text-left text-sm lg:text-base">
                      {product.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`mt-3 lg:mt-4 w-full py-4 lg:py-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm lg:text-base ${
                  canGenerate
                    ? "btn-lime"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
                GERAR RESULTADO
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      <ProcessingModal 
        isOpen={isProcessing} 
        onComplete={handleProcessingComplete} 
      />
    </div>
  );
}