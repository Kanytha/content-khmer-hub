import React, { useState } from 'react';
import { FiX, FiCheckCircle } from 'react-icons/fi';

const FORMAT_OPTIONS = [
  { id: 'Short video', label: 'Short video' },
  { id: 'Long video', label: 'Long video' },
  { id: 'Photo post', label: 'Photo post' },
  { id: 'Carousel', label: 'Carousel' },
  { id: 'Text post', label: 'Text post' },
  { id: 'Live stream', label: 'Live stream' },
  { id: 'Not sure yet', label: 'Not sure yet' }
];

export default function AddIdeaModal({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('Short video');
  const [concern, setConcern] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    await onSave({ title, description, intended_format: format, concern });
    setSubmitting(false);
    setTitle('');
    setDescription('');
    setConcern('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl p-8 shadow-2xl relative flex flex-col md:flex-row gap-8">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700"
        >
          <FiX size={22} />
        </button>

        {/* Form Left */}
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Your idea</h2>
            <p className="text-xs text-gray-500 mt-1">
              Tell CKH what you're thinking of posting. A little context helps CKH give you a more useful perspective.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-700">
            <div>
              <label className="block mb-1.5 text-gray-800">What are you thinking of posting?</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. BACII Math — Common Exam Mistakes"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5352ED]"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-gray-800">What is it about?</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="I want to explain 3 common mistakes students make when solving BACII math problems."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5352ED]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-800">How are you thinking of sharing it?</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Optional</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${format === f.id
                        ? 'bg-[#5352ED] text-white'
                        : 'bg-[#F1F5F9] text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-gray-800">Anything you're unsure about?</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Optional</span>
              </div>
              <textarea
                rows={2}
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="I'm not sure whether this topic is worth continuing or if I should try something different."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5352ED]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#5352ED] text-white font-bold px-8 py-2.5 rounded-xl hover:bg-[#4341E2] transition-colors"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Box */}
        <div className="w-full md:w-64 bg-[#F8F9FD] border border-[#ECEFFA] rounded-2xl p-6 flex flex-col justify-between text-xs">
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">CKH will consider</h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-2">
                <FiCheckCircle className="text-[#5352ED] shrink-0" size={15} /> Your goals
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="text-[#5352ED] shrink-0" size={15} /> Your audience
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="text-[#5352ED] shrink-0" size={15} /> Your creator direction
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="text-[#5352ED] shrink-0" size={15} /> Your recent experience
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="text-[#5352ED] shrink-0" size={15} /> What's happening right now
              </li>
            </ul>
          </div>
          <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
            You can update what CKH knows about you anytime in Profile.
          </p>
        </div>
      </div>
    </div>
  );
}