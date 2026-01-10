import { Lock, Frown, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCredits, BlockReason } from "@/hooks/useCredits";

interface BlockedScreenProps {
  reason: BlockReason;
  onViewPlans?: () => void;
  onBuyCredits?: () => void;
}

export function BlockedScreen({ reason, onViewPlans, onBuyCredits }: BlockedScreenProps) {
  const { daysToRenew, planName } = useCredits();

  if (reason === "TRIAL_EXPIRED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Trial Expirado
        </h2>
        
        <p className="text-muted-foreground max-w-md mb-6">
          Seu período de testes de 14 dias acabou. Para continuar usando o provador virtual, 
          escolha um dos nossos planos.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onViewPlans} size="lg" className="gap-2">
            <Zap className="w-4 h-4" />
            Ver Planos
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-8">
          Seus dados estão seguros. Ao escolher um plano, você retoma de onde parou.
        </p>
      </div>
    );
  }

  if (reason === "NO_CREDITS") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
          <Frown className="w-10 h-10 text-warning" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Sem Créditos
        </h2>
        
        <p className="text-muted-foreground max-w-md mb-2">
          Você usou todos os seus créditos do mês.
        </p>
        
        {daysToRenew > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            Sua renovação automática acontece em <span className="font-semibold text-foreground">{daysToRenew} dias</span>.
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onBuyCredits} size="lg" className="gap-2">
            <Zap className="w-4 h-4" />
            Comprar Créditos Extras
          </Button>
          
          <Button onClick={onViewPlans} variant="outline" size="lg">
            Fazer Upgrade
          </Button>
        </div>
        
        <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-sm">
          <p className="text-xs text-muted-foreground">
            💡 <span className="font-medium">Dica:</span> Créditos extras nunca expiram e são consumidos primeiro, 
            protegendo seus créditos mensais.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
