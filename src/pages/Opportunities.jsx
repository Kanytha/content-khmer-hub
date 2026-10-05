import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { isItemSaved, toggleSaveItem } from '../services/savedService';
import { useSubscription } from '../hooks/useSubscription';
import NotificationCenter from '../components/NotificationCenter';
import EditContextModal from "../components/EditContextModal";
import { useLanguage } from '../context/LanguageContext';
import SettingsPopover from "../components/SettingsPopover";
import logo from '../assets/images/LOGO1-removebg-preview.png';
import { 
  FiExternalLink, 
  FiMapPin, 
  FiCalendar, 
  FiBookmark, 
  FiArrowRight, 
  FiCheckCircle,
  FiGrid,
  FiStar,
  FiEdit3,
  FiCompass,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiX,
  FiMenu
} from 'react-icons/fi';

export default function Opportunities() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentGoal, setCurrentGoal] = useState('Reach More People');
  const [creatorTopic, setCreatorTopic] = useState('Education');
  const [initials, setInitials] = useState('CR');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userId, setUserId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isPremium } = useSubscription();
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    const loadOpportunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          if (profile.goal || profile.goals) setCurrentGoal(profile.goal || profile.goals[0]);
          if (profile.focus || profile.topic) setCreatorTopic(profile.focus || profile.topic);
        }

        const resolvedName =
          profile?.username ||
          profile?.full_name ||
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Creator';

        const parts = resolvedName.trim().split(/\s+/);
        const computedInitials = parts.length > 1 
          ? (parts[0][0] + parts[1][0]).toUpperCase() 
          : resolvedName.slice(0, 2).toUpperCase();
        setInitials(computedInitials);

        let resolvedAvatar = profile?.avatar_url || localStorage.getItem(`user_avatar_url_${user.id}`);
        const googlePhoto = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        if (!resolvedAvatar && googlePhoto) {
          resolvedAvatar = googlePhoto;
          supabase
            .from('creator_profiles')
            .update({ avatar_url: googlePhoto })
            .eq('user_id', user.id)
            .then(() => {});
        }

        const validAvatar = (typeof resolvedAvatar === 'string' && resolvedAvatar.trim().length > 5)
          ? resolvedAvatar.trim()
          : null;

        setAvatarUrl(validAvatar);

        const rawSaved = localStorage.getItem(`ckh_saved_items_${user.id}`);
        if (rawSaved) {
          try {
            const list = JSON.parse(rawSaved);
            setSavedIds(new Set(list.map(i => i.id)));
          } catch {}
        }
      }

      const { data: opps } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      setOpportunities(opps || []);
    } catch (err) {
      console.error("Failed to load opportunities:", err);
    }
  };

  loadOpportunities();
}, []);

  const handleSaveContext = async ({ goal, focus, contextPeriod }) => {
    if (focus) setCreatorTopic(focus);
    if (goal) setCurrentGoal(goal);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('creator_profiles')
          .update({
            topic: focus,
            goals: goal,
            context_period: contextPeriod
          })
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error("Failed to update creator context:", err);
    }
  };

  const handleToggleSaveOpp = (opp) => {
    if (!userId) return;
    const oppId = opp.id || `opp-${opp.title.replace(/\s+/g, '-').toLowerCase()}`;
    const payload = {
      id: oppId,
      title: opp.title,
      type: 'opportunity',
      category: opp.type,
      organizer: opp.organizer,
      deadline: opp.deadline,
      location: opp.location,
      reason: opp.description
    };

    const isNowSaved = toggleSaveItem(userId, payload);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isNowSaved) next.add(oppId);
      else next.delete(oppId);
      return next;
    });
  };

  const AVAILABLE_ALERT_TYPES = [
  'Scholarships',
  'Grants',
  'Brand Collaborations',
  'Workshops & Events',
  'Contests & Awards'
];

const [alertPrefs, setAlertPrefs] = useState([
  'Scholarships',
  'Grants',
  'Brand Collaborations',
  'Workshops & Events'
]);
const [savingPrefs, setSavingPrefs] = useState(false);
const [showPrefSavedBadge, setShowPrefSavedBadge] = useState(false);

// Load user's saved preferences on mount
useEffect(() => {
  async function loadUserPrefs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('creator_profiles')
      .select('opportunity_alert_preferences')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.opportunity_alert_preferences?.length) {
      setAlertPrefs(data.opportunity_alert_preferences);
    }
  }
  loadUserPrefs();
}, []);

