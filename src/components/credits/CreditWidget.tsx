import { Zap, AlertTriangle, Clock, ShoppingCart } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditWidgetProps {
  onBuyCredits?: () => void;
  compact?: boolean;
}

export function CreditWidget({ onBuyCredits, compact = false }: CreditWidgetProps) {
  const {
    planCredits,
    extraCredits,
    totalCredits,
    plan,
    planName,
    daysToRenew,
    daysToTrialEnd,
    isBlocked,
    blockReason,
    loading,
  } = useCredits();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  // Calculate usage percentage (for visual progress)
  const maxCredits = plan === "trial" ? 50 : plan === "starter" ? 100 : plan === "growth" ? 300 : 800;
  const usagePercent = Math.min(100, ((maxCredits - planCredits) / maxCredits) * 100);
  const isLowCredits = totalCredits <= 20 && totalCredits > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{totalCredits}</span>
        <span className="text-xs text-muted-foreground">créditos</span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Créditos Disponíveis
              </p>
              <p className="text-2xl font-bold text-foreground">{totalCredits}</p>
            </div>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
          {planName}
        </span>
      </div>

      {/* Credits breakdown */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Créditos do plano:</span>
          <span className="font-medium text-foreground">{planCredits}</span>
        </div>
        <div className="flex justify-between">
          <span>Créditos extras:</span>
          <span className="font-medium text-foreground">{extraCredits}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={100 - usagePercent} className="h-2" />
        <p className="text-[10px] text-muted-foreground text-right">
          {planCredits} de {maxCredits} do plano
        </p>
      </div>

      {/* Renewal info */}
      {plan === "trial" ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Trial expira em {daysToTrialEnd} dias</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Renova em {daysToRenew} dias</span>
        </div>
      )}

      {/* Low credits warning */}
      {isLowCredits && !isBlocked && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-warning">Créditos acabando!</p>
            <p className="text-[10px] text-muted-foreground">
              Compre mais créditos para continuar gerando try-ons.
            </p>
          </div>
        </div>
      )}

      {/* Blocked state */}
      {isBlocked && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-destructive">
              {blockReason === "TRIAL_EXPIRED" ? "Trial expirado" : "Sem créditos"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {blockReason === "TRIAL_EXPIRED"
                ? "Escolha um plano para continuar."
                : "Compre créditos extras ou aguarde a renovação."}
            </p>
          </div>
        </div>
      )}

      {/* Buy credits button */}
      {onBuyCredits && (isLowCredits || isBlocked) && (
        <Button
          onClick={onBuyCredits}
          variant={isBlocked ? "default" : "outline"}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {blockReason === "TRIAL_EXPIRED" ? "Ver Planos" : "Comprar Créditos"}
        </Button>
      )}
    </div>
  );
}
