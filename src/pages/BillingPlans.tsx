import { Check, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 127,
    credits: 100,
    features: ["100 try-ons/mês", "Integração WhatsApp", "Suporte por email"],
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 247,
    credits: 300,
    features: ["300 try-ons/mês", "Integração WhatsApp", "Suporte prioritário", "Relatórios avançados"],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 497,
    credits: 800,
    features: ["800 try-ons/mês", "Integração WhatsApp", "Suporte prioritário", "Relatórios avançados", "Marca customizada", "API access"],
    popular: false,
  },
];

const creditPackages = [
  { id: "small", credits: 50, price: 70, pricePerCredit: "R$ 1,40" },
  { id: "medium", credits: 100, price: 120, pricePerCredit: "R$ 1,20", popular: true },
  { id: "large", credits: 300, price: 300, pricePerCredit: "R$ 1,00", badge: "Melhor Custo" },
];

export default function BillingPlans() {
  const navigate = useNavigate();
  const { plan: currentPlan, planName } = useCredits();

  const handleSelectPlan = (planId: string) => {
    // TODO: Implement Stripe/payment integration in Phase 3
    toast.info("Integração de pagamento será implementada em breve!");
  };

  const handleBuyCredits = (packageId: string) => {
    // TODO: Implement Stripe/payment integration in Phase 3
    toast.info("Integração de pagamento será implementada em breve!");
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <h1 className="text-2xl md:text-3xl title-display text-foreground">
          PLANOS & <span className="text-primary">CRÉDITOS</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Escolha o plano ideal para sua operação ou compre créditos extras.
        </p>
        
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Plano atual: {planName}
          </span>
        </div>
      </div>

      {/* Plans Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Planos Mensais</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-card border rounded-xl p-6 flex flex-col ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
                } ${isCurrent ? "bg-primary/5" : ""}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Mais Popular
                  </span>
                )}
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">R$ {plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
                
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                  className={`w-full ${plan.popular && !isCurrent ? "btn-lime" : ""}`}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Plano Atual" : "Escolher Plano"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Packages Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Créditos Extras</h2>
        <p className="text-sm text-muted-foreground mb-4">
          💡 Créditos extras nunca expiram e são consumidos primeiro!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-card border rounded-xl p-6 ${
                pkg.popular ? "border-primary" : "border-border"
              }`}
            >
              {pkg.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  {pkg.badge}
                </span>
              )}
              {pkg.popular && !pkg.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Mais Popular
                </span>
              )}
              
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-foreground">+{pkg.credits}</p>
                <p className="text-sm text-muted-foreground">créditos</p>
              </div>
              
              <div className="text-center mb-4">
                <span className="text-2xl font-bold text-foreground">R$ {pkg.price}</span>
                <p className="text-xs text-muted-foreground mt-1">{pkg.pricePerCredit}/try-on</p>
              </div>
              
              <Button
                onClick={() => handleBuyCredits(pkg.id)}
                variant="outline"
                className="w-full"
              >
                Comprar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
