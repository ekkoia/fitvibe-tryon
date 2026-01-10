import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-6">
          <BarChart3 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl title-display text-muted-foreground">
          MÓDULO EM DESENVOLVIMENTO
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Em breve você terá acesso a métricas avançadas, gráficos de conversão e insights sobre seus try-ons.
        </p>
      </div>
    </div>
  );
}