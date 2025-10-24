import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_en: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  daily_message_limit: number;
  max_concurrent_chats: number;
  history_days: number;
  priority_level: number;
  has_auto_routing: boolean;
  has_api_access: boolean;
  has_team_collaboration: boolean;
  team_member_limit: number;
  allowed_models: string[];
  features: string[];
  sort_order: number;
  is_recommended: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'expired' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method?: string;
}

export interface UsageStats {
  id: string;
  user_id: string;
  date: string;
  message_count: number;
  token_count: number;
  model_usage: Record<string, number>;
}

export async function getCurrentUserSubscription(): Promise<UserSubscription | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const newSubscription = await createDefaultSubscription(user.id);
      return newSubscription;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

async function createDefaultSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 100);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: 'explorer',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating default subscription:', error);
    return null;
  }
}

export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }
}

export async function getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

export async function getTodayUsageStats(): Promise<UsageStats | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return null;
  }
}

export async function incrementMessageCount(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: existingStats } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (existingStats) {
      await supabase
        .from('usage_stats')
        .update({ message_count: existingStats.message_count + 1 })
        .eq('id', existingStats.id);
    } else {
      await supabase
        .from('usage_stats')
        .insert({
          user_id: user.id,
          date: today,
          message_count: 1,
        });
    }
  } catch (error) {
    console.error('Error incrementing message count:', error);
  }
}

export async function checkMessageLimit(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  try {
    const subscription = await getCurrentUserSubscription();
    if (!subscription) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    const plan = await getSubscriptionPlan(subscription.plan_id);
    if (!plan) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    if (plan.daily_message_limit === -1) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    const usage = await getTodayUsageStats();
    const currentCount = usage?.message_count || 0;
    const remaining = Math.max(0, plan.daily_message_limit - currentCount);

    return {
      allowed: currentCount < plan.daily_message_limit,
      remaining,
      limit: plan.daily_message_limit,
    };
  } catch (error) {
    console.error('Error checking message limit:', error);
    return { allowed: false, remaining: 0, limit: 0 };
  }
}

export function isModelAllowed(modelId: string, allowedModels: string[]): boolean {
  if (allowedModels.includes('*')) return true;

  return allowedModels.some(pattern => {
    if (pattern === modelId) return true;
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return modelId.startsWith(prefix + '/');
    }
    return false;
  });
}

export async function filterAllowedModels(models: Array<{ id: string; label: string }>): Promise<Array<{ id: string; label: string }>> {
  try {
    const subscription = await getCurrentUserSubscription();
    if (!subscription) return models;

    const plan = await getSubscriptionPlan(subscription.plan_id);
    if (!plan) return models;

    return models.filter(model => isModelAllowed(model.id, plan.allowed_models));
  } catch (error) {
    console.error('Error filtering allowed models:', error);
    return models;
  }
}
