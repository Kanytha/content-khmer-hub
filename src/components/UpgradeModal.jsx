import React, { useState } from 'react';
import { FiX, FiShield, FiZap, FiLoader, FiCreditCard, FiSmartphone } from 'react-icons/fi';
import { initiatePayWayCheckout, verifySandboxPayment } from '../services/subscriptionService';

export default function UpgradeModal({ isOpen, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const checkout = await initiatePayWayCheckout();
      
      if (checkout.payment_url) {
        window.location.href = checkout.payment_url;
      } else if (checkout.sandbox_tran_id) {
        await verifySandboxPayment(checkout.sandbox_tran_id);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={!loading ? onClose : undefined} />

      <div className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto text-left">
        <button 
          onClick={onClose} 
          disabled={loading}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          <FiX size={18} />
        </button>

        <div className="flex items-center gap-2 text-[#5352ED] font-bold text-xs uppercase tracking-wider mb-2">
          <FiZap size={14} /> PayWay by ABA Bank
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
          Checkout • $2.99 USD
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          CKH Premium 30-Day Creator Intelligence License
        </p>

        <div className="my-5 space-y-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B] block">
            Select Payment Method
          </span>
          
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setPaymentMethod('khqr')}
              className={`p-3 rounded-2xl border cursor-pointer flex flex-col items-center gap-1.5 transition-all ${
                paymentMethod === 'khqr' 
                  ? 'border-[#5352ED] bg-[#EEF2FF] text-[#5352ED]' 
                  : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:bg-white'
              }`}
            >
              <FiSmartphone size={20} />
              <span className="text-xs font-bold">ABA KHQR</span>
            </div>

            <div 
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-2xl border cursor-pointer flex flex-col items-center gap-1.5 transition-all ${
                paymentMethod === 'card' 
                  ? 'border-[#5352ED] bg-[#EEF2FF] text-[#5352ED]' 
                  : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:bg-white'
              }`}
            >
              <FiCreditCard size={20} />
              <span className="text-xs font-bold">Visa / Master</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl mb-6 text-center">
          {paymentMethod === 'khqr' ? (
            <div className="space-y-2">
              <div className="w-32 h-32 bg-white border border-[#E2E8F0] rounded-xl mx-auto flex items-center justify-center p-2 shadow-2xs">
                <div className="w-full h-full border-2 border-dashed border-[#5352ED] rounded-lg flex flex-col items-center justify-center text-[10px] text-[#5352ED] font-bold p-1">
                  <span>ABA KHQR</span>
                  <span className="text-gray-400 text-[8px] font-normal">Sandbox QR</span>
                </div>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Scan with any Cambodian Banking App (Bakong / ABA Mobile)
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-left">
              <div className="text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Test Card Number</span>
                <div className="p-2 bg-white border border-[#E2E8F0] rounded-xl font-mono text-xs text-gray-700">
                  4000 •••• •••• 0002
                </div>
              </div>
              <p className="text-[10px] text-[#64748B]">Sandbox gateway enabled for instant simulated verification.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3.5 px-4 bg-[#5352ED] hover:bg-[#4342D9] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin" size={16} /> Verifying ABA PayWay...
            </>
          ) : (
            `Pay $2.99 via ABA ${paymentMethod === 'khqr' ? 'KHQR' : 'Card'}`
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8] mt-4">
          <FiShield size={12} /> ABA PayWay Sandbox • Encrypted 256-bit checkout
        </div>
      </div>
    </div>
  );
}