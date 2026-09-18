import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiCheck, FiArrowRight, FiShield, FiX } from 'react-icons/fi';

export default function SubscriptionPromptModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto text-left">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A] p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        <div className="inline-flex items-center gap-2 bg-[#EEF2FF] text-[#5352ED] font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full mb-3">
          <FiZap size={13} /> Exclusive Creator Offer
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
          Supercharge Your Content with CKH Premium
        </h2>
        <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
          Welcome to Content Khmer Hub! Access real audience data, YouTube metrics, and intelligent content suggestions.
        </p>

        <div className="my-5 p-4 bg-[#F8F7FF] border border-[#ECE8FB] rounded-2xl flex items-baseline justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">$2.99</span>
            <span className="text-xs text-[#64748B] font-medium"> / month</span>
          </div>
          <span className="text-[11px] bg-[#EEF2FF] text-[#5352ED] font-bold px-2.5 py-1 rounded-full">
            Cancel anytime
          </span>
        </div>

        <div className="space-y-2.5 mb-6 text-xs text-[#334155]">
          {[
            'Live YouTube channel performance sync',
            'Audience demographic & viewer intent segmentation',
            'Verbatim audience comment extraction',
            'Personalized trending niche keywords',
            'Autonomous project title optimization',
            'Expanded cross-platform opportunities'
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#E0E7FF] text-[#5352ED] flex items-center justify-center shrink-0 mt-0.5">
                <FiCheck size={11} />
              </div>
              <span className="leading-tight">{feature}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/profile');
          }}
          className="w-full py-3.5 px-4 bg-[#5352ED] hover:bg-[#4342D9] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>View Plan & Subscribe in Profile</span>
          <FiArrowRight size={15} />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8] mt-4">
          <FiShield size={12} /> Secure Cambodian Checkout via ABA Bank PayWay
        </div>
      </div>
    </div>
  );
}