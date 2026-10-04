import React from 'react';
import { FiAlertTriangle, FiX, FiCheckCircle } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function CancelAutoRenewModal({ isOpen, onClose, onConfirm, expiresAt }) {
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const formattedDate = expiresAt 
    ? new Date(expiresAt).toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : (lang === 'km' ? 'ចុងបញ្ចប់នៃខែ' : 'the end of your billing cycle');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
        >
          <FiX size={18} />
        </button>

        <div className="text-center space-y-4 pt-2">
          {/* Warning Icon Badge */}
          <div className="w-14 h-14 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <FiAlertTriangle size={28} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">
              {lang === 'km' ? 'បោះបង់ការបន្តគម្រោងស្វ័យប្រវត្តិ?' : 'Cancel Auto-Renewal?'}
            </h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              {lang === 'km' ? (
                <>
                  ប្រព័ន្ធនឹង<strong>លែងកាត់ប្រាក់ពីកាតរបស់អ្នក</strong>សម្រាប់ខែបន្ទាប់ទៀតហើយ។
                </>
              ) : (
                <>
                  Your card will <strong>NOT be charged again</strong> next month.
                </>
              )}
            </p>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-left space-y-2">
            <div className="flex items-start gap-2 text-xs text-[#0F172A] font-medium">
              <FiCheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={15} />
              <span>
                {lang === 'km'
                  ? `អ្នកនៅតែអាចប្រើប្រាស់មុខងារ Premium ទាំងអស់រហូតដល់៖ ${formattedDate}`
                  : `You keep all Premium features until: ${formattedDate}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-[#EEF2FF] text-[#5352ED] hover:bg-[#E0E7FF] text-xs font-bold transition-all cursor-pointer"
            >
              {lang === 'km' ? 'រក្សាទុកដដែល' : 'Keep Subscription'}
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="py-2.5 px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold transition-all cursor-pointer"
            >
              {lang === 'km' ? 'បញ្ជាក់ការបោះបង់' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}