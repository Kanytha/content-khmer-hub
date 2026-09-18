import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { generateDetailedRecommendation } from '../services/aiService';
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

  useEffect(() => {
    if (!basicRec) {
      navigate('/dashboard');
      return;
    }

    const fetchDeepDetails = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        let selections = {};

        if (user) {
          const { data } = await supabase
            .from('creator_profiles')
            .select('onboarding_answers')
            .eq('user_id', user.id)
            .single();

          if (data?.onboarding_answers) {
            selections = data.onboarding_answers;
          }
        }

        const fullData = await generateDetailedRecommendation(basicRec, selections);
        setDetails(fullData);
      } catch (err) {
        console.error("Failed to load recommendation details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeepDetails();
  }, [basicRec, navigate]);

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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-[#0F172A]">
      <div className="max-w-[95%] mx-auto">
        {/* Back Link */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] font-medium mb-6 transition-colors"
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
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
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
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
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
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
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
            {details?.personalized_approach?.available && (
              <div className="bg-[#F5F3FF] rounded-2xl p-6 border border-[#E9E5FF]">
                <h2 className="text-lg font-bold mb-4">How Would You Like to Approach It?</h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  <button 
                    onClick={() => setApproachTab('suggested')}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      approachTab === 'suggested' ? 'bg-[#5352ED] text-white' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                    }`}
                  >
                    Try as Suggested
                  </button>
                  <button 
                    onClick={() => setApproachTab('adapt')}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      approachTab === 'adapt' ? 'bg-[#5352ED] text-white' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                    }`}
                  >
                    Adapt to My Style
                  </button>
                  <button 
                    onClick={() => setApproachTab('later')}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      approachTab === 'later' ? 'bg-[#5352ED] text-white' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                    }`}
                  >
                    Save for Later
                  </button>
                </div>

                <div className="bg-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#E2E8F0]">
                  <p className="text-xs font-medium text-[#0F172A] leading-relaxed">
                    {details.personalized_approach.suggested_title}
                  </p>
                  <button className="shrink-0 bg-[#5352ED] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#4342D9] transition-all">
                    {details.personalized_approach.badge_text || 'Start Planning'}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2.5">
                <button className="w-full bg-[#5352ED] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#4342D9] transition-all">
                  <FiCheckCircle size={15} /> Add to My Plan
                </button>
                <button className="w-full bg-white border border-[#E2E8F0] text-[#475569] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#F8FAFC] transition-all">
                  <FiBookmark size={15} /> Save for Later
                </button>
                <button className="w-full text-center text-xs text-[#94A3B8] hover:text-[#64748B] pt-2 transition-colors">
                  Dismiss
                </button>
              </div>
            </div>

            {/* Related Opportunity (Conditional) */}
            {details?.related_opportunity && (
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFF7ED] rounded-bl-full -z-0"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-2">
                    <FiBriefcase size={14} /> Related Opportunity
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] mb-1">{details.related_opportunity.title}</h4>
                  <p className="text-xs text-[#64748B] mb-3">{details.related_opportunity.description}</p>
                  <a href="#" className="text-xs text-[#5352ED] font-bold flex items-center gap-1 hover:underline">
                    Explore Opportunity <FiArrowRight size={13} />
                  </a>
                </div>
              </div>
            )}

            {/* Context Refinement Box (Conditional) */}
            {details?.missing_context?.needed && (
              <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0]">
                <h4 className="text-xs font-bold text-[#0F172A] mb-1.5">
                  Want to make this recommendation more relevant?
                </h4>
                <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
                  {details.missing_context.prompt}
                </p>
                <button className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-bold py-2 rounded-xl hover:bg-gray-50 shadow-xs transition-all">
                  Tell CKH More
                </button>
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