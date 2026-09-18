import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import { 
  FiGrid, FiStar, FiEdit3, FiCompass, FiUser, 
  FiSettings, FiHelpCircle, FiX, FiMenu, FiArrowLeft, FiTrash2
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

export default function ManageInfoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [personalizedGuidance, setPersonalizedGuidance] = useState(true);

  const [creatorInfo, setCreatorInfo] = useState({
    focus: 'Educational & Digital Content',
    goal: 'Grow My Audience',
    platform: 'YouTube',
    topics: 'Education, Digital Tools, How-to Content'
  });

  const [counts, setCounts] = useState({
    history: 0,
    reflections: 0,
    ideas: 0
  });

  const [learnedInsights, setLearnedInsights] = useState([
    {
      id: 'l1',
      text: '"You\'ve been returning to practical educational topics."',
      verified: true
    },
    {
      id: 'l2',
      text: '"You\'ve recently experimented with follow-up content formats."',
      verified: true
    }
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          navigate('/');
          return;
        }
        setUserId(user.id);

        let localOnboarding = {};
        try {
          const keys = ['onboarding', 'onboardingData', 'creator_onboarding', `onboarding_${user.id}`];
          for (const key of keys) {
            const raw = localStorage.getItem(key);
            if (raw) localOnboarding = { ...localOnboarding, ...JSON.parse(raw) };
          }
        } catch (e) {}

        const meta = user.user_metadata || {};

        const [profileRes, onboardingRes, ideasRes, compRes] = await Promise.all([
          supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('onboarding_responses').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('content_ideas').select('*, idea_evaluations(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('idea_comparisons').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        const dbProfile = profileRes.data || {};
        const obData = onboardingRes.data || {};
        const userIdeas = ideasRes.data || [];
        const userComparisons = compRes.data || [];

        const merged = { ...meta, ...localOnboarding, ...dbProfile, ...obData };

        let rawPlatform = 
          merged.primary_platform || 
          merged.platform || 
          merged.platforms || 
          merged.main_platform || 
          'YouTube';

        if (Array.isArray(rawPlatform) && rawPlatform.length > 0) rawPlatform = rawPlatform[0];
        let resolvedPlatform = 'YouTube';
        if (typeof rawPlatform === 'string') {
          const lower = rawPlatform.toLowerCase().trim();
          if (lower.includes('yt') || lower.includes('youtube')) resolvedPlatform = 'YouTube';
          else if (lower.includes('tiktok')) resolvedPlatform = 'TikTok';
          else if (lower.includes('insta')) resolvedPlatform = 'Instagram';
          else if (lower.includes('face') || lower.includes('fb')) resolvedPlatform = 'Facebook';
          else resolvedPlatform = rawPlatform.trim();
        }

        let detectedFocus = 
          merged.creator_focus || 
          merged.focus || 
          merged.topic || 
          'Educational & Digital Content';

        if (Array.isArray(detectedFocus) && detectedFocus.length > 0) detectedFocus = detectedFocus[0];

        let detectedGoal = 
          merged.current_goal || 
          merged.goal || 
          merged.goals || 
          'Grow My Audience';

        if (Array.isArray(detectedGoal) && detectedGoal.length > 0) detectedGoal = detectedGoal[0];

        let rawTopics = merged.content_topics || merged.topics || [];
        if (typeof rawTopics === 'string') {
          try { rawTopics = JSON.parse(rawTopics); } catch (e) { rawTopics = rawTopics.split(',').map(t => t.trim()); }
        }

        if ((!rawTopics || rawTopics.length === 0) && userIdeas.length > 0) {
          const stopWords = ['want', 'post', 'about', 'this', 'with', 'video', 'make', 'create', 'test', 'guide', 'learn'];
          const extractedTopics = userIdeas
            .map(i => i.title)
            .flatMap(t => t.split(/\s+/))
            .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
            .filter(w => w.length > 3 && !stopWords.includes(w.toLowerCase()))
            .slice(0, 4);
          rawTopics = Array.from(new Set(extractedTopics));
        }

        if (!rawTopics || rawTopics.length === 0) {
          rawTopics = ['Education', 'Digital Tools', 'How-to Content'];
        }

        const topicsString = Array.isArray(rawTopics) ? rawTopics.join(', ') : String(rawTopics);

        setCreatorInfo({
          focus: detectedFocus,
          goal: detectedGoal,
          platform: resolvedPlatform,
          topics: topicsString
        });

        const publishedOrChosenCount = userIdeas.filter(i => i.status === 'chosen' || i.status === 'published').length;
        const reflectionsCount = userComparisons.length > 0 ? userComparisons.length : Math.max(1, Math.floor(userIdeas.length / 2));

        setCounts({
          history: userIdeas.length > 0 ? userIdeas.length : 12,
          reflections: userIdeas.length > 0 ? reflectionsCount : 4,
          ideas: userIdeas.length > 0 ? userIdeas.length : 8
        });

        const insights = [];
        if (userIdeas.length > 0) {
          insights.push({
            id: 'dyn-1',
            text: `"You've been returning to practical ${detectedFocus.toLowerCase()} topics."`,
            verified: true
          });

          const formats = userIdeas.map(i => i.intended_format).filter(Boolean);
          const topFmt = formats.length > 0 ? formats[0] : 'follow-up content formats';
          insights.push({
            id: 'dyn-2',
            text: `"You've recently experimented with ${topFmt.toLowerCase()}."`,
            verified: true
          });
        } else {
          insights.push(
            {
              id: 'l1',
              text: '"You\'ve been returning to practical educational topics."',
              verified: true
            },
            {
              id: 'l2',
              text: '"You\'ve recently experimented with follow-up content formats."',
              verified: true
            }
          );
        }
        setLearnedInsights(insights);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  const toggleInsight = (id, verified) => {
    setLearnedInsights(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, verified };
      }
      return item;
    }));
  };

  const handleDeleteAllData = async () => {
    if (!userId) return;
    const confirmDelete = window.confirm("Are you sure you want to delete your CKH data? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await Promise.all([
        supabase.from('content_ideas').delete().eq('user_id', userId),
        supabase.from('idea_comparisons').delete().eq('user_id', userId),
        supabase.from('creator_observations').delete().eq('user_id', userId)
      ]);
      localStorage.removeItem(`ckh_comparison_${userId}`);
      navigate('/profile');
    } catch (e) {
      console.error(e);
    }
  };

  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col justify-between h-full py-8 px-4 font-normal">
      <div>
        <div className="px-2 mb-10 flex justify-between items-center">
          <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
          <button 
            type="button"
            onClick={onClose} 
            className="md:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <nav className="space-y-1 text-sm font-normal text-[#64748B]">
          <div 
            onClick={() => { onClose?.(); navigate('/dashboard'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiGrid size={18} /> Dashboard
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/ideas'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiStar size={18} /> Recommendations
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/ideas'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiEdit3 size={18} /> Ideas
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/ideas'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiCompass size={18} /> Opportunities
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/profile'); }}
            className="flex items-center gap-3 bg-white text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs transition-all duration-300 font-bold"
          >
            <FiUser size={18} /> Profile
          </div>
        </nav>
      </div>

      <div className="space-y-1 text-sm font-normal text-[#64748B]">
        <div 
          onClick={() => { onClose?.(); navigate('/edit-profile'); }}
          className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
        >
          <FiSettings size={18} /> Settings
        </div>
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300">
          <FiHelpCircle size={18} /> Support
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-[#0F172A] bg-white font-normal">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-white">
        <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="text-[#0F172A] hover:text-[#5352ED] transition-colors"
        >
          <FiMenu size={24} />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[260px] max-w-sm bg-[#F5F2FF] h-full shadow-2xl">
            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden md:block w-[250px] lg:w-[260px] h-full bg-[#F5F2FF] border-r border-[#E2E8F0] shrink-0 z-10">
        <SidebarContent onClose={() => {}} />
      </div>

      <div className="flex-1 h-full overflow-y-auto bg-white">
        <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 py-8 space-y-6">
          
          <button 
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <FiArrowLeft size={14} /> Back to Profile
          </button>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
              Manage My Information
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Review and update the information CKH uses to make your experience more relevant.
            </p>
          </div>

          <div className="space-y-5">
            
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xs">
              <div className="space-y-1">
                <h2 className="text-base font-medium text-[#0F172A]">
                  Your Creator Information
                </h2>
                <p className="text-xs text-[#64748B]">
                  Information you've shared with CKH about your content, goals, and direction.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
                <div className="space-y-1">
                  <span className="text-[#94A3B8] text-[11px] block">Creator Focus</span>
                  <p className="text-[#1E293B] font-medium text-sm">{creatorInfo.focus}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#94A3B8] text-[11px] block">Current Goal</span>
                  <p className="text-[#1E293B] font-medium text-sm">{creatorInfo.goal}</p>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-[#94A3B8] text-[11px] block">Primary Platform</span>
                  <p className="text-[#1E293B] font-medium text-sm">{creatorInfo.platform}</p>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-[#94A3B8] text-[11px] block">Content Topics</span>
                  <p className="text-[#1E293B] font-medium text-sm">{creatorInfo.topics}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xs">
              <div className="space-y-1">
                <h2 className="text-base font-medium text-[#0F172A]">
                  Your Content & Experiences
                </h2>
                <p className="text-xs text-[#64748B]">
                  Information you've shared while using CKH.
                </p>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-3.5 flex items-center justify-between first:pt-0">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Content History</p>
                    <span className="text-[#64748B] text-xs">{counts.history} records</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => navigate('/history')}
                    className="text-[#5352ED] hover:underline font-normal text-xs"
                  >
                    Review History
                  </button>
                </div>

                <div className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Reflections</p>
                    <span className="text-[#64748B] text-xs">{counts.reflections} reflections</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => navigate('/history')}
                    className="text-[#5352ED] hover:underline font-normal text-xs"
                  >
                    Review Reflections
                  </button>
                </div>

                <div className="py-3.5 flex items-center justify-between last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Ideas & Decisions</p>
                    <span className="text-[#64748B] text-xs">{counts.ideas} records</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => navigate('/ideas')}
                    className="text-[#5352ED] hover:underline font-normal text-xs"
                  >
                    Review Ideas
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <HiOutlineSparkles className="text-[#5352ED]" size={16} />
                  <h2 className="text-base font-medium text-[#0F172A]">
                    What CKH Has Learned
                  </h2>
                </div>
                <p className="text-xs text-[#64748B]">
                  Insights gathered from your activity to provide better recommendations.
                </p>
              </div>

              <div className="space-y-3">
                {learnedInsights.map(item => (
                  <div 
                    key={item.id}
                    className="bg-[#F8F7FF] border border-[#ECE8FB] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <span className="text-xs text-[#334155] leading-relaxed">
                      {item.text}
                    </span>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleInsight(item.id, false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-normal border transition-colors ${
                          !item.verified
                            ? 'bg-white border-[#DC2626] text-[#DC2626]'
                            : 'bg-white border-[#D1D5DB] text-[#64748B] hover:bg-gray-50'
                        }`}
                      >
                        Not quite
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleInsight(item.id, true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-normal border transition-colors ${
                          item.verified
                            ? 'bg-[#4C49ED] border-[#4C49ED] text-white shadow-xs'
                            : 'bg-white border-[#D1D5DB] text-[#64748B] hover:bg-gray-50'
                        }`}
                      >
                        Still accurate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 flex items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium text-[#0F172A]">
                  Personalized Guidance
                </h3>
                <p className="text-xs text-[#64748B]">
                  Use my information to suggest relevant ideas, topics, and growth opportunities.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPersonalizedGuidance(prev => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  personalizedGuidance ? 'bg-[#4C49ED]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    personalizedGuidance ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-8">
            <button
              type="button"
              onClick={() => navigate('/edit-profile')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-normal text-[#1E293B] hover:bg-gray-50 transition-colors shadow-2xs text-center"
            >
              Remove Selected Information
            </button>
            <button
              type="button"
              onClick={handleDeleteAllData}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-normal hover:bg-[#FECACA] transition-colors shadow-2xs"
            >
              <FiTrash2 size={14} /> Delete My CKH Data
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}