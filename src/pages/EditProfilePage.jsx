import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import { 
  FiGrid, FiStar, FiEdit3, FiCompass, FiUser, 
  FiSettings, FiHelpCircle, FiX, FiMenu, FiArrowLeft, FiCheck
} from 'react-icons/fi';
import { 
  LuTrendingUp, LuHeart, LuTarget, LuShoppingBag, 
  LuUsers, LuBriefcase, LuRepeat, LuBadgeDollarSign, LuSparkles
} from 'react-icons/lu';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [recentSituation, setRecentSituation] = useState('');
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [selectedSupport, setSelectedSupport] = useState([]);
  const [aiInferredContext, setAiInferredContext] = useState(null);

  const topicOptions = [
    'Education', 'Lifestyle', 'Gaming', 'Business', 'Beauty', 
    'Technology', 'Food', 'Entertainment', 'Personal Branding', 
    'Art & Design', 'Travel', 'Music / Concert', 'Other'
  ];

  const platformOptions = ['Facebook', 'TikTok', 'Instagram', 'YouTube'];

  const goalOptions = [
    { label: 'Reach More People', icon: LuTrendingUp },
    { label: 'Increase Engagement', icon: LuHeart },
    { label: 'Build My Personal Brand', icon: LuTarget },
    { label: 'Get Clients or Customers', icon: LuShoppingBag },
    { label: 'Build a Community', icon: LuUsers },
    { label: 'Get Brand Collaborations', icon: LuBriefcase },
    { label: 'Create More Consistently', icon: LuRepeat },
    { label: 'Earn More From My Content', icon: LuBadgeDollarSign }
  ];

  const situationOptions = [
    "I'm unsure what to create next",
    "I'm experimenting with different content",
    "Some posts perform much better than others",
    "I'm not sure what my audience responds to",
    "I'm trying to post more consistently",
    "I'm coming back after a break",
    "I'm preparing for a campaign or event",
    "I'm just getting started"
  ];

  const challengeOptions = [
    "I'm running out of ideas",
    "I'm unsure which idea to create",
    "Limited time",
    "Growing audience",
    "Staying consistent",
    "Growing engagement",
    "Editing takes too long",
    "Building audience connection",
    "Producing higher-quality content"
  ];

  const supportOptions = [
    "New content ideas",
    "Audience insights",
    "Trend updates",
    "Planning guidance",
    "Production tips",
    "Performance insights",
    "Creative inspiration"
  ];

  const parseValue = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
      return trimmed.split(',').map(s => s.replace(/["'\[\]]/g, '').trim()).filter(Boolean);
    }
    return [val];
  };

  useEffect(() => {
    async function loadCurrentOnboardingData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        if (!authUser) {
          navigate('/');
          return;
        }
        setUserId(authUser.id);

        let localOnboarding = {};
        try {
          const keys = ['onboarding', 'onboardingData', 'creator_onboarding', `onboarding_${authUser.id}`];
          for (const key of keys) {
            const raw = localStorage.getItem(key);
            if (raw) {
              localOnboarding = { ...localOnboarding, ...JSON.parse(raw) };
            }
          }
        } catch (e) {}

        const meta = authUser.user_metadata || {};

        const [onboardingRes, profileRes, ideasRes, compRes] = await Promise.all([
          supabase.from('onboarding_responses').select('*').eq('user_id', authUser.id).maybeSingle(),
          supabase.from('creator_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
          supabase.from('content_ideas').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
          supabase.from('idea_comparisons').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        ]);

        const obData = onboardingRes.data || {};
        const pfData = profileRes.data || {};
        const userIdeas = ideasRes.data || [];
        const latestComp = compRes.data || null;

        const merged = {
          ...meta,
          ...localOnboarding,
          ...pfData,
          ...obData
        };

        const rawTopic = 
          merged.creator_focus || 
          merged.focus || 
          merged.topic || 
          merged.topics || 
          'Education';
        const parsedTopics = parseValue(rawTopic);
        const topicString = parsedTopics[0] ? String(parsedTopics[0]) : 'Education';
        const cleanTopic = topicString.includes('&') ? topicString.split('&')[0].trim() : topicString.trim();
        const matchedTopic = topicOptions.find(t => t.toLowerCase() === cleanTopic.toLowerCase()) || topicOptions[0];
        setSelectedTopic(matchedTopic);

        const rawPlatform = 
          merged.primary_platform || 
          merged.platform || 
          merged.platforms || 
          merged.main_platform || 
          'YouTube';
        const parsedPlatforms = parseValue(rawPlatform);
        const platformString = (parsedPlatforms[0] ? String(parsedPlatforms[0]) : 'YouTube').toLowerCase().trim();
        
        let resolvedPlatform = 'YouTube';
        if (platformString.includes('yt') || platformString.includes('youtube')) resolvedPlatform = 'YouTube';
        else if (platformString.includes('tiktok')) resolvedPlatform = 'TikTok';
        else if (platformString.includes('insta')) resolvedPlatform = 'Instagram';
        else if (platformString.includes('face') || platformString.includes('fb')) resolvedPlatform = 'Facebook';
        setSelectedPlatform(resolvedPlatform);

        const rawGoals = 
          merged.current_goal || 
          merged.goals || 
          merged.goal || 
          merged.primary_goals || 
          ['Reach More People', 'Increase Engagement'];
        const parsedGoals = parseValue(rawGoals);
        const matchedGoals = goalOptions
          .filter(opt => parsedGoals.some(g => String(g).toLowerCase().trim() === opt.label.toLowerCase().trim()))
          .map(opt => opt.label);
        setSelectedGoals(matchedGoals.length > 0 ? matchedGoals.slice(0, 2) : ['Reach More People', 'Increase Engagement']);

        const rawSituation = 
          merged.current_situation || 
          merged.situation || 
          merged.recent_situation || 
          merged.whats_been_happening || 
          merged.content_status || 
          "";
        const situationString = Array.isArray(rawSituation) ? (rawSituation[0] || "") : String(rawSituation);
        const matchedSituation = situationOptions.find(s => s.toLowerCase().trim() === situationString.toLowerCase().trim()) || situationOptions[1];
        setRecentSituation(matchedSituation);

        const rawChallenges = 
          merged.biggest_challenge || 
          merged.challenges || 
          merged.challenge || 
          merged.biggest_challenges || 
          [];
        const parsedChallenges = parseValue(rawChallenges);
        const matchedChallenges = challengeOptions.filter(ch => 
          parsedChallenges.some(p => String(p).toLowerCase().trim() === ch.toLowerCase().trim())
        );
        setSelectedChallenges(matchedChallenges.length > 0 ? matchedChallenges.slice(0, 2) : [challengeOptions[3]]);

        const rawSupport = 
          merged.needed_support || 
          merged.support || 
          merged.support_needed || 
          merged.support_type || 
          [];
        const parsedSupport = parseValue(rawSupport);
        const matchedSupport = supportOptions.filter(sp => 
          parsedSupport.some(p => String(p).toLowerCase().trim() === sp.toLowerCase().trim())
        );
        setSelectedSupport(matchedSupport.length > 0 ? matchedSupport.slice(0, 2) : [supportOptions[0]]);

        if (latestComp?.relevant_context_note) {
          setAiInferredContext(latestComp.relevant_context_note);
        } else if (userIdeas.length > 0) {
          setAiInferredContext(`Based on your recent ${userIdeas.length} idea submissions, your current focus is aligning topics with your audience search volume.`);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentOnboardingData();
  }, [navigate]);

  const toggleGoal = (goalLabel) => {
    if (selectedGoals.includes(goalLabel)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter(g => g !== goalLabel));
      }
    } else {
      if (selectedGoals.length < 2) {
        setSelectedGoals([...selectedGoals, goalLabel]);
      } else {
        setSelectedGoals([selectedGoals[1], goalLabel]);
      }
    }
  };

  const toggleChallenge = (item) => {
    if (selectedChallenges.includes(item)) {
      if (selectedChallenges.length > 1) {
        setSelectedChallenges(selectedChallenges.filter(c => c !== item));
      }
    } else {
      if (selectedChallenges.length < 2) {
        setSelectedChallenges([...selectedChallenges, item]);
      } else {
        setSelectedChallenges([selectedChallenges[1], item]);
      }
    }
  };

  const toggleSupport = (item) => {
    if (selectedSupport.includes(item)) {
      if (selectedSupport.length > 1) {
        setSelectedSupport(selectedSupport.filter(s => s !== item));
      }
    } else {
      if (selectedSupport.length < 2) {
        setSelectedSupport([...selectedSupport, item]);
      } else {
        setSelectedSupport([selectedSupport[1], item]);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!userId) return;
    try {
      setSaving(true);

      const onboardingPayload = {
        user_id: userId,
        creator_focus: selectedTopic,
        primary_platform: selectedPlatform,
        current_goal: selectedGoals[0] || 'Reach More People',
        goals: selectedGoals,
        current_situation: recentSituation,
        biggest_challenge: selectedChallenges,
        needed_support: selectedSupport,
        content_topics: [selectedTopic, 'Content Creation']
      };

      const profilePayload = {
        user_id: userId,
        focus: selectedTopic,
        topic: selectedTopic,
        platform: selectedPlatform,
        primary_platform: selectedPlatform,
        goal: selectedGoals[0] || 'Reach More People',
        goals: selectedGoals,
        situation: recentSituation,
        biggest_challenge: selectedChallenges,
        needed_support: selectedSupport,
        topics: [selectedTopic, 'Content Creation']
      };

      await Promise.all([
        supabase.from('onboarding_responses').upsert(onboardingPayload, { onConflict: 'user_id' }),
        supabase.from('creator_profiles').upsert(profilePayload, { onConflict: 'user_id' }),
        supabase.auth.updateUser({
          data: {
            focus: selectedTopic,
            platform: selectedPlatform,
            goal: selectedGoals[0],
            goals: selectedGoals,
            situation: recentSituation,
            challenges: selectedChallenges,
            support: selectedSupport
          }
        })
      ]);

      const updatedLocal = {
        creator_focus: selectedTopic,
        primary_platform: selectedPlatform,
        current_goal: selectedGoals[0],
        goals: selectedGoals,
        current_situation: recentSituation,
        biggest_challenge: selectedChallenges,
        needed_support: selectedSupport
      };
      localStorage.setItem('onboardingData', JSON.stringify(updatedLocal));
      localStorage.setItem(`onboarding_${userId}`, JSON.stringify(updatedLocal));

      navigate('/profile');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
          onClick={() => { onClose?.(); navigate('/profile'); }}
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
        <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 py-8 space-y-8">
          
          <button 
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <FiArrowLeft size={14} /> Back to Profile
          </button>

          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
              Account Information
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-xl mx-auto">
              Update the information you shared with CKH. You can change these answers anytime.
            </p>
          </div>

          <div className="space-y-6">
            
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-medium text-[#0F172A]">
                  Creator Identity
                </h2>
                <p className="text-xs text-[#64748B]">
                  The basics of who you are and how you create.
                </p>
              </div>

              <div className="space-y-3">
                <span className="block text-xs text-[#334155] font-normal">
                  What do you mainly create?
                </span>
                <div className="flex flex-wrap gap-2">
                  {topicOptions.map((topic) => {
                    const isSelected = selectedTopic === topic;
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSelectedTopic(topic)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-normal border transition-all ${
                          isSelected
                            ? 'bg-[#E1DFFF] border-[#C7D2FE] text-[#2D26CB]'
                            : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="block text-xs text-[#334155] font-normal">
                  Which is your main platform right now?
                </span>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map((platform) => {
                    const isSelected = selectedPlatform === platform;
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => setSelectedPlatform(platform)}
                        className={`px-4 py-1.5 rounded-full text-xs font-normal border transition-all ${
                          isSelected
                            ? 'bg-[#E1DFFF] border-[#C7D2FE] text-[#2D26CB]'
                            : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-[#F8F7FF] border border-[#ECE8FB] rounded-2xl p-6 sm:p-7 space-y-6">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-medium text-[#0F172A]">
                  Your Direction
                </h2>
                <p className="text-xs text-[#64748B]">
                  What you want your content to achieve and what matters when you choose what to create.
                </p>
              </div>

              <div className="space-y-3">
                <span className="block text-xs text-[#334155] font-normal">
                  PRIMARY GOALS <span className="text-[#64748B] text-[11px]">(SELECT UP TO 2)</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {goalOptions.map(({ label, icon: Icon }) => {
                    const isSelected = selectedGoals.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleGoal(label)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-white border-[#5352ED] text-[#2D26CB] shadow-2xs'
                            : 'bg-white border-[#E2E8F0] text-[#1E293B] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={isSelected ? 'text-[#5352ED]' : 'text-[#64748B]'} size={18} />
                          <span className="font-normal">{label}</span>
                        </div>
                        {isSelected && <FiCheck className="text-[#5352ED] shrink-0" size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-7 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-medium text-[#0F172A]">
                    Right Now
                  </h2>
                  <span className="inline-flex items-center gap-1 bg-[#EEF2FF] text-[#4338CA] text-[11px] px-2.5 py-0.5 rounded-full font-normal">
                    <LuSparkles size={12} /> Adaptive to your activity
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Your current situation can change as your content direction changes.
                </p>
              </div>

              {aiInferredContext && (
                <div className="bg-[#F8F9FE] border border-[#EEF0FE] rounded-xl p-3.5 text-xs text-[#475569] flex items-start gap-2.5">
                  <LuSparkles className="text-[#5352ED] shrink-0 mt-0.5" size={15} />
                  <span><strong>CKH Learning:</strong> {aiInferredContext}</span>
                </div>
              )}

              <div className="space-y-3">
                <span className="block text-xs text-[#334155] font-normal uppercase tracking-wider text-[11px]">
                  WHAT'S BEEN HAPPENING WITH YOUR CONTENT RECENTLY?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {situationOptions.map((situation) => {
                    const isSelected = recentSituation === situation;
                    return (
                      <button
                        key={situation}
                        type="button"
                        onClick={() => setRecentSituation(situation)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-[#F8F7FF] border-[#5352ED] text-[#2D26CB] shadow-2xs'
                            : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#5352ED]' : 'border-[#CBD5E1]'
                        }`}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#5352ED]" />}
                        </span>
                        <span className="leading-snug">{situation}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="block text-xs text-[#334155] font-normal uppercase tracking-wider text-[11px]">
                    WHAT'S YOUR BIGGEST CHALLENGE RIGHT NOW?
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Max 2</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {challengeOptions.map((challenge) => {
                    const isSelected = selectedChallenges.includes(challenge);
                    return (
                      <button
                        key={challenge}
                        type="button"
                        onClick={() => toggleChallenge(challenge)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-normal border transition-all ${
                          isSelected
                            ? 'bg-[#E1DFFF] border-[#C7D2FE] text-[#2D26CB]'
                            : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {challenge}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="block text-xs text-[#334155] font-normal uppercase tracking-wider text-[11px]">
                    WHAT KIND OF SUPPORT WOULD HELP YOU MOST RIGHT NOW?
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Max 2</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {supportOptions.map((support) => {
                    const isSelected = selectedSupport.includes(support);
                    return (
                      <button
                        key={support}
                        type="button"
                        onClick={() => toggleSupport(support)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-normal border transition-all ${
                          isSelected
                            ? 'bg-[#E1DFFF] border-[#C7D2FE] text-[#2D26CB]'
                            : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {support}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-8">
            <p className="text-[11px] text-[#64748B] leading-relaxed max-w-md text-center sm:text-left font-normal">
              Why this matters: Your answers help CKH understand your goals, audience, content style, and current situation so recommendations and idea comparisons can be more relevant.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-6 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-normal text-[#1E293B] hover:bg-gray-50 transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#4C49ED] text-white text-xs font-normal hover:bg-[#3D3AE0] transition-colors disabled:opacity-50 shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}