import { supabase } from './supabaseClient';

const BAKONG_API_URL = 'https://api-bakong.nbc.gov.kh/v1';

export async function verifyBakongTransaction(md5Hash) {
  const token = import.meta.env.VITE_BAKONG_API_TOKEN;

  if (!token) {
    return { success: false, reason: 'missing_token' };
  }

  try {
    const res = await fetch(`${BAKONG_API_URL}/check_transaction_by_md5`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ md5: md5Hash })
    });

    const result = await res.json();
    if (result.responseCode === 0) {
      return { success: true, data: result.data };
    }
    return { success: false, responseCode: result.responseCode };
  } catch (err) {
    return { success: false, error: err };
  }
}

export async function activateSubscription({ method = 'card', planPrice = 2.99 } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const now = new Date();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const isCard = method === 'card';
  const tranId = `CKH-${Date.now()}`;

  const subPayload = {
    is_premium: true,
    status: 'active',
    payment_method: method,
    auto_renew: isCard,
    price: planPrice,
    subscribed_at: now.toISOString(),
    expires_at: expires.toISOString()
  };

  localStorage.setItem(`ckh_subscription_${user.id}`, JSON.stringify(subPayload));
  localStorage.setItem('ckh_is_premium', 'true');

  try {
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan: 'premium',
        status: 'active',
        price: planPrice,
        currency: 'USD',
        payment_provider: method,
        transaction_id: tranId,
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' });
  } catch (e) {}

  try {
    await supabase
      .from('creator_profiles')
      .update({
        is_premium: true,
        membership_tier: 'premium',
        subscription_renews_at: isCard ? expires.toISOString() : null
      })
      .eq('user_id', user.id);
  } catch (e) {}

  window.dispatchEvent(new Event('ckh_subscription_updated'));
  return subPayload;
}

export async function initiatePayWayCheckout() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to upgrade.');

  const tranId = `CKH-${Date.now()}`;

  try {
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan: 'free',
        status: 'pending',
        price: 2.99,
        currency: 'USD',
        payment_provider: 'bakong_khqr',
        transaction_id: tranId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
  } catch (e) {}

  return {
    sandbox_tran_id: tranId,
    payment_url: null
  };
}

export async function verifySandboxPayment(tranId) {
  return await activateSubscription({ method: 'card', planPrice: 2.99 });
}

export async function cancelSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  const now = new Date().toISOString();

  const subKey = `ckh_subscription_${user.id}`;
  let currentSub = {};
  try {
    currentSub = JSON.parse(localStorage.getItem(subKey) || '{}');
  } catch (e) {}

  const updatedSub = {
    ...currentSub,
    status: 'cancelled',
    auto_renew: false
  };

  localStorage.setItem(subKey, JSON.stringify(updatedSub));

  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: now
      })
      .eq('user_id', user.id);
  } catch (e) {}

  try {
    await supabase
      .from('creator_profiles')
      .update({ subscription_renews_at: null })
      .eq('user_id', user.id);
  } catch (e) {}

  window.dispatchEvent(new Event('ckh_subscription_updated'));
  return updatedSub;
}

export async function resumeSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  const now = new Date();
  const subKey = `ckh_subscription_${user.id}`;
  let currentSub = {};
  try {
    currentSub = JSON.parse(localStorage.getItem(subKey) || '{}');
  } catch (e) {}

  const nextRenew = currentSub.expires_at || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const updatedSub = {
    ...currentSub,
    status: 'active',
    auto_renew: true
  };

  localStorage.setItem(subKey, JSON.stringify(updatedSub));

  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: now.toISOString()
      })
      .eq('user_id', user.id);
  } catch (e) {}

  try {
    await supabase
      .from('creator_profiles')
      .update({ subscription_renews_at: nextRenew })
      .eq('user_id', user.id);
  } catch (e) {}

  window.dispatchEvent(new Event('ckh_subscription_updated'));
  return updatedSub;
}

export async function disconnectYouTubeChannel() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  localStorage.removeItem(`ckh_yt_token_${user.id}`);
  localStorage.removeItem('ckh_yt_token');

  try {
    await supabase
      .from('creator_youtube_connections')
      .delete()
      .eq('user_id', user.id);
  } catch (e) {}

  try {
    await supabase
      .from('creator_profiles')
      .update({
        youtube_channel_id: null,
        youtube_channel_title: null,
        youtube_access_token: null
      })
      .eq('user_id', user.id);
  } catch (e) {}
}