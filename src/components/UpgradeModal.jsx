import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiShield, FiCreditCard, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import bakongQrImg from '../assets/images/bakong-qr.jpg';

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  user, 
  onPaymentSuccess, 
  onSuccess,
  planPrice = '$2.99' 
}) {
  const { lang } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cardData, setCardData] = useState({
    name: user?.user_metadata?.full_name || '',
    cardNumber: '4242 •••• •••• 4242',
    expiry: '12/28',
    cvc: '888'
  });

  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(300);
  }, [isOpen, paymentMethod]);

  useEffect(() => {
    if (!isOpen || paymentMethod !== 'khqr') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, paymentMethod]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleActivatePremium = async (methodType) => {
    setProcessing(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const activeUser = user || authUser;

      if (!activeUser?.id) {
        throw new Error('Please log in first.');
      }

      const now = new Date();
      const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const isCard = methodType === 'card';
      const tranId = `CKH-${Date.now()}`;

      // 1. Update the Supabase 'subscriptions' table
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: activeUser.id,
          plan: 'premium',
          status: 'active',
          price: 2.99,
          currency: 'USD',
          payment_provider: methodType,
          transaction_id: tranId,
          started_at: now.toISOString(),
          expires_at: oneMonthLater.toISOString(),
          updated_at: now.toISOString()
        }, { onConflict: 'user_id' });

      if (subError) console.error("Error updating subscriptions table:", subError);

      // 2. Update 'creator_profiles' table
      await supabase
        .from('creator_profiles')
        .update({
          is_premium: true,
          membership_tier: 'premium',
          subscription_renews_at: isCard ? oneMonthLater.toISOString() : null
        })
        .eq('user_id', activeUser.id);

      // 3. Update localStorage fallback
      const subPayload = {
        is_premium: true,
        status: 'active',
        payment_method: methodType,
        auto_renew: isCard,
        price: planPrice,
        subscribed_at: now.toISOString(),
        expires_at: oneMonthLater.toISOString()
      };

      localStorage.setItem(`ckh_subscription_${activeUser.id}`, JSON.stringify(subPayload));
      localStorage.setItem('ckh_is_premium', 'true');

      // 4. Trigger global reactive listeners
      window.dispatchEvent(new Event('ckh_subscription_updated'));

      setProcessing(false);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        if (onPaymentSuccess) onPaymentSuccess(subPayload);
        if (onSuccess) onSuccess(subPayload);
        onClose();
      }, 1200);

    } catch (err) {
      console.error("Activation failed:", err);
      setProcessing(false);
      alert("Upgrade failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
        >
          <FiX size={18} />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <FiCheck size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">
              {lang === 'km' ? 'ការទូទាត់បានជោគជ័យ!' : 'Payment Confirmed!'}
            </h3>
            <p className="text-xs text-gray-500">
              {lang === 'km' 
                ? 'គណនី CKH Premium របស់អ្នកដំណើរការហើយ។' 
                : 'Your CKH Creator Premium is now active.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[#5352ED] uppercase tracking-wider bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
                {lang === 'km' ? 'ដំឡើងគម្រោង' : 'Upgrade Plan'}
              </span>
              <h2 className="text-lg font-bold text-[#0F172A] mt-1.5">
                {lang === 'km' ? 'ជ្រើសរើសវិធីសាស្ត្រទូទាត់' : 'Choose Payment Method'}
              </h2>
              <p className="text-xs text-gray-500">
                {lang === 'km' ? 'តម្លៃសរុប:' : 'Total due:'}{' '}
                <span className="font-bold text-[#0F172A]">{planPrice} / {lang === 'km' ? 'ខែ' : 'month'}</span>
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-1 rounded-2xl border border-gray-100">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-white text-[#5352ED] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FiCreditCard size={15} /> 
                {lang === 'km' ? 'កាតឥណទាន (Card)' : 'Credit Card'}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('khqr')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  paymentMethod === 'khqr'
                    ? 'bg-white text-[#E11D48] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                {lang === 'km' ? 'បាគង KHQR' : 'Bakong KHQR'}
              </button>
            </div>

            {/* CARD FORM */}
            {paymentMethod === 'card' && (
              <div className="space-y-3.5">
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      {lang === 'km' ? 'ឈ្មោះម្ចាស់កាត' : 'Cardholder Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sothea Chan"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#5352ED] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      {lang === 'km' ? 'លេខកាត' : 'Card Number'}
                    </label>
                    <input
                      type="text"
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                      className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#5352ED] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                        {lang === 'km' ? 'ផុតកំណត់ (MM/YY)' : 'Expires (MM/YY)'}
                      </label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#5352ED] focus:outline-none text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block mb-1">CVC / CVV</label>
                      <input
                        type="text"
                        value={cardData.cvc}
                        onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                        className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#5352ED] focus:outline-none text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl flex items-start gap-2.5">
                  <FiAlertCircle className="text-amber-600 shrink-0 mt-0.5" size={15} />
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    {lang === 'km' ? (
                      <>
                        <strong>ការបន្តស្វ័យប្រវត្តិ៖</strong> គម្រោងរបស់អ្នកនឹងបន្តកាត់ប្រាក់រៀងរាល់ខែ។ <strong>នៅពេលដែលអ្នកចុចបោះបង់ (Unsubscribe) នោះប្រព័ន្ធនឹងលែងកាត់ប្រាក់ពីកាតរបស់អ្នកទៀតហើយ។</strong>
                      </>
                    ) : (
                      <>
                        <strong>Auto-Renewal Policy:</strong> Your plan renews automatically each cycle. <strong>No further money will be deducted from your card once you unsubscribe.</strong>
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleActivatePremium('card')}
                  className="w-full py-3 bg-[#5352ED] hover:bg-[#4342D9] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {processing ? <FiRefreshCw className="animate-spin" size={14} /> : null}
                  <span>
                    {lang === 'km' ? `ជាវគម្រោងឥឡូវនេះ (${planPrice}/ខែ)` : `Subscribe Now (${planPrice}/mo)`}
                  </span>
                </button>
              </div>
            )}

            {/* BAKONG KHQR */}
            {paymentMethod === 'khqr' && (
              <div className="space-y-3.5 text-center">
                <div className="bg-[#FFF1F2] border border-[#FFE4E6] p-4 rounded-2xl flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-[#E11D48] text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-ping" />
                    <span>{lang === 'km' ? 'ស្កេនទូទាត់ជាមួយបាគង KHQR' : 'Bakong KHQR Payment'}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-2xl border border-rose-100 shadow-xs mb-2">
                    <img
                      src={bakongQrImg}
                      alt="Bakong KHQR"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl mx-auto"
                    />
                  </div>

                  <p className="text-[11px] text-gray-500">
                    {lang === 'km' 
                      ? 'ស្កេនជាមួយគ្រប់កម្មវិធីធនាគារក្នុងប្រទេសកម្ពុជា' 
                      : 'Scan with any Cambodian mobile banking app'}
                  </p>
                  <p className="text-xs font-bold text-gray-800 mt-1">
                    {lang === 'km' ? 'ផុតកំណត់ក្នុងរយៈពេល:' : 'Expires in:'}{' '}
                    <span className="text-[#E11D48] font-mono">{formatTimer(timeLeft)}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left flex items-start gap-2.5">
                  <FiShield className="text-slate-500 shrink-0 mt-0.5" size={15} />
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'km' ? (
                      <>
                        <strong>ការទូទាត់ម្តងប៉ុណ្ណោះ៖</strong> ការទូទាត់តាម KHQR មិនមានការកាត់ប្រាក់ស្វ័យប្រវត្តិឡើយ។ គម្រោងនឹងផុតកំណត់ក្នុងរយៈពេល 30 ថ្ងៃដោយមិនកាត់ប្រាក់បន្ថែម។
                      </>
                    ) : (
                      <>
                        <strong>One-Time Payment:</strong> KHQR does not auto-renew. Your Premium simply expires after 30 days without automatic deductions.
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleActivatePremium('khqr')}
                  className="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {processing ? <FiRefreshCw className="animate-spin" size={14} /> : null}
                  <span>{lang === 'km' ? 'ខ្ញុំបានស្កេនទូទាត់រួចរាល់' : 'I Have Paid via KHQR'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}