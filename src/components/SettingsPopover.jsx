import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiShield, FiClock, FiBookmark, FiGlobe } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsPopover({ onCloseParent }) {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNavigate = (path) => {
    setIsOpen(false);
    onCloseParent?.();
    navigate(path);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
      >
        <FiSettings size={18} /> {t('settings')}
      </div>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 text-xs font-medium text-[#0F172A] animate-in fade-in duration-150">
          <div
            onClick={() => handleNavigate('/security')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] hover:text-[#5352ED] transition-colors cursor-pointer"
          >
            <FiShield size={16} className="text-gray-400 shrink-0" />
            <span>Security</span>
          </div>

          <div
            onClick={() => handleNavigate('/history')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] hover:text-[#5352ED] transition-colors cursor-pointer"
          >
            <FiClock size={16} className="text-gray-400 shrink-0" />
            <span>History</span>
          </div>

          <div
            onClick={() => handleNavigate('/saved')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] hover:text-[#5352ED] transition-colors cursor-pointer"
          >
            <FiBookmark size={16} className="text-gray-400 shrink-0" />
            <span>Saved</span>
          </div>

          <div className="my-1.5 border-t border-gray-100" />

          <div className="px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-[11px]">
              <FiGlobe size={14} className="shrink-0" />
              <span>Language</span>
            </div>

            <div className="flex bg-[#F1F5F9] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-[#5352ED] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('km')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  lang === 'km'
                    ? 'bg-white text-[#5352ED] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ខ្មែរ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}