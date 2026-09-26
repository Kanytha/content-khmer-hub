import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { getCreatorContext, evaluateSingleIdea, compareIdeas } from '../services/ideaEvaluationService';
import { useSubscription } from '../hooks/useSubscription';
import AddIdeaModal from '../components/AddIdeaModal';
import NotificationCenter from '../components/NotificationCenter';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import { 
  FiGrid, FiStar, FiEdit3, FiCompass, FiUser, 
  FiSettings, FiHelpCircle, FiX, FiPlus, 
  FiMenu 
} from 'react-icons/fi';
import { LuCalendar } from 'react-icons/lu';
import { MdDragIndicator } from 'react-icons/md';

export default function IdeasPage() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [context, setContext] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [comparison, setComparison] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [userId, setUserId] = useState(null);
  const [initials, setInitials] = useState('TE');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isPremium } = useSubscription();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const name = user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User';
      const parts = name.trim().split(/\s+/);
      const computedInitials = parts.length > 1 
        ? (parts[0][0] + parts[1][0]).toUpperCase() 
        : name.slice(0, 2).toUpperCase();
      setInitials(computedInitials);

      const cachedAvatar = localStorage.getItem('user_avatar_url');
      if (user.user_metadata?.avatar_url || user.user_metadata?.picture || cachedAvatar) {
        setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || cachedAvatar);
      }

      const ctx = await getCreatorContext(user.id);
      setContext(ctx);

      const { data: userIdeas, error: ideasError } = await supabase
        .from('content_ideas')
        .select('*, idea_evaluations(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!ideasError && userIdeas && userIdeas.length > 0) {
        const mostRecentTime = new Date(userIdeas[userIdeas.length - 1].created_at).getTime();
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        const isExpired = (Date.now() - mostRecentTime) > oneWeekMs;

        if (isExpired) {
          await supabase.from('content_ideas').delete().eq('user_id', user.id);
          await supabase.from('idea_comparisons').delete().eq('user_id', user.id);
          localStorage.removeItem(`ckh_comparison_${user.id}`);
          setIdeas([]);
          setEvaluations({});
          setComparison(null);
          return;
        }

        setIdeas(userIdeas);
        const evalMap = {};
        userIdeas.forEach(i => {
          if (i.idea_evaluations && i.idea_evaluations.length > 0) {
            evalMap[i.id] = i.idea_evaluations[0];
          }
        });
        setEvaluations(evalMap);

        const localCachedComp = localStorage.getItem(`ckh_comparison_${user.id}`);
        if (localCachedComp) {
          try {
            setComparison(JSON.parse(localCachedComp));
          } catch (e) {
            console.error(e);
          }
        }

        const { data: latestComp, error: compErr } = await supabase
          .from('idea_comparisons')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!compErr && latestComp) {
          setComparison(latestComp);
          localStorage.setItem(`ckh_comparison_${user.id}`, JSON.stringify(latestComp));
        }
      } else {
        localStorage.removeItem(`ckh_comparison_${user.id}`);
        setComparison(null);
      }
    }
    loadData();
  }, []);

  const handleSaveIdea = async (newIdeaData) => {
    const { data, error } = await supabase
      .from('content_ideas')
      .insert({ ...newIdeaData, user_id: userId })
      .select()
      .single();

    if (!error && data) {
      setIdeas(prev => [...prev, data]);
      setComparison(null);
      localStorage.removeItem(`ckh_comparison_${userId}`);
      await supabase.from('idea_comparisons').delete().eq('user_id', userId);
    }
  };

  const handleDeleteIdea = async (id) => {
    await supabase.from('content_ideas').delete().eq('id', id);
    const remaining = ideas.filter(i => i.id !== id);
    setIdeas(remaining);

    setEvaluations(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (remaining.length < 2) {
      setComparison(null);
      localStorage.removeItem(`ckh_comparison_${userId}`);
      await supabase.from('idea_comparisons').delete().eq('user_id', userId);
    }
  };

  const handleCompareIdeas = async () => {
    if (ideas.length === 0) return;
    setEvaluating(true);
    try {
      const updatedEvals = { ...evaluations };

      for (const idea of ideas) {
        if (!updatedEvals[idea.id]) {
          const evalRes = await evaluateSingleIdea(idea, context);
          updatedEvals[idea.id] = evalRes;
        }
      }
      setEvaluations(updatedEvals);

      const preparedList = ideas.map(idea => ({
        idea,
        eval: updatedEvals[idea.id]
      }));

      const compRes = await compareIdeas(preparedList, context);
      
      if (compRes) {
        setComparison(compRes);
        localStorage.setItem(`ckh_comparison_${userId}`, JSON.stringify(compRes));

        await supabase.from('idea_comparisons').insert({
          user_id: userId,
          strongest_fit_id: compRes.strongest_fit_id || null,
          standout_title: compRes.standout_title,
          standout_reason: compRes.standout_reason,
          relevant_context_note: compRes.relevant_context_note
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSelectIdea = async (selectedIdea) => {
    await supabase
      .from('content_ideas')
      .update({ status: 'chosen' })
      .eq('id', selectedIdea.id);

    navigate('/dashboard');
  };

  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col justify-between h-full py-8 px-4">
      <div>
        <div className="px-2 mb-10 flex justify-between items-center">
          <img src={logo} alt="Logo" className="h-12 w-auto object-contain cursor-pointer" onClick={() => navigate('/dashboard')} />
          <button 
            type="button"
            onClick={onClose} 
            className="md:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <nav className="space-y-1 text-sm font-semibold text-[#64748B]">
          <div 
            onClick={() => { onClose?.(); navigate('/dashboard'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
          >
            <FiGrid size={18} /> Dashboard
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/recommendations'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
          >
            <FiStar size={18} /> Recommendations
          </div>
          <div className="flex items-center gap-3 bg-[#FFFFFF] text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs transition-all duration-300 font-semibold">
            <FiEdit3 size={18} /> Ideas
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/opportunities'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
          >
            <FiCompass size={18} /> Opportunities
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/profile'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
          >
            <FiUser size={18} /> Profile
          </div>
        </nav>
      </div>

      <div className="space-y-1 text-sm font-semibold text-[#64748B]">
        <div 
          onClick={() => { onClose?.(); navigate('/account'); }}
          className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
        >
          <FiSettings size={18} /> Settings
        </div>
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold">
          <FiHelpCircle size={18} /> Support
        </div>
      </div>
    </div>
  );

  const getBadgeColors = (badge) => {
    if (badge === 'Strong Alignment') {
      return { bg: 'bg-[#E1DFFF]', text: 'text-[#2D26CB]' };
    }
    if (badge === 'Good Alignment') {
      return { bg: 'bg-[#D0E1FB]', text: 'text-[#54647A]' };
    }
    return { bg: 'bg-[#E4E1EE]', text: 'text-[#464555]' };
  };

  const getMetricTextColor = (val) => {
    if (val === 'Strong' || val === 'Very High') return 'text-[#5352ED]';
    return 'text-[#334155]';
  };

  const getRank = (badge) => {
    if (badge === 'Strong Alignment') return 1;
    if (badge === 'Good Alignment') return 2;
    if (badge === 'Possible Alignment') return 3;
    return 4;
  };

  const sortedEvaluatedIdeas = [...ideas].sort((a, b) => {
    const badgeA = evaluations[a.id]?.alignment_badge;
    const badgeB = evaluations[b.id]?.alignment_badge;
    return getRank(badgeA) - getRank(badgeB);
  });

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-[#0F172A]">
      
      {/* Sticky Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xs shadow-2xs">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={() => navigate('/dashboard')} />
        <div className="flex items-center gap-2">
          <NotificationCenter
            userId={userId}
            isPremium={isPremium}
            userNiche={context?.creator?.topic || ''}
          />
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 text-[#0F172A] hover:text-[#5352ED] transition-colors"
          >
            <FiMenu size={22} />
          </button>
        </div>
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

      <div className="flex-1 h-full overflow-y-auto bg-[#FFFFFF]">
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-6 space-y-6">
          
          {/* Desktop Topbar */}
          <div className="justify-end items-center gap-5 hidden md:flex">
            <NotificationCenter
              userId={userId}
              isPremium={isPremium}
              userNiche={context?.creator?.topic || ''}
            />
            <div 
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center overflow-hidden cursor-pointer shadow-2xs shrink-0"
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-[#FFF0F5] text-[#ED4B9E] flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2 text-[#0F172A]">
              Have something in mind?
            </h1>
            <p className="text-[#64748B] text-xs leading-relaxed max-w-2xl font-normal">
              Share what you're thinking about creating. We've compared your ideas based on your goals and audience to help you see which one may be worth prioritizing. The final choice is yours.
            </p>
          </div>

          <div className="bg-[#EEF2FF] border border-[#E0E7FE] rounded-2xl p-4 sm:px-6 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-normal">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#64748B]">
              <div>
                GOAL: <span className="text-[#0F172A] font-medium">{context?.creator?.goals || 'Reach More People'}</span>
              </div>
              <span className="hidden sm:inline text-gray-300">|</span>
              <div>
                FOCUS: <span className="text-[#0F172A] font-medium">{context?.creator?.topic || 'Education'}</span>
              </div>
              <span className="hidden sm:inline text-gray-300">|</span>
              <div>
                CONTEXT: <span className="text-[#0F172A] font-medium">{context?.currentContext?.contextPeriod || 'Current semester / Active exam cycle'}</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/edit-profile')}
              className="text-[#5352ED] hover:underline self-start md:self-auto font-medium"
            >
              Edit Context
            </button>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-[24px] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Your ideas</h3>
              <p className="text-xs text-[#64748B] mt-0.5 font-normal">Add the ideas you're deciding between.</p>
            </div>

            {ideas.length === 0 ? (
              <div className="border border-dashed border-[#CBD5E1] rounded-xl p-8 sm:p-12 text-center space-y-3 bg-[#FFFFFF]">
                <p className="text-xs text-[#94A3B8] font-normal">No ideas added yet. Start by adding your first content thought!</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#5352ED] bg-[#EEF2FF] px-4 py-2 rounded-lg hover:bg-[#E0E7FE] transition-colors font-semibold"
                >
                  <FiPlus size={14} /> Add your first idea
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {ideas.map((idea) => (
                  <div 
                    key={idea.id} 
                    className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-4 py-3.5 flex items-center justify-between text-xs font-normal text-[#0F172A] hover:border-gray-300 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MdDragIndicator className="text-[#CBD5E1] shrink-0" size={18} />
                      <span className="truncate">{idea.title}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteIdea(idea.id)} 
                      className="text-[#94A3B8] hover:text-red-500 p-1 shrink-0 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 gap-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-[#5352ED] flex items-center justify-center sm:justify-start gap-1 hover:underline py-2 font-semibold"
              >
                <FiPlus size={14} /> Add another idea
              </button>

              <button
                onClick={handleCompareIdeas}
                disabled={evaluating || ideas.length === 0}
                className="bg-[#5352ED] text-[#FFFFFF] text-xs px-7 py-2.5 rounded-xl hover:bg-[#4342D9] transition-colors disabled:opacity-50 font-semibold shadow-xs"
              >
                {evaluating ? 'Evaluating with CKH...' : 'Compare Ideas'}
              </button>
            </div>
          </div>

          {Object.keys(evaluations).length > 0 && (
            <div className="pt-6 space-y-6 font-normal">
              <div className="text-center">
                <span className="text-[11px] text-[#94A3B8] tracking-wider uppercase font-semibold">What CKH Considered</span>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {['Creator Identity', 'Audience', 'Goals', 'Recent Content', 'Context'].map(t => (
                    <span key={t} className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B] rounded-full px-3 py-1 text-[11px] font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvaluatedIdeas.map((idea) => {
                  const ev = evaluations[idea.id];
                  if (!ev) return null;

                  const { bg, text } = getBadgeColors(ev.alignment_badge);

                  return (
                    <div 
                      key={idea.id} 
                      className="bg-white border border-[#E5E7EB] rounded-2xl flex flex-col justify-between overflow-hidden transition-all font-normal shadow-2xs"
                    >
                      <div className="p-6 space-y-4">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-semibold ${bg} ${text}`}>
                          {ev.alignment_badge}
                        </span>

                        <h3 className="text-lg text-[#1E293B] leading-snug font-semibold">
                          {idea.title}
                        </h3>

                        <div className="text-xs divide-y divide-gray-100 font-normal">
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-[#64748B]">Goal Alignment</span>
                            <span className={`font-semibold ${getMetricTextColor(ev.goal_alignment)}`}>
                              {ev.goal_alignment}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-[#64748B]">Audience Fit</span>
                            <span className={`font-semibold ${getMetricTextColor(ev.audience_fit)}`}>
                              {ev.audience_fit}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-[#64748B]">Current Direction</span>
                            <span className={`font-semibold ${getMetricTextColor(ev.current_direction)}`}>
                              {ev.current_direction}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2.5 pt-1 text-xs font-normal">
                          <div>
                            <span className="text-[#94A3B8] block mb-0.5 font-medium">Recent Experience</span>
                            <p className="text-[#475569] leading-relaxed">{ev.recent_experience}</p>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block mb-0.5 font-medium">Timing / Context</span>
                            <p className="text-[#475569] leading-relaxed">{ev.timing_context}</p>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[#94A3B8] font-medium">Format</span>
                            <span className="text-[#334155] font-semibold">{ev.format_suggested}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#F8F9FE] border-t border-[#EEF0FE] p-5 text-xs font-normal space-y-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block mb-1 font-semibold">
                            One thing to consider
                          </span>
                          <p className="text-[#475569] leading-relaxed font-normal">
                            {ev.one_thing_to_consider}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectIdea(idea)}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white border border-[#D1D5DB] text-[#1E293B] hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-2xs"
                        >
                          Choose This Idea
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {comparison && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="bg-[#F4F2FF] border border-[#EBE7FA] p-7 rounded-2xl flex flex-col justify-start space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#463FAF] tracking-wide uppercase">
                      <LuCalendar size={16} /> RELEVANT RIGHT NOW
                    </div>
                    <p className="text-sm text-[#33384A] leading-relaxed font-normal">
                      {comparison.relevant_context_note}
                    </p>
                  </div>

                  <div className="md:col-span-2 relative bg-white border border-[#EDEBF5] p-7 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="pointer-events-none absolute -top-10 -right-10 w-60 h-60 bg-[#DDD9FE]/40 rounded-full blur-3xl" />

                    <div className="relative z-10 space-y-3">
                      <h3 className="text-xl font-semibold text-[#1E293B]">
                        What Stands Out
                      </h3>
                      
                      <div className="text-base text-[#1E293B] leading-snug">
                        <strong className="font-semibold">{comparison.standout_title}</strong> is the strongest fit right now.
                      </div>

                      <p className="text-sm text-[#475569] leading-relaxed font-normal pt-1">
                        {comparison.standout_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-[#F6F5FD] border border-[#EBE8F8] rounded-2xl py-5 px-6 text-center space-y-3 font-normal">
                <h2 className="text-base font-semibold text-[#1E293B] tracking-tight">
                  Want to explore other angles?
                </h2>
                
                <div className="flex justify-center">
                  <button 
                    onClick={handleCompareIdeas}
                    className="bg-white border border-[#D1D5DB] text-[#1E293B] px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
                  >
                    Compare Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddIdeaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveIdea} 
      />
    </div>
  );
}