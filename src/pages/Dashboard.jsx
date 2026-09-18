import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { toggleSaveItem } from '../services/savedService';
import { useSubscription } from '../hooks/useSubscription';
import SubscriptionPromptModal from '../components/SubscriptionPromptModal';
import {
  FiGrid, FiStar, FiEdit3, FiCompass, FiUser,
  FiSettings, FiHelpCircle, FiBell, FiX, FiBookmark, FiMessageSquare, FiMenu, FiRotateCcw
} from 'react-icons/fi';
import logo from "../assets/images/LOGO1-removebg-preview.png";
import emptyStateImg from "../assets/images/empty.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  const [dismissPendingItem, setDismissPendingItem] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const undoTimeoutRef = useRef(null);

  const { isPremium, loading: subLoading } = useSubscription();
  const [showPromoModal, setShowPromoModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchWorkspace = async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        let user = session?.user;

        if (!user) {
          const { data } = await supabase.auth.getUser();
          user = data?.user;
        }

        if (!user) {
          if (isMounted) navigate('/login');
          return;
        }

        if (!isMounted) return;
        setCurrentUser(user);

        const { data, error } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching creator profile:", error);
        }

        if (!data) {
          if (isMounted) navigate('/onboarding');
          return;
        }

        const resolvedAvatar =
          data?.avatar_url ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          localStorage.getItem('user_avatar_url');

        if (resolvedAvatar && isMounted) {
          setAvatarUrl(resolvedAvatar);
        }

        if (isMounted) {
          setDashboardData(data);

          const rawSaved = localStorage.getItem(`ckh_saved_items_${user.id}`);
          if (rawSaved) {
            try {
              const list = JSON.parse(rawSaved);
              setSavedIds(new Set(list.map(i => i.id)));
            } catch {}
          }
        }
      } catch (error) {
        console.error("Error fetching workspace:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchWorkspace();

    window.addEventListener('focus', fetchWorkspace);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', fetchWorkspace);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, [navigate]);

  useEffect(() => {
    if (!subLoading && !isPremium && currentUser) {
      const storageKey = `ckh_promo_seen_${currentUser.id}`;
      const alreadySeen = localStorage.getItem(storageKey);

      if (!alreadySeen) {
        const timer = setTimeout(() => {
          setShowPromoModal(true);
          localStorage.setItem(storageKey, 'true');
        }, 20000);

        return () => clearTimeout(timer);
      }
    }
  }, [subLoading, isPremium, currentUser]);

  const handleClosePromo = () => {
    setShowPromoModal(false);
    if (currentUser) {
      localStorage.setItem(`ckh_promo_seen_${currentUser.id}`, 'true');
    }
  };

  const handleToggleBookmark = (rec) => {
    if (!currentUser) return;
    const recId = rec.id || `rec-${rec.title.replace(/\s+/g, '-').toLowerCase()}`;
    const payload = {
      id: recId,
      title: rec.title,
      type: 'recommendation',
      reason: rec.reason
    };

    const isNowSaved = toggleSaveItem(currentUser.id, payload);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isNowSaved) next.add(recId);
      else next.delete(recId);
      return next;
    });
  };

  const confirmDismiss = async () => {
    if (!dashboardData || !currentUser || !dismissPendingItem) return;

    const recToDismiss = dismissPendingItem;
    const originalIndex = dashboardData.active_recommendations.findIndex(
      (rec) => rec.title === recToDismiss.title
    );

    const updatedActive = dashboardData.active_recommendations.filter(
      (rec) => rec.title !== recToDismiss.title
    );
    const updatedHistory = [...(dashboardData.history_recommendations || []), recToDismiss];

    setDashboardData({
      ...dashboardData,
      active_recommendations: updatedActive,
      history_recommendations: updatedHistory
    });

    setDismissPendingItem(null);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({ item: recToDismiss, index: originalIndex });

    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 6000);

    await supabase
      .from('creator_profiles')
      .update({
        active_recommendations: updatedActive,
        history_recommendations: updatedHistory
      })
      .eq('user_id', currentUser.id);
  };

  const handleUndoDismiss = async () => {
    if (!undoToast || !dashboardData || !currentUser) return;

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    const { item, index } = undoToast;
    const restoredActive = [...dashboardData.active_recommendations];
    restoredActive.splice(index >= 0 ? index : 0, 0, item);

    const restoredHistory = (dashboardData.history_recommendations || []).filter(
      (rec) => rec.title !== item.title
    );

    setDashboardData({
      ...dashboardData,
      active_recommendations: restoredActive,
      history_recommendations: restoredHistory
    });

    setUndoToast(null);

    await supabase
      .from('creator_profiles')
      .update({
        active_recommendations: restoredActive,
        history_recommendations: restoredHistory
      })
      .eq('user_id', currentUser.id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="animate-float mb-6">
          <img src={logo} alt="CKH Logo" className="h-14 w-auto object-contain opacity-80" />
        </div>
        <p className="text-[#5352ED] font-bold animate-pulse tracking-wide text-sm uppercase">
          Opening your workspace...
        </p>
      </div>
    );
  }

  const displayName = dashboardData?.username
    || dashboardData?.full_name
    || currentUser?.user_metadata?.username
    || currentUser?.user_metadata?.full_name
    || currentUser?.email?.split('@')[0]
    || 'Creator';

  const initials = displayName.substring(0, 2).toUpperCase();

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
          <div className="flex items-center gap-3 bg-[#FFFFFF] text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs font-bold">
            <FiGrid size={18} /> Dashboard
          </div>
          <div
            onClick={() => navigate('/recommendations')}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors"
          >
            <FiStar size={18} /> Recommendations
          </div>
          <div
            onClick={() => navigate('/ideas')}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors"
          >
            <FiEdit3 size={18} /> Ideas
          </div>
          <div
            onClick={() => navigate('/opportunities')}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors"
          >
            <FiCompass size={18} /> Opportunities
          </div>
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors"
          >
            <FiUser size={18} /> Profile
          </div>
        </nav>
      </div>

      <div className="space-y-1 text-sm font-semibold text-[#64748B]">
        <div
          onClick={() => navigate('/account')}
          className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors"
        >
          <FiSettings size={18} /> Settings
        </div>
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] rounded-xl cursor-pointer transition-colors">
          <FiHelpCircle size={18} /> Support
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-[#0F172A] bg-white font-normal">

      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-[#FFFFFF]">
        <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
        <button
          type="button"
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
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="hidden md:block w-[250px] lg:w-[260px] h-full bg-[#F5F2FF] border-r border-[#E2E8F0] shrink-0 z-10">
        <SidebarContent />
      </div>

      <div className="flex-1 h-full overflow-y-auto px-5 pb-5 pt-3 md:px-8 md:pb-8 md:pt-4 lg:px-12 lg:pb-12 lg:pt-4 bg-[#FFFFFF]">

        <div className="flex justify-end items-center mb-8 gap-5 hidden md:flex">
          <button className="text-[#94A3B8] hover:text-[#0F172A] transition-colors">
            <FiBell size={20} />
          </button>
          <div
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center overflow-hidden shadow-xs cursor-pointer hover:border-[#5352ED] transition-colors shrink-0 bg-[#FFF0F5]"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <div className="w-full h-full text-[#ED4B9E] font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-12">

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#EEF2FF] text-[#5352ED] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                {dashboardData?.onboarding_answers?.primaryGoals?.[0] || "Your Primary Goal"}
              </span>
              <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide">Current Goal</span>
            </div>

            <h1 className="text-3xl lg:text-[32px] font-bold mb-8 tracking-tight text-[#0F172A]">
              Welcome back, {displayName}.
            </h1>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl mb-4 shadow-2xs">
              <h2 className="text-[#5352ED] font-bold text-sm mb-1">Your Current Focus</h2>
              <p className="text-[#64748B] text-xs italic mb-3">{dashboardData?.current_focus?.title || "Tailoring insights..."}</p>
              <p className="text-[#0F172A] text-sm font-medium leading-relaxed">
                {dashboardData?.current_focus?.description || "Your current focus will update as you review recommendations and ideas."}
              </p>
            </div>

            {dashboardData?.active_recommendations?.length > 0 ? (
              <div className="bg-[#F5F2FF] border border-[#E2E8F0] p-6 rounded-2xl flex gap-4 items-start shadow-2xs">
                <div className="bg-[#FFFFFF] text-[#5352ED] p-2 rounded-xl mt-1 shadow-xs"><FiMessageSquare size={18} /></div>
                <div>
                  <h3 className="font-bold mb-2 text-[#0F172A]">Turn questions into content</h3>
                  <p className="text-[#64748B] text-xs leading-relaxed mb-4">
                    Your recent post sparked several similar questions from your audience. Responding to them now can strengthen engagement.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/recommendations')}
                    className="bg-[#5352ED] text-[#FFFFFF] text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#4342D9] transition-colors shadow-xs cursor-pointer"
                  >
                    View Recommendation
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl flex gap-4 items-start shadow-2xs">
                <div className="bg-[#FFFFFF] text-[#5352ED] p-2 rounded-xl mt-1 shadow-xs"><FiCompass size={18} /></div>
                <div>
                  <h3 className="font-bold mb-2 text-[#0F172A]">Let's build your first strategy</h3>
                  <p className="text-[#64748B] text-xs leading-relaxed mb-4">
                    Welcome to the Hub! We are currently analyzing your goals. Your first set of tailored content recommendations will appear here soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#F1F5F9] shadow-xs transition-colors cursor-pointer"
                  >
                    Explore Your Profile →
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[320px] space-y-4">
            {dashboardData?.recent_reflection ? (
              <>
                <div className="border border-[#E2E8F0] bg-[#FFFFFF] p-5 rounded-2xl shadow-2xs">
                  <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wide">Your Recent Reflection</span>
                  <h3 className="font-bold mt-2 mb-2 text-[#0F172A]">{dashboardData.recent_reflection.title}</h3>
                  <p className="text-xs text-[#64748B] mb-4">{dashboardData.recent_reflection.description}</p>
                  <button
                    type="button"
                    className="w-full border border-[#E2E8F0] text-[#0F172A] text-xs font-bold py-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                  >
                    Explore Next Step
                  </button>
                </div>

                <div className="bg-[#F5F2FF] border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs">
                  <span className="text-[10px] text-[#5352ED] font-bold uppercase tracking-wide">Reflection Follow-Up</span>
                  <p className="font-bold italic text-sm mt-3 mb-4 text-[#0F172A]">"What was the most rewarding interaction you had with a follower this week?"</p>
                  <button
                    type="button"
                    className="text-[#5352ED] text-xs font-bold hover:underline transition-all"
                  >
                    Share Experience →
                  </button>
                </div>
              </>
            ) : (
              <div className="border-2 border-dashed border-[#E2E8F0] bg-transparent p-6 rounded-2xl text-center flex flex-col items-center justify-center h-full min-h-[200px]">
                <img src={emptyStateImg} alt="No reflections yet" className="w-32 h-32 object-contain mb-4 opacity-90" />
                <p className="text-[#64748B] text-xs font-medium leading-relaxed">
                  Your reflections will appear here once you complete and post your first recommendation.
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-[22px] font-bold mb-6 text-[#0F172A]">Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {dashboardData?.active_recommendations?.map((rec, index) => {
              const recId = rec.id || `rec-${rec.title.replace(/\s+/g, '-').toLowerCase()}`;
              const isSaved = savedIds.has(recId);

              return (
                <div key={index} className="border border-[#E2E8F0] bg-[#F8FAFC] p-6 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-[#5352ED] transition-colors">
                  <div>
                    <div className="w-10 h-10 bg-[#FFFFFF] border border-[#E2E8F0] rounded-full flex items-center justify-center text-[#64748B] mb-4 shadow-xs">
                      <FiStar size={18} />
                    </div>
                    <h3 className="font-bold text-lg leading-snug mb-3 text-[#0F172A]">{rec.title}</h3>
                    <span className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B] text-[10px] font-bold px-2 py-1 rounded-md uppercase">Why?</span>
                    <p className="text-xs text-[#64748B] mt-3 leading-relaxed">{rec.reason}</p>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-5 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => navigate('/recommendation-details', { state: { recommendation: rec } })}
                      className="bg-[#5352ED] text-[#FFFFFF] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#4342D9] transition-colors shadow-xs cursor-pointer"
                    >
                      View Details
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(rec)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors cursor-pointer ${isSaved
                          ? 'bg-[#EEF2FF] border-[#5352ED] text-[#5352ED]'
                          : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#5352ED]'
                          }`}
                        title={isSaved ? "Saved in library" : "Save to library"}
                      >
                        <FiBookmark size={14} className={isSaved ? 'fill-current' : ''} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissPendingItem(rec)}
                        className="w-9 h-9 flex items-center justify-center bg-[#FFFFFF] border border-[#E2E8F0] rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-100 text-[#94A3B8] transition-colors cursor-pointer"
                        title="Dismiss this idea"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {dashboardData?.active_recommendations?.length === 0 && (
              <div className="col-span-3 text-center py-10 border-2 border-dashed border-[#E2E8F0] rounded-2xl">
                <p className="text-[#64748B] font-medium">You caught up! All recommendations viewed.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {dismissPendingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#0F172A]">
                Dismiss Recommendation?
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                "{dismissPendingItem.title}" will be moved to your history so CKH can suggest fresh angles.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDismissPendingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDismiss}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-xl border border-gray-800 text-xs">
          <span>Recommendation dismissed</span>
          <button
            type="button"
            onClick={handleUndoDismiss}
            className="flex items-center gap-1.5 text-[#5352ED] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
          >
            <FiRotateCcw size={13} /> Undo
          </button>
          <button
            type="button"
            onClick={() => setUndoToast(null)}
            className="text-gray-400 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      <SubscriptionPromptModal
        isOpen={showPromoModal}
        onClose={handleClosePromo}
      />

    </div>
  );
}