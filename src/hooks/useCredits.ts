import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type BlockReason = "TRIAL_EXPIRED" | "NO_CREDITS" | null;

interface CreditsData {
  planCredits: number;
  extraCredits: number;
  totalCredits: number;
  plan: string;
  planName: string;
  trialEndsAt: Date | null;
  planRenewsAt: Date | null;
  isBlocked: boolean;
  blockReason: BlockReason;
  daysToRenew: number;
  daysToTrialEnd: number;
}

interface UseCreditsReturn extends CreditsData {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  canGenerateTryOn: () => Promise<{ allowed: boolean; reason?: string }>;
  consumeCredit: () => Promise<{ success: boolean; creditsRemaining?: number; error?: string }>;
}

const planNames: Record<string, string> = {
  trial: "Trial Grátis",
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
};

export function useCredits(): UseCreditsReturn {
  const { store } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CreditsData>({
    planCredits: 0,
    extraCredits: 0,
    totalCredits: 0,
    plan: "trial",
    planName: "Trial Grátis",
    trialEndsAt: null,
    planRenewsAt: null,
    isBlocked: false,
    blockReason: null,
    daysToRenew: 0,
    daysToTrialEnd: 0,
  });

  const calculateDaysRemaining = (date: Date | null): number => {
    if (!date) return 0;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const fetchCreditsData = useCallback(async () => {
    if (!store?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("plan, plan_credits, extra_credits, trial_ends_at, plan_renews_at")
        .eq("id", store.id)
        .single();

      if (storeError) throw storeError;

      const planCredits = storeData?.plan_credits ?? 0;
      const extraCredits = storeData?.extra_credits ?? 0;
      const totalCredits = planCredits + extraCredits;
      const plan = storeData?.plan ?? "trial";
      const trialEndsAt = storeData?.trial_ends_at ? new Date(storeData.trial_ends_at) : null;
      const planRenewsAt = storeData?.plan_renews_at ? new Date(storeData.plan_renews_at) : null;

      // Check if blocked
      let isBlocked = false;
      let blockReason: BlockReason = null;

      if (plan === "trial" && trialEndsAt && trialEndsAt < new Date()) {
        isBlocked = true;
        blockReason = "TRIAL_EXPIRED";
      } else if (totalCredits <= 0) {
        isBlocked = true;
        blockReason = "NO_CREDITS";
      }

      setData({
        planCredits,
        extraCredits,
        totalCredits,
        plan,
        planName: planNames[plan] || plan,
        trialEndsAt,
        planRenewsAt,
        isBlocked,
        blockReason,
        daysToRenew: calculateDaysRemaining(planRenewsAt),
        daysToTrialEnd: calculateDaysRemaining(trialEndsAt),
      });
    } catch (err) {
      console.error("Error fetching credits:", err);
      setError("Erro ao carregar créditos");
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  // Initial fetch
  useEffect(() => {
    fetchCreditsData();
  }, [fetchCreditsData]);

  // Real-time subscription for credit updates
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel(`store-credits-${store.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${store.id}`,
        },
        (payload) => {
          console.log('Credits updated via realtime:', payload);
          // Update state directly from payload to avoid extra fetch
          const newData = payload.new as {
            plan_credits?: number;
            extra_credits?: number;
            plan?: string;
            trial_ends_at?: string;
            plan_renews_at?: string;
          };
          
          const planCredits = newData.plan_credits ?? 0;
          const extraCredits = newData.extra_credits ?? 0;
          const totalCredits = planCredits + extraCredits;
          const plan = newData.plan ?? "trial";
          const trialEndsAt = newData.trial_ends_at ? new Date(newData.trial_ends_at) : null;
          const planRenewsAt = newData.plan_renews_at ? new Date(newData.plan_renews_at) : null;

          let isBlocked = false;
          let blockReason: BlockReason = null;

          if (plan === "trial" && trialEndsAt && trialEndsAt < new Date()) {
            isBlocked = true;
            blockReason = "TRIAL_EXPIRED";
          } else if (totalCredits <= 0) {
            isBlocked = true;
            blockReason = "NO_CREDITS";
          }

          setData({
            planCredits,
            extraCredits,
            totalCredits,
            plan,
            planName: planNames[plan] || plan,
            trialEndsAt,
            planRenewsAt,
            isBlocked,
            blockReason,
            daysToRenew: calculateDaysRemaining(planRenewsAt),
            daysToTrialEnd: calculateDaysRemaining(trialEndsAt),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id]);

  const canGenerateTryOn = useCallback(async (): Promise<{ allowed: boolean; reason?: string }> => {
    if (!store?.id) {
      return { allowed: false, reason: "STORE_NOT_FOUND" };
    }

    try {
      const { data: result, error } = await supabase.rpc("can_generate_tryon", {
        p_store_id: store.id,
      });

      if (error) throw error;

      // Cast result to expected type
      const typedResult = result as { allowed?: boolean; reason?: string } | null;

      return {
        allowed: typedResult?.allowed ?? false,
        reason: typedResult?.reason,
      };
    } catch (err) {
      console.error("Error checking tryon permission:", err);
      return { allowed: false, reason: "ERROR" };
    }
  }, [store?.id]);

  const consumeCredit = useCallback(async (): Promise<{ success: boolean; creditsRemaining?: number; error?: string }> => {
    if (!store?.id) {
      return { success: false, error: "STORE_NOT_FOUND" };
    }

    try {
      const { data: result, error } = await supabase.rpc("consume_credit", {
        p_store_id: store.id,
      });

      if (error) throw error;

      // Cast result to expected type
      const typedResult = result as { success?: boolean; credits_remaining?: number; error?: string } | null;

      if (typedResult?.success) {
        // No need to refetch - realtime will update the state
        return {
          success: true,
          creditsRemaining: typedResult.credits_remaining,
        };
      }

      return { success: false, error: typedResult?.error };
    } catch (err) {
      console.error("Error consuming credit:", err);
      return { success: false, error: "ERROR" };
    }
  }, [store?.id]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchCreditsData,
    canGenerateTryOn,
    consumeCredit,
  };
}
