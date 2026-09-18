import { useState, useRef } from 'react';
import {
  FiArrowLeft, FiArrowRight, FiCheckCircle,
  FiTrendingUp, FiHeart, FiTarget, FiShoppingBag,
  FiUsers, FiBriefcase, FiRefreshCw, FiDollarSign, FiFileText, FiBarChart2
} from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { supabase } from '../services/supabaseClient';
import { generateWorkspaceData } from '../services/aiService';
import { useNavigate } from 'react-router-dom';

import logo from "../assets/images/LOGO1-removebg-preview.png";
import onboarding1 from "../assets/images/onboarding1.png";
import onboarding2 from "../assets/images/ob2.png";
import onboarding3 from "../assets/images/ob3.png";
import setupCompleteBg from "../assets/images/finished_setup.jpg";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const scrollRef = useRef(null);

  const [selections, setSelections] = useState({
    topic: '', platform: '', language: '', presentation: '', audience: '', experience: '',
    primaryGoals: [], mattersMost: '',
    recentSituation: '', biggestChallenge: [], supportNeeded: []
  });


  const isStepValid = () => {
    if (step === 1) return selections.topic && selections.platform && selections.language && selections.presentation && selections.audience && selections.experience;
    if (step === 2) return selections.primaryGoals.length > 0 && selections.mattersMost;
    if (step === 3) return selections.recentSituation && selections.biggestChallenge.length > 0 && selections.supportNeeded.length > 0;
    return true;
  };


  const handleSingleSelect = (category, value) => {
    setSelections(prev => ({
      ...prev,
      [category]: prev[category] === value ? '' : value
    }));
  };

  const handleMultiSelect = (category, value, max) => {
    setSelections(prev => {
      const currentList = prev[category];
      if (currentList.includes(value)) {
        return { ...prev, [category]: currentList.filter(item => item !== value) };
      }
      if (currentList.length < max) {
        return { ...prev, [category]: [...currentList, value] };
      }
      return prev;
    });
  };

  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = async () => {
    if (step < 4 && isStepValid()) {
      if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
      setStep(step + 1);
    } else if (step === 4) {
      setIsGenerating(true);

      try {
        // 1. Get user from active session first (avoids null flash on production)
        let { data: { session } } = await supabase.auth.getSession();
        let user = session?.user;

        if (!user) {
          const { data } = await supabase.auth.getUser();
          user = data?.user;
        }

        if (!user) {
          console.warn("No active user session detected, redirecting to login");
          navigate('/login', { replace: true });
          return;
        }

        // 2. Generate workspace data with fallback safety
        let aiData = {
          current_focus: {
            title: `${selections.topic || 'Content'} Growth Strategy`,
            description: `Focus on engaging your ${selections.audience || 'audience'} with clear, authentic stories.`
          },
          active_recommendations: [
            {
              title: "Address Top Audience Questions",
              reason: "Directly answering what viewers ask builds trust and authority fast."
            },
            {
              title: "Behind-the-Scenes Production Breakdown",
              reason: "Showing your creative process increases follower connection."
            }
          ]
        };

        try {
          const generated = await generateWorkspaceData(selections);
          if (generated?.current_focus && generated?.active_recommendations) {
            aiData = generated;
          }
        } catch (aiErr) {
          console.warn("AI generation fallback activated:", aiErr);
        }

        const signupUsername =
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Creator';

        // 3. Upsert profile safely
        const { error } = await supabase
          .from('creator_profiles')
          .upsert({
            user_id: user.id,
            full_name: signupUsername,
            username: signupUsername,
            onboarding_answers: selections,
            current_focus: aiData.current_focus,
            active_recommendations: aiData.active_recommendations,
            last_refreshed_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          console.error("Error saving profile:", error);
          alert("Could not save your profile. Please check your connection and try again.");
          return;
        }

        // 4. Navigate directly to dashboard replacing history
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error("Error in onboarding submission:", error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
      setStep(step - 1);
    }
  };


  const sidebarContent = {
    1: {
      tag: "About 1 minute - Required questions only",
      title: "Every Creator Has \nA Unique Story.",
      desc: "Before we explore opportunities together, we'd like to understand what makes your content unique. A few simple questions will help personalize your creative workspace.",
      img: onboarding1
    },
    2: {
      tag: "Creator Onboarding",
      title: "Every Creator Is Growing \nToward Something.",
      desc: "Your goals help Content Khmer Hub understand what success means for you. We'll use them to prioritize opportunities that match where you're heading.",
      img: onboarding2
    },
    3: {
      tag: "Creator Onboarding",
      title: "Every Creator Has Different \nSeasons.",
      desc: "The best opportunity isn't always the biggest trend. It's the one that fits where you are right now.",
      img: onboarding3
    }
  };


  const OptionBtn = ({ active, onClick, children, className = "" }) => (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm transition-all border text-left flex items-center justify-center gap-2 ${active
        ? 'bg-[#F5F2FF] border-[#5352ED] text-[#5352ED] font-semibold shadow-sm'
        : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1] hover:bg-gray-50'
        } ${className}`}
    >
      {children}
    </button>
  );


  // STEP 4 LAYOUT 

  if (step === 4) {
    return (
      <>
        {/* Shiny Background Animation for Step 4 lines */}
        <style>
          {`
            @keyframes shimmerBg {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            .animate-shine-bg {
              background: linear-gradient(90deg, #E2E8F0 25%, #F8FAFC 50%, #E2E8F0 75%);
              background-size: 200% 100%;
              animation: shimmerBg 2s infinite linear;
            }
          `}
        </style>

        <div className="flex h-screen w-full font-sans bg-white overflow-hidden">

          <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] bg-[#F8F9FF] p-8 md:p-10 flex-col justify-center h-screen border-r border-[#E2E8F0] animate-page-enter">
            <div className="mb-10">
              <img src={logo} alt="Logo" className="h-10 md:h-12 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-[#0F172A] mb-3">Your Creator Profile<br />Is Ready.</h1>
            <p className="text-[#64748B] text-xs leading-relaxed mb-10 max-w-[400px]">
              Everything you've shared gives CKH a starting point for understanding your content, goals, audience, and current needs. We'll use this context to make your recommendations more relevant as you create.
            </p>

            {/* Setup UI Mockup Cards */}
            <div className="space-y-3 relative">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E2E8F0]">
                <h4 className="text-[#5352ED] font-semibold text-[11px] mb-2">Creator Profile Ready</h4>
                <div className="space-y-1.5 text-[11px] text-[#475569]">
                  <div className="flex items-center gap-2"><FiCheckCircle className="text-[#5352ED]" /> Creator identity added</div>
                  <div className="flex items-center gap-2"><FiCheckCircle className="text-[#5352ED]" /> Goals & priorities added</div>
                  <div className="flex items-center gap-2"><FiCheckCircle className="text-[#5352ED]" /> Current situation added</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E2E8F0] relative overflow-hidden w-11/12 ml-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiFileText className="text-[#5352ED]" />
                  <span className="font-bold text-xs text-[#0F172A]">Content Recommendations</span>
                </div>
                {/* Shiny Animated Lines */}
                <div className="space-y-2.5">
                  <div className="h-2 w-full rounded-full animate-shine-bg"></div>
                  <div className="h-2 w-3/4 rounded-full animate-shine-bg"></div>
                  <div className="h-2 w-1/2 rounded-full animate-shine-bg"></div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl shadow-sm border border-[#E2E8F0] flex items-center gap-3 w-10/12 ml-8">
                <div className="bg-[#F5F2FF] p-1.5 rounded text-[#5352ED]"><FiBarChart2 size={14} /></div>
                <span className="font-bold text-xs text-[#0F172A]">Explore Opportunities</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[60%] xl:w-[65%] h-screen p-6 md:p-8 flex flex-col items-center justify-center text-center animate-page-enter-delay">
            <img src={setupCompleteBg} alt="Desk setup" className="w-full max-w-[550px] h-auto max-h-[28vh] object-cover rounded-3xl mb-6 shadow-lg" />

            <h2 className="text-2xl font-bold text-[#0F172A] mb-3">You're All Set!</h2>
            <p className="text-[#64748B] text-xs max-w-[500px] mb-8 leading-relaxed">
              CKH now has enough context to make your first recommendations more relevant. As you use the platform, you can update your profile and choose whether to share feedback so CKH can better understand what works for you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-[650px] mb-8">
              <div className="bg-[#F8FAFC] p-4 rounded-2xl text-left">
                <p className="text-[9px] text-[#94A3B8] font-bold tracking-wider mb-2 uppercase">Identity</p>
                <p className="font-bold text-[#0F172A] text-xs mb-2">{selections.topic || 'Education'} Creator</p>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-[#E2E8F0] text-[#475569] text-[9px] px-2 py-1 rounded-full font-bold">{selections.platform || 'Platform'}</span>
                  <span className="bg-[#EBE7FF] text-[#5352ED] text-[9px] px-2 py-1 rounded-full font-bold">{selections.language || 'Language'}</span>
                </div>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-2xl text-left">
                <p className="text-[9px] text-[#94A3B8] font-bold tracking-wider mb-2 uppercase">Goals</p>
                <div className="space-y-1.5 text-[11px] font-semibold text-[#0F172A]">
                  {selections.primaryGoals.length > 0 ? selections.primaryGoals.map(g => (
                    <div key={g} className="flex items-center gap-1.5"><FiTrendingUp className="text-[#5352ED]" /> {g}</div>
                  )) : <div className="text-gray-400">No goals selected</div>}
                </div>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-2xl text-left">
                <p className="text-[9px] text-[#94A3B8] font-bold tracking-wider mb-2 uppercase">Right Now</p>
                <p className="font-bold text-[#0F172A] text-xs mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Planning
                </p>
                <p className="text-[11px] text-[#64748B] truncate">{selections.recentSituation || 'Choosing an idea'}</p>
              </div>
            </div>

            <p className="italic text-[#94A3B8] text-xs mb-8">"Every creator has a different path. CKH starts with understanding yours."</p>

            <button
              type="button"
              onClick={handleNext}
              disabled={isGenerating}
              className="bg-[#5352ED] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-[#4342D9] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Setting up your workspace...</span>
                </>
              ) : (
                <>
                  <span>Enter Creator Workspace</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </div>
        </div>
      </>
    );
  }


  // STEPS 1, 2, 3 LAYOUT
  const currentSide = sidebarContent[step];

  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">

      {/* LEFT SIDE - Fixed */}
      <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] bg-[#F5F2FF] flex-col justify-center px-10 xl:px-14 py-10 h-screen sticky top-0 relative border-r border-[#EBE7FF]">
        {/* key={step} forces the enter animation to replay on step change */}
        <div key={`sidebar-${step}`} className="max-w-[480px] mx-auto w-full animate-page-enter">
          <div className="inline-flex items-center gap-2 bg-[#EBE7FF] text-[#5352ED] px-4 py-1.5 rounded-full text-xs font-bold mb-8">
            <BsStars size={14} />
            <span>{currentSide.tag}</span>
          </div>

          <h1 className="text-4xl xl:text-[42px] font-bold text-[#0F172A] leading-[1.1] tracking-[-0.03em] mb-4 whitespace-pre-line">
            {currentSide.title}
          </h1>

          <p className="text-[#64748B] text-sm xl:text-base leading-relaxed mb-12">
            {currentSide.desc}
          </p>

          <div className="w-full rounded-2xl overflow-hidden shadow-xl shadow-indigo-900/5 transition-all duration-500">
            <img src={currentSide.img} alt="Onboarding context" className="w-full h-[280px] object-cover" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE*/}
      <div ref={scrollRef} className="w-full lg:w-[60%] xl:w-[65%] h-screen overflow-y-auto px-5 py-8 md:px-12 lg:px-16 xl:px-24">

        <div key={`form-${step}`} className="max-w-[700px] mx-auto w-full pb-24 animate-page-enter-delay">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 md:h-12 w-auto object-contain" />
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-[#0F172A] block mb-2">Step {step} of 4</span>
              <div className="w-full sm:w-24 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#5352ED] transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
              </div>
            </div>
          </div>

          {/* --- STEP 1 --- */}
          {step === 1 && (
            <div>
              <div className="mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">Let's Get To Know You</h2>
                <p className="text-[#64748B] text-sm">Tell CKH what you create, who you create for, and what you're working toward. You can update these answers anytime.</p>
              </div>

              <div className="space-y-10">
                <div>
                  <h3 className="font-bold text-[#0F172A] mb-4 text-sm">What do you mainly create content about?</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {['Education', 'Lifestyle', 'Gaming', 'Business', 'Beauty', 'Technology', 'Food', 'Entertainment', 'Personal Branding', 'Art & Design', 'Travel', 'Music / Concert', 'Other'].map(item => (
                      <OptionBtn key={item} active={selections.topic === item} onClick={() => handleSingleSelect('topic', item)}>{item}</OptionBtn>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[#0F172A] mb-4 text-sm">Which one is your main platform right now?</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {['Facebook', 'TikTok', 'Instagram', 'YouTube'].map(item => (
                      <OptionBtn key={item} active={selections.platform === item} onClick={() => handleSingleSelect('platform', item)}>{item}</OptionBtn>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[#0F172A] mb-4 text-sm">Which language do you mostly create in?</h3>
                  <div className="space-y-3">
                    {['Khmer', 'English', 'Khmer & English'].map(item => (
                      <div
                        key={item}
                        onClick={() => handleSingleSelect('language', item)}
                        className="flex items-center gap-3 cursor-pointer w-max group"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selections.language === item ? 'border-[#5352ED]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                          {selections.language === item && <div className="w-3 h-3 bg-[#5352ED] rounded-full"></div>}
                        </div>
                        <span className="text-sm text-[#334155]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[#0F172A] mb-4 text-sm">How do you usually present your content?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Teach & explain clearly', 'Tell personal stories', 'Keep it fun & entertaining', 'Talk casually about everyday life', 'Inspire & motivate', 'Share practical or analytical insights'].map(item => (
                      <OptionBtn key={item} className="!justify-start !px-4 !py-4 rounded-xl" active={selections.presentation === item} onClick={() => handleSingleSelect('presentation', item)}>{item}</OptionBtn>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[#0F172A] mb-4 text-sm">Who are you mainly creating for?</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {['Teens', 'University students', 'Mixed', 'Young adults', 'Adults'].map(item => (
                      <OptionBtn key={item} active={selections.audience === item} onClick={() => handleSingleSelect('audience', item)}>{item}</OptionBtn>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[#0F172A] mb-4 text-sm">What kind of experience do you want people to have?</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {['Learn something', 'Be entertained', 'Get inspired', 'Join a community', 'Other'].map(item => (
                      <OptionBtn key={item} active={selections.experience === item} onClick={() => handleSingleSelect('experience', item)}>{item}</OptionBtn>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 2 --- */}
          {step === 2 && (
            <div>
              <div className="mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">What Are You Working Toward?</h2>
                <p className="text-[#64748B] text-sm">Choose what matters most to you right now. You can update this later.</p>
              </div>

              <div className="space-y-10">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider text-xs">Primary Goals <span className="text-[#94A3B8] font-normal">(Select up to 2)</span></h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'Reach More People', icon: <FiTrendingUp /> }, { label: 'Increase Engagement', icon: <FiHeart /> },
                      { label: 'Build My Personal Brand', icon: <FiTarget /> }, { label: 'Get Clients or Customers', icon: <FiShoppingBag /> },
                      { label: 'Build a Community', icon: <FiUsers /> }, { label: 'Get Brand Collaborations', icon: <FiBriefcase /> },
                      { label: 'Create More Consistently', icon: <FiRefreshCw /> }, { label: 'Earn More From My Content', icon: <FiDollarSign /> }
                    ].map(item => (
                      <OptionBtn
                        key={item.label}
                        className="!justify-start !px-4 !py-4 rounded-xl"
                        active={selections.primaryGoals.includes(item.label)}
                        onClick={() => handleMultiSelect('primaryGoals', item.label, 2)}
                      >
                        <span className="text-[#94A3B8] mr-2">{item.icon}</span> {item.label}
                      </OptionBtn>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[#0F172A] mb-4 text-sm uppercase tracking-wider text-xs">What matters most when you choose what to create?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'What my audience wants', 'What supports my current goal',
                      'What fits my creator style', 'What has worked for me before',
                      'What\'s relevant or trending', 'What I can realistically produce'
                    ].map(item => (
                      <OptionBtn
                        key={item} className="!justify-start !px-4 !py-4 rounded-xl"
                        active={selections.mattersMost === item}
                        onClick={() => handleSingleSelect('mattersMost', item)}
                      >
                        {item}
                      </OptionBtn>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 3 --- */}
          {step === 3 && (
            <div>
              <div className="mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">What's Your Current Situation?</h2>
                <p className="text-[#64748B] text-sm">Help us understand your current content so we can personalize your first Today's Brief.</p>
              </div>

              <div className="space-y-10">
                <div>
                  <h3 className="font-bold text-[#0F172A] mb-4 text-sm uppercase tracking-wider text-xs">What's been happening with your content recently?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'I\'m unsure what to create next', 'I\'m experimenting with different content',
                      'Some posts perform much better than others', 'I\'m not sure what my audience responds to',
                      'I\'m trying to post more consistently', 'I\'m coming back after a break',
                      'I\'m preparing for a campaign or event', 'I\'m just getting started'
                    ].map(item => (
                      <OptionBtn
                        key={item} className="!justify-start !px-4 !py-4 rounded-xl"
                        active={selections.recentSituation === item}
                        onClick={() => handleSingleSelect('recentSituation', item)}
                      >
                        {item}
                      </OptionBtn>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider text-xs">What's your biggest challenge right now?</h3>
                    <span className="text-[#94A3B8] text-xs">Max 2</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      'I\'m running out of ideas', 'I\'m unsure which idea to create', 'Limited time',
                      'Growing audience', 'Staying consistent', 'Growing engagement',
                      'Editing takes too long', 'Building audience connection', 'Producing higher-quality content'
                    ].map(item => (
                      <OptionBtn
                        key={item}
                        active={selections.biggestChallenge.includes(item)}
                        onClick={() => handleMultiSelect('biggestChallenge', item, 2)}
                      >
                        {item}
                      </OptionBtn>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider text-xs">What kind of support would help you most right now?</h3>
                    <span className="text-[#94A3B8] text-xs">Max 2</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      'New content ideas', 'Audience insights', 'Trend updates',
                      'Planning guidance', 'Production tips', 'Performance insights', 'Creative inspiration'
                    ].map(item => (
                      <OptionBtn
                        key={item}
                        active={selections.supportNeeded.includes(item)}
                        onClick={() => handleMultiSelect('supportNeeded', item, 2)}
                      >
                        {item}
                      </OptionBtn>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


          <div className="flex items-center justify-between pt-8 mt-10 border-t border-[#E2E8F0]">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all ${step === 1 ? 'border-transparent text-transparent cursor-default' : 'border-[#E2E8F0] text-[#475569] hover:bg-gray-50'
                }`}
            >
              <FiArrowLeft /> Back
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-all shadow-md ${isStepValid()
                ? 'bg-[#5352ED] text-white hover:bg-[#4342D9] hover:-translate-y-0.5 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
            >
              Continue <FiArrowRight />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}