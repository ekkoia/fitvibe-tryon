import { Zap, CreditCard, TrendingUp, Users, BarChart3 } from "lucide-react";

const metrics = [
  { 
    icon: Zap, 
    label: "TOTAL TRY-ONS", 
    value: "124",
    trend: "+12%"
  },
  { 
    icon: CreditCard, 
    label: "CREDITS LEFT", 
    value: "376",
    trend: null
  },
  { 
    icon: TrendingUp, 
    label: "SUCCESS RATE", 
    value: "98.2%",
    trend: "+2.1%"
  },
  { 
    icon: Users, 
    label: "AVG RESPONSE", 
    value: "12s",
    trend: "-3s"
  },
];

const recentActivity = [
  { id: "#4821", device: "MOBILE DEVICE", location: "SÃO PAULO", status: "FINALIZADO" },
  { id: "#4822", device: "MOBILE DEVICE", location: "SÃO PAULO", status: "FINALIZADO" },
  { id: "#4823", device: "MOBILE DEVICE", location: "SÃO PAULO", status: "FINALIZADO" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Live Engine Monitoring
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl title-display text-foreground">
          COMMAND <span className="text-primary">CENTER</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Visão analítica do seu motor de provador virtual fotorrealista.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.label} 
              className="metric-card group hover:border-primary/30 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                {metric.trend && (
                  <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                    {metric.trend}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                {metric.label}
              </p>
              <p className="text-xl font-bold text-foreground">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h2 className="text-sm title-display text-foreground">
              ATIVIDADE RECENTE
            </h2>
          </div>
          
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Lead {activity.id}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {activity.device} • {activity.location}
                    </p>
                  </div>
                </div>
                <span className="status-badge status-success">
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="bg-primary rounded-xl p-6 flex flex-col justify-between glow-lime">
          <div>
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg title-display text-primary-foreground mb-2">
              ESCALA GLOBAL
            </h3>
            <p className="text-primary-foreground/70 text-xs">
              Inicie agora sua jornada no provador virtual.
            </p>
          </div>
          <button className="mt-6 w-full bg-primary-foreground text-primary font-semibold py-2.5 rounded-lg hover:bg-primary-foreground/90 transition-colors text-sm">
            UPGRADE PRO
          </button>
        </div>
      </div>
    </div>
  );
}