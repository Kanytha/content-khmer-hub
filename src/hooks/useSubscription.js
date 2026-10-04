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

      if (error) {
        console.warn('Subscription fetch notice:', error.message);
      }

      // Check if Supabase has a valid active record
      if (data && data.plan === 'premium') {
        const isUnexpired = data.expires_at ? new Date(data.expires_at) > new Date() : false;
        const isPrem = ['active', 'cancelled'].includes(data.status) && isUnexpired;

        if (isPrem) {
          setSubscription({
            plan: 'premium',
            status: isUnexpired ? data.status : 'expired',
            expiresAt: data.expires_at,
            isPremium: true,
            loading: false,
          });
          return;
        }
      }

      const userSubKey = `ckh_subscription_${user.id}`;
      const localSub = JSON.parse(localStorage.getItem(userSubKey) || 'null');
      const localDataRaw = localStorage.getItem(userSubKey);
      if (localDataRaw) {
        try {
          const localSub = JSON.parse(localDataRaw);
          const isUnexpired = localSub.expires_at ? new Date(localSub.expires_at) > new Date() : false;
          if (localSub.is_premium && isUnexpired) {
            setSubscription({
              plan: 'premium',
              status: localSub.status || 'active',
              expiresAt: localSub.expires_at,
              isPremium: true,
              loading: false,
            });
            return;
          }
        } catch (e) {}
      }

      setSubscription({
        plan: 'free',
        status: 'active',
        expiresAt: null,
        isPremium: false,
        loading: false,
      });

    } catch (err) {
      console.error('Failed to verify subscription:', err);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // Listen when a user subscribes or cancels anywhere in the app
    const handleUpdate = () => checkSubscription();
    window.addEventListener('ckh_subscription_updated', handleUpdate);

    return () => {
      window.removeEventListener('ckh_subscription_updated', handleUpdate);
    };
  }, [checkSubscription]);

  return { ...subscription, refreshSubscription: checkSubscription };
}