const handleToggleAlertPref = async (type) => {
  const updated = alertPrefs.includes(type)
    ? alertPrefs.filter(t => t !== type)
    : [...alertPrefs, type];

  setAlertPrefs(updated);
  setSavingPrefs(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('creator_profiles')
        .update({ opportunity_alert_preferences: updated })
        .eq('user_id', user.id);

      setShowPrefSavedBadge(true);
      setTimeout(() => setShowPrefSavedBadge(false), 2000);
    }
  } catch (err) {
    console.error("Failed to save alert preferences:", err);
  } finally {
    setSavingPrefs(false);
  }
};

  const filters = ['All', 'Grants', 'Competitions', 'Campaigns', 'Events'];

  const filteredOpps = opportunities.filter(opp => {
    if (activeFilter === 'All') return true;
    return opp.type?.toLowerCase() === activeFilter.toLowerCase();
  });

  const getDaysRemaining = (deadlineStr) => {
    if (!deadlineStr) return null;
    const diff = new Date(deadlineStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const spotlightEvent = opportunities.find(opp => {
    const days = getDaysRemaining(opp.deadline);
    const matchesTopic = opp.topics?.some(t => t.toLowerCase() === creatorTopic.toLowerCase());
    return matchesTopic && days !== null && days >= 0 && days <= 35;
  });

  const SidebarContent = ({ onClose }) => {
    const handleNav = (path) => {
      onClose?.();
      navigate(path);
    };

    return (
      <div className="flex flex-col justify-between h-full py-8 px-4 bg-[#F8F7FF]">
        <div>
          <div className="px-2 mb-10 flex justify-between items-center">
            <img
              src={logo}
              alt="Logo"
              className="h-12 w-auto object-contain cursor-pointer"
              onClick={() => handleNav('/dashboard')}
            />
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
              onClick={() => handleNav('/dashboard')}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
            >
              <FiGrid size={18} /> {t('dashboard')}
            </div>
            <div
              onClick={() => handleNav('/recommendations')}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
            >
              <FiStar size={18} /> {t('recommendations')}
            </div>
            <div
              onClick={() => handleNav('/ideas')}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-sm rounded-xl cursor-pointer transition-all duration-300 font-semibold"
            >
              <FiEdit3 size={18} /> {t('ideas')}
            </div>
            <div
              className="flex items-center gap-3 bg-[#FFFFFF] text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs font-semibold"
            >
              <FiCompass size={18} /> {t('opportunities')}
            </div>
            <div
              onClick={() => handleNav('/profile')}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
            >
              <FiUser size={18} /> {t('profile')}
            </div>
          </nav>
        </div>

        <div className="space-y-1 text-sm font-semibold text-[#64748B]">
          <SettingsPopover onCloseParent={onClose} />
          <div
            onClick={() => handleNav('/support')}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiHelpCircle size={18} /> {t('support')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex text-[#0F172A]">
      
      <aside className="w-64 bg-[#F8F7FF] border-r border-[#F1F0FE] hidden md:block shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 bg-[#F8F7FF] shadow-xl flex flex-col z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 bg-[#FFFFFF] flex flex-col">
        {/* Sticky Mobile Topbar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-white/95 backdrop-blur-xs border-b border-[#E2E8F0] shadow-2xs">
          <img src={logo} alt="Logo" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
          <div className="flex items-center gap-2">
            <NotificationCenter
              userId={userId}
              isPremium={isPremium}
              userNiche={creatorTopic}
            />
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(true)} 
              className="p-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <FiMenu size={22} />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-8 max-w-[95%] mx-auto w-full">
          
          {/* Top header on tablet/desktop */}
          <div className="justify-end items-center gap-4 hidden md:flex">
            <NotificationCenter
              userId={userId}
              isPremium={isPremium}
              userNiche={creatorTopic}
            />
            <div 
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 shrink-0"
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-[#FFF0F5] text-[#ED4B9E] text-xs font-semibold flex items-center justify-center border border-pink-200">
                  {initials}
                </div>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t('oppTitle')}</h1>
            <p className="text-[#64748B] text-sm mt-1 leading-relaxed">
              {t('oppSubtitle')}
            </p>
          </div>

          <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-xl px-5 py-3.5 flex items-center justify-between">
            <div className="text-xs text-[#4338CA] font-medium">
              <span>
                {t('relevantFocusPrefix')}{' '}
                <strong>{currentGoal}</strong> ({creatorTopic})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsContextModalOpen(true)}
              className="text-xs text-[#5352ED] font-semibold hover:underline cursor-pointer"
            >
              {t('changeFocus')}
            </button>
          </div>

          {spotlightEvent && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] mb-3 uppercase tracking-wider">
                {t('upcomingEventHeader')}
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 relative max-w-xl shadow-xs">
                <div className="absolute top-0 right-0 bg-[#DC2626] text-white text-[11px] font-semibold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                  {t('deadlinePrefix')} {getDaysRemaining(spotlightEvent.deadline)} {t('daysSuffix')}
                </div>

                <div className="flex items-start gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <span>{t('sourcePrefix')} {spotlightEvent.organizer}</span>
                    </div>
                    <h3 className="text-base font-bold mt-1 text-[#0F172A]">{spotlightEvent.title}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 my-5 text-xs">
                  <div>
                    <span className="text-[#94A3B8] font-medium uppercase text-[10px]">{t('typeLabel')}</span>
                    <p className="font-semibold text-[#0F172A]">{spotlightEvent.type}</p>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] font-medium uppercase text-[10px]">{t('areaLabel')}</span>
                    <p className="font-semibold text-[#0F172A]">{spotlightEvent.topics?.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] font-medium uppercase text-[10px]">{t('locationLabel')}</span>
                    <p className="font-semibold text-[#0F172A]">{spotlightEvent.location}</p>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] font-medium uppercase text-[10px]">{t('deadlineLabel')}</span>
                    <p className="font-semibold text-[#DC2626]">{spotlightEvent.deadline}</p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => navigate('/opportunity-details', { state: { opportunity: spotlightEvent } })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-100 transition-colors"
                >
                  {t('viewDetailsBtn')}
                </button>
              </div>
            </div>
          )}


        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                {t('notifPrefTitle')}
              </h3>
              <p className="text-xs text-[#64748B]">
                {t('notifPrefSubtitle')}
              </p>
            </div>
            {showPrefSavedBadge && (
              <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1 rounded-full w-fit animate-fade-in">
                ✓ {t('savedBtn')}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {AVAILABLE_ALERT_TYPES.map((type) => {
              const isSelected = alertPrefs.includes(type);
              
              // Map dynamic chip labels to translations
              const typeTranslationKey = 
                type === 'Scholarships' ? 'prefScholarships' :
                type === 'Grants' ? 'prefGrants' :
                type === 'Brand Collaborations' ? 'prefBrandCollabs' :
                type === 'Workshops & Events' ? 'prefWorkshops' :
                type === 'Contests & Awards' ? 'prefContests' : null;

              const label = typeTranslationKey ? t(typeTranslationKey) : type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleToggleAlertPref(type)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#5352ED] text-white border-[#5352ED] shadow-xs'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-gray-300'
                  }`}
                >
                  <span>{isSelected ? '✓' : '+'}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold">{t('exploreOpportunitiesTitle')}</h2>
              
              <div className="flex flex-wrap gap-2">
                {filters.map(f => {
                  const filterLabels = {
                    All: t('filterAll'),
                    Grants: t('filterGrants'),
                    Competitions: t('filterCompetitions'),
                    Campaigns: t('filterCampaigns'),
                    Events: t('filterEvents')
                  };

                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setActiveFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${activeFilter === f
                          ? 'bg-[#5352ED] text-white shadow-xs'
                          : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                        }`}
                    >
                      {filterLabels[f] || f}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {filteredOpps.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-sm text-[#64748B]">
                  No active opportunities found for this category. Check back soon!
                </div>
              ) : (
                filteredOpps.map(opp => {
                  const oppId = opp.id || `opp-${opp.title.replace(/\s+/g, '-').toLowerCase()}`;
                  const isSaved = savedIds.has(oppId);
                  const isRelevant = opp.topics?.some(t => t.toLowerCase() === creatorTopic.toLowerCase());

                  return (
                    <div 
                      key={opp.id}
                      className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="bg-[#FFF7ED] text-[#EA580C] font-bold px-2.5 py-0.5 rounded uppercase text-[10px]">
                            {opp.type}
                          </span>
                          <span className="text-[#64748B] flex items-center gap-1">
                            • Source: {opp.organizer}
                          </span>
                          {isRelevant && (
                            <span className="bg-[#EEF2FF] text-[#5352ED] font-bold px-2 py-0.5 rounded text-[10px]">
                              Relevant to your focus ({creatorTopic})
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-[#0F172A]">{opp.title}</h3>
                        <p className="text-xs text-[#64748B] leading-relaxed">{opp.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                          <span className="flex items-center gap-1"><FiCalendar size={13} /> Event: {opp.start_date}</span>
                          <span className="flex items-center gap-1"><FiMapPin size={13} /> {opp.location}</span>
                          <span className="flex items-center gap-1"><FiCheckCircle size={13} /> {opp.eligibility}</span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                        <button 
                          type="button"
                          onClick={() => navigate('/opportunity-details', { state: { opportunity: opp } })}
                          className="text-xs text-[#5352ED] font-bold flex items-center gap-1 hover:underline"
                        >
                          {t('viewOpportunityBtn')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleToggleSaveOpp(opp)}
                          className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                            isSaved 
                              ? 'bg-[#EEF2FF] border-[#5352ED] text-[#5352ED] font-semibold' 
                              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                          }`}
                        >
                          <FiBookmark size={13} className={isSaved ? 'fill-current' : ''} />
                          {isSaved ? t('savedBtn') : t('saveBtn')}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>
      
      <EditContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        context={{
          creator: {
            goals: currentGoal || 'Reach More People',
            topic: creatorTopic || 'Education'
          },
          currentContext: {
            contextPeriod: 'Current semester / Active exam cycle'
          }
        }}
        onSave={handleSaveContext}
      />

    </div>
  );
}