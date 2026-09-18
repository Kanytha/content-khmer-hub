import { supabase } from './supabaseClient';

export async function initiatePayWayCheckout() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to upgrade.');

  const tranId = `CKH-${Date.now()}`;

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      plan: 'free',
      status: 'pending',
      price: 2.99,
      currency: 'USD',
      payment_provider: 'sandbox',
      transaction_id: tranId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Checkout initiate error:', error);
  }

  return {
    sandbox_tran_id: tranId,
    payment_url: null
  };
}

export async function verifySandboxPayment(tranId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan: 'premium',
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: expires.toISOString(),
      transaction_id: tranId,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function resumeSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function disconnectYouTubeChannel() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  localStorage.removeItem(`ckh_yt_token_${user.id}`);
  localStorage.removeItem('ckh_yt_token');

  await supabase
    .from('creator_youtube_connections')
    .delete()
    .eq('user_id', user.id);
}