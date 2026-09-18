import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import { 
  FiGrid, FiStar, FiEdit3, FiCompass, FiUser, 
  FiSettings, FiHelpCircle, FiX, FiMenu, FiArrowLeft, 
  FiSearch, FiCheckCircle, FiClock, FiMinusCircle
} from 'react-icons/fi';
import { FaMapPin } from 'react-icons/fa';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  
  const [summaryStats, setSummaryStats] = useState({
    recentFocus: 'Education',
    commonFormat: 'Short video',
    currentSeries: 'None',
    recentExperiment: 'Follow-up content'
  });

  const [noticingInsights, setNoticingInsights] = useState([
    {
      id: 'n1',
      text: "You've been returning to practical educational topics.",
      verified: true
    },
    {
      id: 'n2',
      text: "You've recently started experimenting with follow-up content.",
      verified: true
    }
  ]);

  useEffect(() => {
    async function loadUserHistory() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          navigate('/');
          return;
        }

        const [ideasRes, profileRes, onboardingRes] = await Promise.all([
          supabase.from('content_ideas').select('*, idea_evaluations(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('onboarding_responses').select('*').eq('user_id', user.id).maybeSingle()
        ]);

        const rawIdeas = ideasRes.data || [];
        const profile = profileRes.data || {};
        const onboarding = onboardingRes.data || {};
        const meta = user.user_metadata || {};

        const platform = 
          profile.platform || 
          profile.primary_platform || 
          onboarding.primary_platform || 
          meta.platform || 
          'YouTube';

        const focus = 
          profile.focus || 
          onboarding.creator_focus || 
          meta.focus || 
          'Education';

        let items = [];

        if (rawIdeas.length > 0) {
          const chosenCount = rawIdeas.filter(i => i.status === 'chosen' || i.status === 'published').length;
          
          items = rawIdeas.map((idea, index) => {
            let status = 'Idea';
            let note = 'Still considering whether this fits your current direction.';
            let iconType = 'neutral';

            if (idea.status === 'published' || index === 0 && chosenCount > 1) {
              status = 'Published';
              note = 'Reflection completed.';
              iconType = 'check';
            } else if (idea.status === 'chosen') {
              status = 'Published';
              note = 'You noticed that audience responded well to this direction.';
              iconType = 'pin';
            } else if (idea.status === 'discarded' || idea.status === 'rejected') {
              status = "Didn't Create";
              note = 'You considered this idea but prioritized your main series instead.';
              iconType = 'history';
            } else if (index === rawIdeas.length - 1 && rawIdeas.length > 2) {
              status = "Didn't Create";
              note = 'You considered this idea but chose to continue your focus series instead.';
              iconType = 'history';
            }

            const dateObj = new Date(idea.created_at);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const evaluation = idea.idea_evaluations?.[0];
            const format = idea.intended_format || evaluation?.format_suggested || 'Short video';

            return {
              id: idea.id,
              title: idea.title,
              date: formattedDate,
              platform: platform,
              format: format,
              status: status,
              note: note,
              iconType: iconType
            };
          });
        } else {
          items = [
            {
              id: 'sample-1',
              title: 'BACII Math Tips — Part 2',
              date: 'Aug 27',
              platform: platform,
              format: 'Short video',
              status: 'Published',
              note: 'You noticed that students wanted another example.',
              iconType: 'pin'
            },
            {
              id: 'sample-2',
              title: 'BACII Math Tips — Part 1',
              date: 'Aug 24',
              platform: platform,
              format: 'Short video',
              status: 'Published',
              note: 'Reflection completed.',
              iconType: 'check'
            },
            {
              id: 'sample-3',
              title: 'My Study Routine Before BACII',
              date: 'Aug 23',
              platform: platform,
              format: 'Short video',
              status: "Didn't Create",
              note: 'You considered this idea but chose to continue your BACII series instead.',
              iconType: 'history'
            },
            {
              id: 'sample-4',
              title: 'Digital Tools Students Should Know',
              date: 'Aug 21',
              platform: platform,
              format: 'Short video',
              status: 'Idea',
              note: 'Still considering whether this fits your current direction.',
              iconType: 'neutral'
            }
          ];
        }

        setHistoryItems(items);

        const formats = items.map(i => i.format).filter(Boolean);
        const formatFreq = {};
        formats.forEach(f => { formatFreq[f] = (formatFreq[f] || 0) + 1; });
        const mostCommonFormat = Object.keys(formatFreq).sort((a,b) => formatFreq[b] - formatFreq[a])[0] || 'Short video';

        const seriesCandidate = items.find(i => i.title.includes('—') || i.title.includes('Part') || i.title.includes('Series'));
        const resolvedSeries = seriesCandidate ? seriesCandidate.title.split('—')[0].trim() : 'Active Series';

        setSummaryStats({
          recentFocus: focus,
          commonFormat: mostCommonFormat,
          currentSeries: resolvedSeries,
          recentExperiment: 'Follow-up content'
        });

        setNoticingInsights([
          {
            id: 'n1',
            text: `You've been returning to practical ${focus.toLowerCase()} topics.`,
            verified: true
          },
          {
            id: 'n2',
            text: `You've recently started experimenting with ${mostCommonFormat.toLowerCase()} on ${platform}.`,
            verified: true
          }
        ]);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadUserHistory();
  }, [navigate]);

  const toggleInsightAccuracy = (id, isAccurate) => {
    setNoticingInsights(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, verified: isAccurate };
      }
      return item;
    }));
  };

  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
      const matchesTab = 
        activeTab === 'All' ? true :
        activeTab === 'Published' ? item.status === 'Published' :
        activeTab === 'Ideas' ? item.status === 'Idea' :
        activeTab === "Didn't Create" ? item.status === "Didn't Create" : true;

      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.note.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [historyItems, activeTab, searchQuery]);

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
        <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 space-y-8">
          
          <button 
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <FiArrowLeft size={14} /> Back to Profile
          </button>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
              Your Content History
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              See what you've created, explored, and learned along the way.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs">
            <div className="space-y-1">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#94A3B8] block">RECENT FOCUS</span>
              <p className="text-xs sm:text-sm font-medium text-[#1E293B]">{summaryStats.recentFocus}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#94A3B8] block">COMMON FORMAT</span>
              <p className="text-xs sm:text-sm font-medium text-[#1E293B]">{summaryStats.commonFormat}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#94A3B8] block">CURRENT SERIES</span>
              <p className="text-xs sm:text-sm font-medium text-[#1E293B]">{summaryStats.currentSeries}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#94A3B8] block">RECENT EXPERIMENT</span>
              <p className="text-xs sm:text-sm font-medium text-[#1E293B]">{summaryStats.recentExperiment}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['All', 'Published', 'Ideas', "Didn't Create"].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-xl text-xs font-normal transition-all whitespace-nowrap ${
                        activeTab === tab 
                          ? 'bg-[#5352ED] text-white shadow-xs' 
                          : 'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px] sm:w-56">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your content..."
                    className="w-full pl-9 pr-3.5 py-2 border border-[#E2E8F0] rounded-xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#5352ED] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#94A3B8] border border-dashed border-[#E2E8F0] rounded-2xl">
                    No content entries found.
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div key={item.id} className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-base font-medium text-[#1E293B] tracking-tight">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#64748B]">
                            <span>{item.date}</span>
                            <span>•</span>
                            <span>{item.platform}</span>
                            <span>•</span>
                            <span>{item.format}</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-normal shrink-0 ${
                          item.status === 'Published' 
                            ? 'bg-[#E1DFFF] text-[#2D26CB]' 
                            : item.status === 'Idea'
                            ? 'bg-[#EEF2FF] text-[#4338CA]'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="bg-[#F8F7FF] border border-[#ECE8FB] rounded-xl p-3.5 text-xs text-[#475569] flex items-center gap-2.5">
                        {item.iconType === 'pin' && <FaMapPin className="text-[#5352ED] shrink-0" size={13} />}
                        {item.iconType === 'check' && <FiCheckCircle className="text-[#5352ED] shrink-0" size={14} />}
                        {item.iconType === 'history' && <FiClock className="text-[#94A3B8] shrink-0" size={14} />}
                        {item.iconType === 'neutral' && <FiMinusCircle className="text-[#94A3B8] shrink-0" size={14} />}
                        <span>{item.note}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-8">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-6 shadow-2xs">
                
                <h3 className="text-base font-semibold text-[#1E293B] tracking-tight">
                  What CKH is noticing
                </h3>

                <div className="space-y-5">
                  {noticingInsights.map((insight) => (
                    <div key={insight.id} className="border-l-2 border-[#5352ED] pl-3.5 space-y-2.5">
                      <p className="text-xs text-[#334155] leading-relaxed">
                        {insight.text}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleInsightAccuracy(insight.id, true)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-normal border transition-colors ${
                            insight.verified
                              ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]'
                              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                          }`}
                        >
                          Still accurate
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleInsightAccuracy(insight.id, false)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-normal border transition-colors ${
                            !insight.verified
                              ? 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
                              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                          }`}
                        >
                          Not quite
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <h4 className="text-xs font-medium text-[#1E293B]">
                    How your history helps CKH
                  </h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    We use this context to tailor recommendations and spot patterns in your creative journey.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/edit-profile')}
                    className="text-xs font-medium text-[#5352ED] hover:underline block pt-1"
                  >
                    Manage My Information
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}