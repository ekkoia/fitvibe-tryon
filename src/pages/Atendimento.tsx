import { useState } from "react";
import { MessageSquare, Upload, Image, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessingModal } from "@/components/tryon/ProcessingModal";

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

  const handleGenerate = () => {
    if (clientPhoto && selectedProduct) {
      setIsProcessing(true);
    }
  };

  const handleProcessingComplete = () => {
    setIsProcessing(false);
    // Simulate a result - in real app this would come from AI
    setResultImage(clientPhoto);
  };

  const canGenerate = clientPhoto && selectedProduct;

  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)]">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Leads Panel */}
        <div className="col-span-3 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">INBOX LEADS</span>
            </div>
            <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
              NOVO LEAD
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {mockLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full p-4 border-b border-border text-left transition-colors ${
                  selectedLead?.id === lead.id 
                    ? "bg-muted/50" 
                    : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{lead.phone}</span>
                  <span className="text-xs text-muted-foreground">{lead.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  {lead.hasPhoto && (
                    <Image className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={`status-badge ${
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
        <div className="col-span-9 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl title-display text-foreground">
              TRY-ON <span className="text-primary">STUDIO</span>
            </h1>
            {selectedLead && (
              <p className="text-sm text-muted-foreground mt-1">
                Lead ID: {selectedLead.id}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex gap-6">
            {/* Client Photo Section */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                1. FOTO DO CLIENTE
              </h3>
              
              <div className="flex-1 border-2 border-dashed border-border rounded-xl flex items-center justify-center relative overflow-hidden hover:border-primary/50 transition-colors">
                {resultImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={resultImage}
                      alt="Resultado"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-success/90 text-success-foreground px-3 py-1.5 rounded-full">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-semibold">Try-On Completo</span>
                    </div>
                  </div>
                ) : clientPhoto ? (
                  <img
                    src={clientPhoto}
                    alt="Cliente"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 p-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">Upload Foto</span>
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
            <div className="w-72 flex flex-col">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                2. ESCOLHER ROUPA
              </h3>
              
              <div className="flex-1 space-y-3 overflow-y-auto">
                {mockProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setResultImage(null);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedProduct?.id === product.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-muted/30"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium text-foreground text-left">
                      {product.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`mt-4 w-full py-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  canGenerate
                    ? "btn-lime"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-5 h-5" />
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