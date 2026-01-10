import { useEffect, useState } from "react";
import { User, Shirt, Zap, Sparkles, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ProcessingStep {
  icon: typeof User;
  label: string;
  completed: boolean;
  active: boolean;
}

interface ProcessingModalProps {
  isOpen: boolean;
  isWaitingResult: boolean;
  onStepsComplete: () => void;
}

const initialSteps: ProcessingStep[] = [
  { icon: User, label: "Analisando anatomia do cliente...", completed: false, active: false },
  { icon: Shirt, label: "Segmentando peça de roupa...", completed: false, active: false },
  { icon: Zap, label: "Aplicando caimento e compressão...", completed: false, active: false },
  { icon: Sparkles, label: "Finalizando iluminação realista...", completed: false, active: false },
];

export function ProcessingModal({ isOpen, isWaitingResult, onStepsComplete }: ProcessingModalProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps);
  const [stepsFinished, setStepsFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSteps(initialSteps);
      setStepsFinished(false);
      return;
    }

    const processSteps = async () => {
      for (let i = 0; i < initialSteps.length; i++) {
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          active: idx === i,
          completed: idx < i,
        })));

        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      setSteps(prev => prev.map(step => ({
        ...step,
        active: false,
        completed: true,
      })));

      setStepsFinished(true);
      onStepsComplete();
    };

    processSteps();
  }, [isOpen, onStepsComplete]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-md" hideCloseButton>
        <div className="py-6 text-center">
          {/* Spinner */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {stepsFinished && isWaitingResult ? "Quase lá..." : "Transformando..."}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            {stepsFinished && isWaitingResult ? (
              <>Aguarde enquanto finalizamos a<br />síntese da imagem...</>
            ) : (
              <>Nossa IA está vestindo a peça fitness com<br />precisão técnica e realismo.</>
            )}
          </p>

          {/* Steps or Waiting State */}
          {stepsFinished && isWaitingResult ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-primary font-medium">
                Gerando resultado final...
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-left">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      step.active 
                        ? "bg-primary/10" 
                        : step.completed 
                          ? "opacity-50" 
                          : "opacity-30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      step.active 
                        ? "bg-primary/20" 
                        : step.completed 
                          ? "bg-success/20" 
                          : "bg-muted"
                    }`}>
                      {step.completed ? (
                        <Check className="w-5 h-5 text-success" />
                      ) : (
                        <Icon className={`w-5 h-5 ${step.active ? "text-primary" : "text-muted-foreground"}`} />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      step.active ? "text-primary" : "text-foreground"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}