import { useState, useEffect } from "react";
import { MessageSquare, Upload, Image, Sparkles, Check, Loader2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessingModal } from "@/components/tryon/ProcessingModal";
import { BlockedScreen } from "@/components/credits/BlockedScreen";
import { CreditWidget } from "@/components/credits/CreditWidget";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  image_url: string | null;
}

const mockLeads: Lead[] = [
  { id: "r1", phone: "5511999998888", time: "11:14", status: "pending", hasPhoto: true },
  { id: "r2", phone: "5511988887777", time: "10:45", status: "completed", hasPhoto: true },
];

export default function Atendimento() {
  const navigate = useNavigate();
  const { isBlocked, blockReason, canGenerateTryOn, consumeCredit, refetch: refetchCredits } = useCredits();
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(mockLeads[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clientPhoto, setClientPhoto] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultDescription, setResultDescription] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoadingProducts(false);
    }
  };

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
    
    // Check if user can generate try-on
    const check = await canGenerateTryOn();
    if (!check.allowed) {
      if (check.reason === "TRIAL_EXPIRED") {
        toast.error("Seu trial expirou. Escolha um plano para continuar.");
      } else if (check.reason === "NO_CREDITS") {
        toast.error("Você não tem créditos suficientes.");
      } else {
        toast.error("Não foi possível verificar seus créditos.");
      }
      return;
    }
    
    setIsProcessing(true);
    setIsFinalizing(false);
    
    try {
      const clothingImage = selectedProduct.image_url;
      
      if (!clothingImage) {
        toast.error("Produto não possui imagem");
        setIsProcessing(false);
        return;
      }
      
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
        setIsFinalizing(false);
        return;
      }

      if (data?.resultImage) {
        // Consume credit after successful generation
        const consumeResult = await consumeCredit();
        if (!consumeResult.success) {
          console.warn("Failed to consume credit:", consumeResult.error);
        }
        
        setResultImage(data.resultImage);
        setResultDescription(data.description || null);
        setIsFinalizing(false);
        toast.success("Try-on gerado com sucesso!");
        
        // Refetch credits to update UI
        refetchCredits();
      } else if (data?.error) {
        setIsFinalizing(false);
        toast.error(data.error);
      }
    } catch (err) {
      console.error("Try-on error:", err);
      toast.error("Erro ao conectar com o serviço de IA");
      setIsFinalizing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessingComplete = () => {
    // Modal animation finished, now show finalizing state
    setIsProcessing(false);
    setIsFinalizing(true);
  };

  const handleNewSimulation = () => {
    setResultImage(null);
    setResultDescription(null);
    setSelectedProduct(null);
    setIsFinalizing(false);
    // Keep clientPhoto so user doesn't need to upload again
  };

  const handleSaveResult = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `tryon-${selectedProduct?.name || 'resultado'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagem salva com sucesso!");
  };

  const canGenerate = clientPhoto && selectedProduct && !resultImage && !isBlocked;

  // Show blocked screen if user cannot generate try-ons
  if (isBlocked && blockReason) {
    return (
      <div className="animate-fade-in">
        <BlockedScreen
          reason={blockReason}
          onViewPlans={() => navigate("/billing/plans")}
          onBuyCredits={() => navigate("/billing/plans")}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-[calc(100vh-7rem)]">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 h-full">
        {/* Leads Panel */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-48 lg:max-h-none">
          {/* Header */}
          <div className="p-3 lg:p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground text-sm lg:text-base">INBOX LEADS</span>
            </div>
            <button className="px-3 lg:px-4 py-1.5 bg-primary text-primary-foreground text-[10px] lg:text-xs font-semibold rounded-full hover:bg-primary/90 transition-colors">
              NOVO LEAD
            </button>
          </div>
          
          {/* Leads List */}
          <div className="flex-1 overflow-y-auto">
            {mockLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full p-3 lg:p-4 border-b border-border text-left transition-colors hover:bg-muted/30 relative ${
                  selectedLead?.id === lead.id ? "bg-muted/20" : ""
                }`}
              >
                {/* Selection indicator bar */}
                {selectedLead?.id === lead.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                {/* Phone + Time */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground text-sm lg:text-base">{lead.phone}</span>
                  <span className="text-[10px] lg:text-xs text-muted-foreground">{lead.time}</span>
                </div>
                {/* Icon + Status */}
                <div className="flex items-center gap-2">
                  {lead.hasPhoto && (
                    <div className="w-6 h-6 lg:w-7 lg:h-7 rounded bg-muted/50 flex items-center justify-center">
                      <Image className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground" />
                    </div>
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
            {/* Client Photo / Result Section */}
            <div className="flex-1 flex flex-col min-h-[200px] lg:min-h-0">
              <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 lg:mb-4">
                {resultImage ? "RESULTADO" : "1. FOTO DO CLIENTE"}
              </h3>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-md aspect-[3/4] border-2 border-dashed border-border rounded-2xl flex items-center justify-center relative overflow-hidden hover:border-primary/50 transition-colors bg-muted/20">
                  {resultImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={resultImage}
                        alt="Resultado"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 lg:top-4 lg:right-4 flex items-center gap-1 lg:gap-2 bg-primary text-primary-foreground px-2 lg:px-3 py-1 lg:py-1.5 rounded-full">
                        <Check className="w-3 h-3 lg:w-4 lg:h-4" />
                        <span className="text-[10px] lg:text-xs font-semibold">Try-On Completo</span>
                      </div>
                    </div>
                  ) : isFinalizing ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-8">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-muted" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">Finalizando resultado...</p>
                        <p className="text-sm text-muted-foreground mt-1">Quase lá! Preparando sua imagem.</p>
                      </div>
                    </div>
                  ) : clientPhoto ? (
                    <img
                      src={clientPhoto}
                      alt="Cliente"
                      className="w-full h-full object-cover"
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
            </div>

            {/* Right Panel - Product Selection or Result Info */}
            <div className="w-full lg:w-72 flex flex-col">
              {resultImage && selectedProduct ? (
                // Result Info Panel
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-4">
                    {/* Title */}
                    <div>
                      <h2 className="text-2xl lg:text-3xl title-display text-foreground">
                        SÍNTESE <span className="text-primary">REALISTA</span>
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        {resultDescription || "As estampas e cores foram transferidas com precisão cromática, adaptando-se às dobras e luz do corpo."}
                      </p>
                    </div>

                    {/* Reference Applied Card */}
                    <div className="bg-muted/50 border border-border rounded-xl p-3 lg:p-4 flex items-center gap-3">
                      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        <img
                          src={selectedProduct.image_url || "/placeholder.svg"}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-primary">
                          REFERÊNCIA APLICADA
                        </span>
                        <p className="text-sm font-medium text-foreground mt-0.5">
                          {selectedProduct.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mt-4">
                    <Button
                      onClick={handleSaveResult}
                      className="w-full py-4 lg:py-6 rounded-xl font-semibold flex items-center justify-center gap-2 btn-lime"
                    >
                      <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                      SALVAR RESULTADO
                    </Button>
                    <Button
                      onClick={handleNewSimulation}
                      variant="outline"
                      className="w-full py-4 lg:py-6 rounded-xl font-semibold flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/10"
                    >
                      <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5" />
                      NOVA SIMULAÇÃO
                    </Button>
                  </div>
                </div>
              ) : (
                // Product Selection Panel
                <>
                  <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 lg:mb-4">
                    2. ESCOLHER ROUPA
                  </h3>
                  
                  {/* Container card para produtos */}
                  <div className="flex-1 bg-muted/30 border border-border rounded-xl p-3 lg:p-4 flex flex-col">
                    <div className="flex-1 space-y-2 lg:space-y-3 overflow-y-auto max-h-48 lg:max-h-none">
                      {isLoadingProducts ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            Nenhum produto cadastrado.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Adicione produtos na página Produtos.
                          </p>
                        </div>
                      ) : (
                        products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setSelectedProduct(product);
                              setResultImage(null);
                            }}
                            className={`w-full flex items-center gap-2 lg:gap-3 p-2 lg:p-3 rounded-xl border transition-all ${
                              selectedProduct?.id === product.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 bg-card"
                            }`}
                          >
                            <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-medium text-foreground text-left text-sm lg:text-base">
                              {product.name}
                            </span>
                          </button>
                        ))
                      )}
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
                </>
              )}
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
