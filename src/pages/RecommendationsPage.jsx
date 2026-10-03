import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../services/supabaseClient';
import UpgradeModal from '../components/UpgradeModal';
import SettingsPopover from "../components/SettingsPopover";
import { useLanguage } from '../context/LanguageContext';
import {
    connectYouTubeChannel,
    fetchChannelIntelligence,
    getValidYouTubeToken
} from '../services/youtubeIntelligenceService';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import {
    FiGrid, FiStar, FiEdit3, FiCompass, FiUser,
    FiSettings, FiHelpCircle, FiX, FiMenu,
    FiCheckCircle, FiYoutube, FiMessageSquare,
    FiArrowRight, FiUsers, FiEye, FiCheck, FiVideo, FiTarget, FiLock, FiZap
} from 'react-icons/fi';

export default function RecommendationsPage() {
    const navigate = useNavigate();
    const { isPremium, refreshSubscription } = useSubscription();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [youtubeData, setYoutubeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { t } = useLanguage();

    useEffect(() => {
        let isMounted = true;

        async function initPageData() {
            try {
                // 1. Grab session directly from Supabase
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user || (await supabase.auth.getUser()).data.user;
                if (!user) return;

                // 2. If returning from Google with a fresh provider token, fetch and sync immediately
                if (session?.provider_token) {
                    localStorage.setItem(`ckh_yt_token_${user.id}`, session.provider_token);
                    const freshData = await fetchChannelIntelligence(session.provider_token);
                    if (freshData && isMounted) {
                        setYoutubeData(freshData);
                        setIsConnected(true);
                        localStorage.setItem(`ckh_yt_data_${user.id}`, JSON.stringify(freshData));
                        return;
                    }
                }

                // 3. Fallback: Restore saved channel data from Supabase & localStorage
                const [profileRes, connRes] = await Promise.all([
                    supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle(),
                    supabase.from('creator_youtube_connections').select('*').eq('user_id', user.id).maybeSingle()
                ]);

                const profile = profileRes.data;
                const ytConn = connRes.data;

                let cachedData = profile?.youtube_data;
                if (!cachedData) {
                    try {
                        const localRaw = localStorage.getItem(`ckh_yt_data_${user.id}`);
                        if (localRaw) cachedData = JSON.parse(localRaw);
                    } catch (e) { }
                }

                if (cachedData && isMounted) {
                    setYoutubeData(cachedData);
                    setIsConnected(true);
                }

                // 3. Pro subscription check
                const now = new Date();
                const deadline = profile?.premium_until || profile?.current_period_end || profile?.subscription_end;
                const hasValidPeriod = deadline && new Date(deadline) > now;
                const userHasPro = Boolean(isPremium || profile?.is_premium || hasValidPeriod);

                // 4. Check for token (session or stored)
                const token = await getValidYouTubeToken();
                if (token && userHasPro) {
                    try {
                        const liveData = await fetchChannelIntelligence(token);
                        if (liveData && isMounted) {
                            setYoutubeData(liveData);
                            setIsConnected(true);
                            localStorage.setItem(`ckh_yt_data_${user.id}`, JSON.stringify(liveData));
                        }
                    } catch (e) {
                        console.warn("Background channel sync error:", e);
                    }
                }
            } catch (err) {
                console.error("Error loading recommendation page data:", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        initPageData();

        // 5. OAuth redirect listener: catches Google token right as you redirect back
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.provider_token && isMounted) {
                localStorage.setItem(`ckh_yt_token_${session.user.id}`, session.provider_token);
                try {
                    const liveData = await fetchChannelIntelligence(session.provider_token);
                    if (liveData && isMounted) {
                        setYoutubeData(liveData);
                        setIsConnected(true);
                        localStorage.setItem(`ckh_yt_data_${session.user.id}`, JSON.stringify(liveData));
                    }
                } catch (e) {
                    console.error("Auth state change fetch error:", e);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, [isPremium]);

    const handleConnect = async () => {
        try {
            await connectYouTubeChannel();
        } catch (error) {
            console.error("Failed to connect channel:", error);
        }
    };

    const SidebarContent = ({ onClose }) => {
        const { t } = useLanguage();

        return (
        <div className="flex flex-col justify-between h-full py-8 px-4 font-normal">
            <div>
                <div className="px-2 mb-10 flex justify-between items-center">
                    <img src={logo} alt="Logo" className="h-12 w-auto object-contain cursor-pointer" onClick={() => navigate('/dashboard')} />
                    <button type="button" onClick={onClose} className="md:hidden text-[#64748B]">
                        <FiX size={24} />
                    </button>
                </div>

                <nav className="space-y-1 text-sm font-semibold text-[#64748B]">
                    <div onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                        <FiGrid size={18} /> {t('dashboard')}
                    </div>
                    <div className="flex items-center gap-3 bg-white text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs font-bold">
                        <FiStar size={18} /> {t('recommendations')}
                    </div>
                    <div onClick={() => navigate('/ideas')} className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                        <FiEdit3 size={18} /> {t('ideas')}
                    </div>
                    <div onClick={() => navigate('/opportunities')} className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                        <FiCompass size={18} /> {t('opportunities')}
                    </div>
                    <div onClick={() => navigate('/profile')} className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                        <FiUser size={18} /> {t('profile')}
                    </div>
                </nav>
            </div>

            <div className="space-y-1 text-sm font-semibold text-[#64748B]">
                <SettingsPopover onCloseParent={onClose} />
                <div
                    onClick={() => navigate('/support')}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
                >
                    <FiHelpCircle size={18} /> {t('support')}
                </div>
            </div>
        </div>
    );
};

    return (
        <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-[#0F172A] bg-white">
            <div className="md:hidden flex items-center justify-between p-4 border-b border-[#E2E8F0]">
                <img src={logo} alt="Logo" className="h-10 w-auto" />
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#0F172A]">
                    <FiMenu size={24} />
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/30" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative w-[260px] bg-[#F5F2FF] h-full shadow-2xl">
                        <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <div className="hidden md:block w-[260px] h-full bg-[#F5F2FF] border-r border-[#E2E8F0] shrink-0">
                <SidebarContent onClose={() => { }} />
            </div>

            <div className="flex-1 h-full overflow-y-auto bg-[#FAFAFC] p-6 sm:p-10">
                <div className="max-w-5xl mx-auto space-y-8">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">{t('recTitle')}</h1>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isPremium ? 'bg-[#EEF2FF] text-[#5352ED]' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {isPremium ? t('premiumPlan') : t('freePlan')}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                                {t('recSubtitle')}
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="h-9 w-36 bg-slate-200/70 animate-pulse rounded-xl shrink-0" />
                        ) : !isPremium ? (
                            <button
                                type="button"
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5352ED] text-white text-xs font-bold hover:bg-[#4342D9] transition-all shrink-0 shadow-md cursor-pointer"
                            >
                                <FiZap size={15} /> Unlock Creator Intelligence ($2.99)
                            </button>
                        ) : !isConnected ? (
                            <button
                                type="button"
                                onClick={handleConnect}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] transition-colors shrink-0 shadow-xs cursor-pointer"
                            >
                                <FiYoutube size={16} /> Connect YouTube
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D] px-4 py-2 rounded-xl text-xs font-semibold shrink-0">
                                <FiCheckCircle size={15} />
                                <span>Connected: {youtubeData?.channelTitle || 'YouTube Channel'}</span>
                            </div>
                        )}
                    </div>

                    
                    {/* BASIC RECOMMENDATIONS - BILINGUAL */}
                    <div className="border border-[#E2E8F0] rounded-3xl p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#0F172A]">{t('contentFoundations')}</h2>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${isPremium
                                ? 'bg-[#EEF2FF] text-[#5352ED]'
                                : 'bg-slate-100 text-slate-600'
                                }`}>
                                {isPremium ? t('includedWithPremium') : t('freeTier')}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                                <span className="text-xs font-bold text-[#0F172A]">{t('consistencyTitle')}</span>
                                <p className="text-[11px] text-[#64748B] leading-relaxed">
                                    {t('consistencyDesc')}
                                </p>
                            </div>
                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                                <span className="text-xs font-bold text-[#0F172A]">{t('hookTitle')}</span>
                                <p className="text-[11px] text-[#64748B] leading-relaxed">
                                    {t('hookDesc')}
                                </p>
                            </div>
                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                                <span className="text-xs font-bold text-[#0F172A]">{t('khmerSearchTitle')}</span>
                                <p className="text-[11px] text-[#64748B] leading-relaxed">
                                    {t('khmerSearchDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isPremium ? (
                        <div className="relative border border-[#E2E8F0] rounded-3xl p-8 bg-gradient-to-b from-white to-[#F8F7FF] text-center overflow-hidden">
                            <div className="max-w-md mx-auto space-y-4 relative z-10 py-6">
                                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#5352ED] flex items-center justify-center mx-auto shadow-xs">
                                    <FiLock size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-[#0F172A]">{t('unlockTitle')}</h3>
                                <p className="text-xs text-[#64748B] leading-relaxed">
                                    {t('unlockDesc')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsUpgradeModalOpen(true)}
                                    className="px-6 py-3 bg-[#5352ED] hover:bg-[#4342D9] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                                >
                                    <FiZap size={14} /> {t('upgradeBtn')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {youtubeData && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B] mb-1">
                                            <FiUsers size={14} /> {t('subscribers')}
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                                            {Number(youtubeData?.subscribers || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B] mb-1">
                                            <FiEye size={14} /> {t('totalViews')}
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                                            {Number(youtubeData?.totalViews || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B] mb-1">
                                            <FiVideo size={14} /> {t('videosUploaded')}
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                                            {Number(youtubeData?.videoCount || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">{t('recentContent')}</h2>
                                {(youtubeData?.videos && youtubeData.videos.length > 0) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {youtubeData.videos.slice(0, 3).map((v, i) => (
                                            <a
                                                key={i}
                                                href={`https://www.youtube.com/watch?v=${v.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group border border-[#E2E8F0] rounded-2xl p-4 bg-white space-y-2 shadow-2xs hover:border-[#5352ED] transition-all cursor-pointer block"
                                            >
                                                <div className="h-32 bg-[#E2E8F0] rounded-xl overflow-hidden flex items-center justify-center text-xs text-[#94A3B8]">
                                                    {v.thumbnail ? (
                                                        <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                    ) : 'Thumbnail'}
                                                </div>
                                                <h3 className="font-semibold text-xs text-[#1E293B] truncate group-hover:text-[#5352ED] transition-colors">
                                                    {v.title}
                                                </h3>
                                                <div className="flex justify-between text-[11px] text-[#64748B]">
                                                    <span>{Number(v.views || 0).toLocaleString()} {t('totalViews').toLowerCase()}</span>
                                                    <span>{v.comments || 0} comments</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl text-center text-xs text-[#64748B]">
                                        {t('noVideosYet')}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-white space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[#5352ED]">
                                            <FiMessageSquare size={16} />
                                            <h3 className="font-bold text-sm text-[#0F172A]">{t('audienceComments')}</h3>
                                        </div>
                                        <span className="text-[11px] bg-[#EEF2FF] text-[#5352ED] font-bold px-2 py-0.5 rounded-full">
                                            {youtubeData?.recentComments?.length || 0} {t('foundCount')}
                                        </span>
                                    </div>

                                    {youtubeData?.recentComments?.length > 0 ? (
                                        <div className="space-y-2.5 max-h-48 overflow-y-auto">
                                            {youtubeData.recentComments.map((c, idx) => (
                                                <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-bold text-[#0F172A]">{c.author}</span>
                                                        <span className="text-[#94A3B8] text-[10px] truncate max-w-[150px]">on "{c.videoTitle}"</span>
                                                    </div>
                                                    <p className="text-xs text-[#334155] italic leading-relaxed">"{c.text}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center text-xs text-[#94A3B8]">
                                            {t('noCommentsYet')}
                                        </div>
                                    )}
                                </div>

                                <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-white space-y-4">
                                    <div className="flex items-center gap-2 text-[#5352ED]">
                                        <FiTarget size={16} />
                                        <h3 className="font-bold text-sm text-[#0F172A]">{t('demographicsTitle')}</h3>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                                            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">{t('estimatedAge')}</span>
                                            <span className="text-xs font-bold text-[#0F172A]">{youtubeData?.dominantNiche ? '18 - 24 years (Students / Junior Devs)' : '18 - 28 years (General Creators)'}</span>
                                        </div>
                                        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                                            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">{t('viewerIntent')}</span>
                                            <span className="text-xs font-medium text-[#334155]">{t('viewerIntentDesc')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white space-y-4">
                                <div className="flex items-center gap-2 text-[#0F172A]">
                                    <FiUsers className="text-[#5352ED]" size={18} />
                                    <h3 className="text-sm font-bold">{t('nicheInspiration')}</h3>
                                </div>
                                <p className="text-xs text-[#64748B]">
                                    {t('inspirationSubtitle')}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                                    {(youtubeData?.inspirationVideos || []).map((comp, idx) => (
                                        <a
                                            key={idx}
                                            href={`https://www.youtube.com/watch?v=${comp.videoId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC] space-y-2 hover:border-[#5352ED] hover:bg-white transition-all cursor-pointer block"
                                        >
                                            <div className="h-24 bg-gray-200 rounded-lg overflow-hidden">
                                                <img src={comp.thumbnail} alt={comp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                            </div>
                                            <h4 className="font-semibold text-xs text-[#1E293B] line-clamp-2 group-hover:text-[#5352ED] transition-colors">{comp.title}</h4>
                                            <span className="text-[10px] text-[#64748B] block truncate">{t('byAuthor')} {comp.channelTitle}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {youtubeData?.titleAudit && (
                                <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-[#0F172A]">{t('titleAuditHeader')}</h3>
                                            {youtubeData.titleAudit.detectedFormat && (
                                                <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                                                    {t('detectedPrefix')} {youtubeData.titleAudit.detectedFormat}
                                                </span>
                                            )}
                                        </div>
                                        {youtubeData.titleAudit.needsOptimization ? (
                                            <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-1 rounded-full">
                                                {t('showcaseSuggested')}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <FiCheck size={12} /> {t('titleLooksStrong')}
                                            </span>
                                        )}
                                    </div>

                                    {youtubeData.titleAudit.needsOptimization && (
                                        <div className="space-y-3">
                                            <p className="text-xs text-[#64748B]">
                                                {t('currentTitleLabel')} "{youtubeData.titleAudit.currentTitle}"
                                            </p>
                                            <div className="space-y-2">
                                                {youtubeData.titleAudit.recommendations.map((title, idx) => (
                                                    <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                                                        <span className="font-medium text-[#1E293B]">{title}</span>
                                                        <button
                                                            onClick={() => navigate('/ideas')}
                                                            className="text-[#5352ED] font-semibold flex items-center gap-1 hover:underline ml-2 shrink-0 cursor-pointer"
                                                        >
                                                            {t('useInIdeas')} <FiArrowRight size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onSuccess={() => {
                    refreshSubscription();
                }}
            />
        </div>
    );
}