import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export function useSubscription() {
  const [subscription, setSubscription] = useState({
    plan: 'free',
    status: 'active',
    expiresAt: null,
    isPremium: false,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription({
          plan: 'free',
          status: 'active',
          expiresAt: null,
          isPremium: false,
          loading: false,
        });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSubscription({
          plan: 'free',
          status: 'active',
          expiresAt: null,
          isPremium: false,
          loading: false,
        });
        return;
      }

      const isUnexpired = data.expires_at ? new Date(data.expires_at) > new Date() : false;
      const isPremium = (data.plan === 'premium' && ['active', 'cancelled'].includes(data.status) && isUnexpired);

      setSubscription({
        plan: data.plan,
        status: isUnexpired ? data.status : 'expired',
        expiresAt: data.expires_at,
        isPremium,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to verify subscription:', err);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return { ...subscription, refreshSubscription: checkSubscription };
}