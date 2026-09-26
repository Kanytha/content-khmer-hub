import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useSubscription } from '../hooks/useSubscription';
import NotificationCenter from '../components/NotificationCenter';
import logo from "../assets/images/LOGO1-removebg-preview.png";
import {
  FiGrid, FiStar, FiEdit3, FiCompass, FiUser,
  FiSettings, FiHelpCircle, FiX, FiMenu, FiBookOpen
} from 'react-icons/fi';

export default function ReflectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium } = useSubscription();

  const [currentUser, setCurrentUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [initials, setInitials] = useState('CR');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Recommendation being reflected upon (passed via state or fallback)
  const targetRecommendation = location.state?.recommendation || {
    title: 'BACII Math Tips — Part 1',
    category: 'Education - Recent post'
  };

  // Form State
  const [expectation, setExpectation] = useState('');
  const [audienceNotes, setAudienceNotes] = useState([]);
  const [unexpectedText, setUnexpectedText] = useState('');
  const [futureChange, setFutureChange] = useState('');
  const [guidanceRating, setGuidanceRating] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      const name = user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'Creator';
      setInitials(name.slice(0, 2).toUpperCase());

      const { data: profile } = await supabase
        .from('creator_profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const resolved = profile?.avatar_url || localStorage.getItem('user_avatar_url');
      if (resolved) setAvatarUrl(resolved);
    }
    loadUser();
  }, [navigate]);

  const toggleObservation = (item) => {
    setAudienceNotes(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSaveReflection = async () => {
    if (!currentUser) return;
    setSubmitting(true);

    try {
      const payload = {
        user_id: currentUser.id,
        recommendation_title: targetRecommendation.title,
        recommendation_category: targetRecommendation.category || 'General',
        expectation_result: expectation,
        audience_observations: audienceNotes,
        unexpected_notes: unexpectedText.trim(),
        future_change: futureChange,
        guidance_rating: guidanceRating
      };

      // 1. Save to reflections table
      await supabase.from('reflections').insert(payload);

      // 2. Update creator_profiles recent reflection preview
      await supabase
        .from('creator_profiles')
        .update({
          recent_reflection: {
            title: targetRecommendation.title,
            description: unexpectedText.trim() || `Reflected: Audience ${expectation.toLowerCase() || 'responded well'}.`,
            created_at: new Date().toISOString()
          }
        })
        .eq('user_id', currentUser.id);

      // 3. Mark notification or redirect back to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error("Error saving reflection:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const observationOptions = [
    "Asked questions",
    "Wanted more detail",
    "Responded to a specific part",
    "Shared their experience",
    "Similar to usual",
    "Weaker than usual",
    "Something unexpected"
  ];

  const expectationOptions = [
    "Better",
    "About what I expected",
    "Different",
    "Too early to tell"
  ];

  const changeOptions = [
    "Keep it similar",
    "Try a different approach",
    "Focus on another part",
    "Make it more detailed",
    "Not sure yet"
  ];

  const ratingOptions = [
    "Very useful",
    "Somewhat useful",
    "Didn't change my decision",
    "Wasn't a good fit",
    "Too early to tell"
  ];

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full py-8 px-4 font-normal">
      <div>
        <div className="px-2 mb-10 flex justify-between items-center">
          <img src={logo} alt="Logo" className="h-12 w-auto object-contain cursor-pointer" onClick={() => navigate('/dashboard')} />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <nav className="space-y-1 text-sm font-semibold text-[#64748B]">
          <div onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors">
            <FiGrid size={18} /> Dashboard
          </div>
          <div onClick={() => navigate('/recommendations')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors">
            <FiStar size={18} /> Recommendations
          </div>
          <div onClick={() => navigate('/ideas')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors">
            <FiEdit3 size={18} /> Ideas
          </div>
          <div onClick={() => navigate('/opportunities')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors">
            <FiCompass size={18} /> Opportunities
          </div>
          <div onClick={() => navigate('/profile')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors">
            <FiUser size={18} /> Profile
          </div>
        </nav>
      </div>

      <div className="space-y-1 text-sm font-semibold text-[#64748B]">
        <div onClick={() => navigate('/account')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors">
          <FiSettings size={18} /> Settings
        </div>
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors">
          <FiHelpCircle size={18} /> Support
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-[#0F172A] bg-white font-sans antialiased">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-white">
        <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-2">
          <NotificationCenter userId={currentUser?.id} isPremium={isPremium} />
          <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-[#0F172A]">
            <FiMenu size={24} />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-[260px] max-w-sm bg-[#F5F2FF] h-full shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[250px] lg:w-[260px] h-full bg-[#F5F2FF] border-r border-[#E2E8F0] shrink-0 z-10">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto px-6 py-6 md:px-12 md:py-8 lg:px-16 bg-white">
        {/* Header Right Bell & Profile */}
        <div className="justify-end items-center mb-6 gap-5 hidden md:flex">
          <NotificationCenter userId={currentUser?.id} isPremium={isPremium} />
          <div onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center overflow-hidden cursor-pointer shadow-xs bg-[#FFF0F5]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#ED4B9E] font-bold text-xs">{initials}</span>
            )}
          </div>
        </div>

        {/* Page Container */}
        <div className="max-w-2xl mx-auto space-y-10 pb-16">
          {/* Title Header */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mb-2">
              Reflection
            </h1>
            <p className="text-sm font-semibold text-[#0F172A] mb-1">
              Help CKH learn from your recent content.
            </p>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Share what you noticed so future guidance can better fit your audience and content.
            </p>
          </div>

          {/* Target Recommendation Card */}
          <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-[#FFFFFF] shadow-2xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F2FF] text-[#5352ED] flex items-center justify-center shrink-0">
                <FiBookOpen size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">
                  Reflecting on
                </span>
                <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                  {targetRecommendation.title}
                </h3>
                <p className="text-xs text-[#64748B]">{targetRecommendation.category}</p>
              </div>
            </div>

            <div className="bg-[#F5F2FF] rounded-xl px-4 py-3 text-xs italic text-[#5352ED] border border-[#E0E7FF]">
              "Tell us what you noticed about this content and your audience."
            </div>
          </div>

          {/* Question 1: How did it compare with what you expected? */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#0F172A]">
              How did it compare with what you expected?
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {expectationOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setExpectation(opt)}
                  className={`px-5 py-2.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    expectation === opt
                      ? 'bg-[#5352ED] text-white border-[#5352ED] shadow-xs'
                      : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-gray-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* Question 2: What did you notice from your audience? */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                What did you notice from your audience?
              </h2>
              <p className="text-xs text-[#64748B]">Select anything that stood out to you.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {observationOptions.map(opt => {
                const checked = audienceNotes.includes(opt);
                return (
                  <label
                    key={opt}
                    onClick={() => toggleObservation(opt)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      checked
                        ? 'border-[#5352ED] bg-[#F5F2FF] text-[#0F172A] font-semibold'
                        : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-[#5352ED] focus:ring-[#5352ED] border-[#CBD5E1]"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Question 3: Was there anything you didn't expect? */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Was there anything you didn't expect?
              </h2>
              <p className="text-xs text-[#64748B]">
                Tell CKH anything you noticed from your audience or the conversation around this post.
              </p>
            </div>

            <textarea
              rows={3}
              value={unexpectedText}
              onChange={(e) => setUnexpectedText(e.target.value)}
              placeholder="I expected the exam tips to get the most attention, but people were more interested in the examples..."
              className="w-full p-4 rounded-2xl border border-[#E2E8F0] bg-white text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5352ED] focus:ring-1 focus:ring-[#5352ED] transition-all resize-none leading-relaxed"
            />
          </section>

          {/* Question 4: If you made something similar again, would you change anything? */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#0F172A]">
              If you made something similar again, would you change anything?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {changeOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFutureChange(opt)}
                  className={`p-3.5 rounded-xl text-left text-xs border transition-all cursor-pointer ${
                    futureChange === opt
                      ? 'border-[#5352ED] bg-[#F5F2FF] text-[#0F172A] font-semibold shadow-xs'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* Question 5: How useful was CKH's guidance? */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#0F172A]">
              How useful was CKH's guidance?
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {ratingOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setGuidanceRating(opt)}
                  className={`px-4 py-2.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    guidanceRating === opt
                      ? 'bg-[#5352ED] text-white border-[#5352ED] shadow-xs'
                      : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-gray-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* Footer Save & Skip Actions */}
          <div className="pt-6 border-t border-[#F1F5F9] text-center space-y-4">
            <p className="text-[11px] text-[#94A3B8]">
              Your answers help CKH build a better understanding of your content and audience over time.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveReflection}
                className="bg-[#5352ED] text-white text-xs font-bold px-8 py-3 rounded-xl hover:bg-[#4342D9] transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Saving Reflection...' : 'Save Reflection'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] text-xs font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}