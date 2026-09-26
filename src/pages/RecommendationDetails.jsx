import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { generateDetailedRecommendation } from '../services/aiService';
import { toggleSaveItem } from '../services/savedService';
import { 
  FiArrowLeft, 
  FiTarget, 
  FiLayers, 
  FiHeart, 
  FiBookOpen, 
  FiClock, 
  FiHelpCircle, 
  FiVideo, 
  FiInfo, 
  FiBookmark, 
  FiCheckCircle, 
  FiBriefcase,
  FiArrowRight
} from 'react-icons/fi';

export default function RecommendationDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recommendation: basicRec } = location.state || {};

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approachTab, setApproachTab] = useState('suggested'); // 'suggested' | 'adapt' | 'later'
  const [currentUser, setCurrentUser] = useState(null);
  const [isPlanningSaved, setIsPlanningSaved] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

useEffect(() => {
    if (!basicRec) {
      navigate('/dashboard');
      return;
    }

    const fetchDeepDetails = async () => {
      try {
        const cacheKey = `ckh_rec_details_${basicRec.title.replace(/\s+/g, '_').toLowerCase()}`;
        const cachedData = localStorage.getItem(cacheKey);

        // 1. Instant cache load if opened previously
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            setDetails(parsed);
            setLoading(false);
            return;
          } catch (e) {
            console.warn("Cache parse error, refetching fresh details:", e);
          }
        }

        // 2. Fetch fresh only if not cached
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        let selections = {};

        if (user) {
          setCurrentUser(user);
          const { data } = await supabase
            .from('creator_profiles')
            .select('onboarding_answers, active_in_progress_recommendation')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data?.onboarding_answers) {
            selections = data.onboarding_answers;
          }

          if (data?.active_in_progress_recommendation?.title === basicRec.title) {
            setIsPlanningSaved(true);
          }
        }

        const fullData = await generateDetailedRecommendation(basicRec, selections);
        setDetails(fullData);

        // 3. Store in cache so it never makes you wait again
        localStorage.setItem(cacheKey, JSON.stringify(fullData));
      } catch (err) {
        console.error("Failed to load recommendation details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeepDetails();
  }, [basicRec, navigate]);

  const handleStartPlanning = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const recTitle = details?.title || basicRec?.title || "New Strategy Recommendation";
    const recCategory = details?.category || basicRec?.category || "Education";
    const approachText = 
      approachTab === 'suggested' ? 'Try as Suggested' :
      approachTab === 'adapt' ? 'Adapt to My Style' : 'Save for Later';

    try {
      // 1. Mark active plan with exact timestamp
      await supabase
        .from('creator_profiles')
        .update({
          active_in_progress_recommendation: {
            title: recTitle,
            category: recCategory,
            approach: approachText,
            started_at: new Date().toISOString()
          }
        })
        .eq('user_id', currentUser.id);

      // 2. Add reflection reminder in notifications table
      await supabase.from('notifications').insert({
        user_id: currentUser.id,
        title: 'Reflection follow-up',
        message: `Tell us how your recent content experience went with "${recTitle}".`,
        type: 'reflection',
        action_link: '/reflection',
        is_read: false
      });

      // 3. Immediately return to the dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error("Error setting up planning:", err);
      navigate('/dashboard');
    }
  };

  const handleSaveForLater = () => {
    if (!currentUser) return;
    const recId = basicRec?.id || `rec-${(details?.title || basicRec?.title || 'idea').replace(/\s+/g, '-').toLowerCase()}`;
    const payload = {
      id: recId,
      title: details?.title || basicRec?.title,
      type: 'recommendation',
      reason: details?.summary || basicRec?.reason
    };

    const saved = toggleSaveItem(currentUser.id, payload);
    setIsBookmarked(saved);
  };

  const handleGoToReflection = () => {
    navigate('/reflection', {
      state: {
        recommendation: {
          title: details?.title || basicRec?.title,
          category: details?.category || basicRec?.category || 'Content Strategy'
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[#5352ED] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[#64748B] font-medium">Preparing your personalized decision guide...</p>
      </div>
    );
  }

  const whyIcons = [FiTarget, FiLayers, FiHeart, FiBookOpen];
  const optionIcons = [FiClock, FiHelpCircle, FiVideo];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-[#0F172A] font-sans">
      <div className="max-w-[95%] mx-auto">
        {/* Back Link */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] font-medium mb-6 transition-colors cursor-pointer"
        >
          <FiArrowLeft size={16} /> Back to Recommendations
        </button>

        {/* Header Badges & Title */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="bg-[#EEF2F6] text-[#475569] text-xs px-3 py-1 rounded-full font-medium">
            Recommended for Today
          </span>
          <span className="text-xs text-[#5352ED] font-bold uppercase tracking-wide">
            • {details?.category || 'CONTENT STRATEGY'}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          {details?.title}
        </h1>
        <p className="text-[#475569] text-sm md:text-base max-w-3xl leading-relaxed mb-10">
          {details?.summary}
        </p>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Why CKH Prepared This */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs">
              <h2 className="text-lg font-bold mb-1">Why CKH Prepared This</h2>
              <p className="text-xs text-[#64748B] mb-5">This recommendation connects several things you've shared with CKH.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {details?.why_prepared?.map((item, idx) => {
                  const Icon = whyIcons[idx % whyIcons.length];
                  return (
                    <div key={idx} className="bg-[#F8F7FF] rounded-xl p-4 border border-[#ECEBFF] flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg text-[#5352ED] shadow-xs shrink-0">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{item.label}</div>
                        <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{item.value}</div>
                        <div className="text-[11px] text-[#94A3B8] mt-1">{item.source}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* What This Could Mean for You */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs">
              <h2 className="text-lg font-bold mb-1">What This Could Mean for You</h2>
              <p className="text-xs text-[#64748B] mb-5">
                {details?.what_this_could_help_with?.description || "Practical options to explore this direction without overhauling your workflow."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {details?.what_this_could_help_with?.options?.map((opt, idx) => {
                  const Icon = optionIcons[idx % optionIcons.length];
                  return (
                    <div key={idx} className="border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#475569] flex items-center justify-center mb-3">
                          <Icon size={16} />
                        </div>
                        <h3 className="text-sm font-bold mb-1">{opt.title}</h3>
                        <p className="text-xs text-[#64748B] leading-relaxed">{opt.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Before You Decide */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs">
              <h2 className="text-lg font-bold mb-4">Before You Decide</h2>
              <ul className="space-y-3">
                {details?.considerations?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-[#475569] leading-relaxed">
                    <FiInfo className="text-[#64748B] shrink-0 mt-0.5" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Personalized Approach */}
            <div className="bg-[#F5F3FF] rounded-2xl p-6 border border-[#E9E5FF] space-y-4">
              <h2 className="text-lg font-bold">How Would You Like to Approach It?</h2>

              <div className="flex flex-wrap gap-2">
                <button 
                  type="button"
                  onClick={() => setApproachTab('suggested')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    approachTab === 'suggested' ? 'bg-[#5352ED] text-white shadow-xs' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                  }`}
                >
                  Try as Suggested
                </button>
                <button 
                  type="button"
                  onClick={() => setApproachTab('adapt')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    approachTab === 'adapt' ? 'bg-[#5352ED] text-white shadow-xs' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                  }`}
                >
                  Adapt to My Style
                </button>
                <button 
                  type="button"
                  onClick={() => setApproachTab('later')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    approachTab === 'later' ? 'bg-[#5352ED] text-white shadow-xs' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                  }`}
                >
                  Save for Later
                </button>
              </div>

              <div className="bg-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#E2E8F0]">
                <p className="text-xs font-medium text-[#0F172A] leading-relaxed">
                  {approachTab === 'suggested' && (details?.personalized_approach?.suggested_title || "Follow the recommendation closely to test how your audience responds.")}
                  {approachTab === 'adapt' && "Adjust the pacing, topic angle, or style to fit your channel voice."}
                  {approachTab === 'later' && "Keep this saved in your planner library to review in upcoming cycles."}
                </p>

                {isPlanningSaved ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      type="button"
                      onClick={handleGoToReflection}
                      className="bg-[#5352ED] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#4342D9] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      Reflect Now
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={handleStartPlanning}
                    className="shrink-0 bg-[#5352ED] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#4342D9] transition-all shadow-xs cursor-pointer"
                  >
                    Start Planning
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2.5">
                <button 
                  type="button"
                  onClick={isPlanningSaved ? handleGoToReflection : handleStartPlanning}
                  className="w-full bg-[#5352ED] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#4342D9] transition-all cursor-pointer shadow-xs"
                >
                  <FiCheckCircle size={15} /> 
                  {isPlanningSaved ? 'Go to Reflection' : 'Add to My Plan'}
                </button>
                <button 
                  type="button"
                  onClick={handleSaveForLater}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    isBookmarked 
                      ? 'bg-[#EEF2FF] border-[#5352ED] text-[#5352ED]' 
                      : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <FiBookmark size={15} /> 
                  {isBookmarked ? 'Saved in Library' : 'Save for Later'}
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-center text-xs text-[#94A3B8] hover:text-[#64748B] pt-2 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Related Opportunity */}
            {details?.related_opportunity && (
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFF7ED] rounded-bl-full -z-0"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-2">
                    <FiBriefcase size={14} /> Related Opportunity
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] mb-1">{details.related_opportunity.title}</h4>
                  <p className="text-xs text-[#64748B] mb-3">{details.related_opportunity.description}</p>
                  <button 
                    type="button"
                    onClick={() => navigate('/opportunities')}
                    className="text-xs text-[#5352ED] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    Explore Opportunity <FiArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            <p className="text-[11px] text-[#94A3B8] text-center px-4 leading-relaxed">
              After you try this recommendation, CKH may ask about your experience to improve future suggestions.
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}