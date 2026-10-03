import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const CONTEXT_CHIPS = [
  'Current semester / Active exam cycle',
  'Midterms & Project submission season',
  'Internship / Job hunt season',
  'Semester break / Self-learning time',
  'Fresh semester startup'
];

export default function EditContextModal({ isOpen, onClose, context, onSave }) {
  const [goal, setGoal] = useState('');
  const [focus, setFocus] = useState('');
  const [contextPeriod, setContextPeriod] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (context) {
      setGoal(context?.creator?.goals || 'Reach More People');
      setFocus(context?.creator?.topic || '');
      setContextPeriod(context?.currentContext?.contextPeriod || 'Current semester / Active exam cycle');
    }
  }, [context, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      goal,
      focus: focus.trim(),
      contextPeriod: contextPeriod.trim()
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-7 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700"
        >
          <FiX size={20} />
        </button>

        <h3 className="text-xl font-bold text-[#0F172A] mb-1">Update Working Context</h3>
        <p className="text-xs text-gray-500 mb-6">
          Fine-tune what CKH focuses on right now. This will update your recommendations and comparison priorities across the platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-gray-700">
          <div>
            <label className="block mb-1.5 text-gray-800">Your Focus / Niche</label>
            <input
              type="text"
              required
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. Coding & Web Development, Tech Student Life"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-normal text-[#0F172A] focus:outline-none focus:border-[#5352ED]"
            />
            <span className="text-[11px] font-normal text-gray-400 mt-1 block">
              Write freely! The AI uses your exact words to evaluate alignment.
            </span>
          </div>

          <div>
            <label className="block mb-1.5 text-gray-800">Primary Goal</label>
            <input
              type="text"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Reach More People, Build Authority"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-normal text-[#0F172A] focus:outline-none focus:border-[#5352ED]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-gray-800">Current Timing / Context</label>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {CONTEXT_CHIPS.map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setContextPeriod(chip)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    contextPeriod === chip
                      ? 'bg-[#5352ED] text-white'
                      : 'bg-[#F1F5F9] text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={contextPeriod}
              onChange={(e) => setContextPeriod(e.target.value)}
              placeholder="Or write your current timing..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-normal text-[#0F172A] focus:outline-none focus:border-[#5352ED]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#5352ED] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#4341E2] transition-colors"
            >
              {saving ? 'Saving...' : 'Apply Context'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}