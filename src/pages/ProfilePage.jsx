import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useSubscription } from '../hooks/useSubscription';
import { cancelSubscription, resumeSubscription, disconnectYouTubeChannel } from '../services/subscriptionService';
import UpgradeModal from '../components/UpgradeModal';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import {
    FiGrid, FiStar, FiEdit3, FiCompass, FiUser,
    FiSettings, FiHelpCircle, FiX, FiMenu,
    FiBookmark, FiChevronRight, FiLogOut, FiEdit2,
    FiZap, FiCheckCircle, FiClock
} from 'react-icons/fi';
import { FiCompass as FiCompassOutline } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';
import { LuLayoutGrid, LuTrendingUp, LuSmartphone, LuHash } from 'react-icons/lu';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { isPremium, status, expiresAt, refreshSubscription } = useSubscription();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const [username, setUsername] = useState('Creator');
    const [initials, setInitials] = useState('CR');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [creatorProfile, setCreatorProfile] = useState({
        focus: 'Educational & Digital Content',
        goal: 'Grow My Audience',
        platform: 'YouTube',
        topics: ['Education', 'Digital Tools', 'How-to Content']
    });

    const [observations, setObservations] = useState([]);

    useEffect(() => {
        let isMounted = true;

        async function loadPersonalizedProfile() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const authUser = session?.user;
                if (!authUser) {
                    navigate('/');
                    return;
                }

                const meta = authUser.user_metadata || {};
                const displayName = meta.username || meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Creator';
                if (isMounted) setUsername(displayName);

                const parts = displayName.trim().split(/\s+/);
                const derivedInitials = parts.length > 1
                    ? (parts[0][0] + parts[1][0]).toUpperCase()
                    : displayName.slice(0, 2).toUpperCase();
                if (isMounted) setInitials(derivedInitials);

                if (meta.avatar_url || meta.picture) {
                    if (isMounted) setAvatarUrl(meta.avatar_url || meta.picture);
                }

                let localOnboarding = {};
                try {
                    const keys = ['onboarding', 'onboardingData', 'creator_onboarding', `onboarding_${authUser.id}`];
                    for (const key of keys) {
                        const raw = localStorage.getItem(key);
                        if (raw) localOnboarding = { ...localOnboarding, ...JSON.parse(raw) };
                    }
                } catch (e) { }

                const [profileRes, onboardingRes, ideasRes, compRes] = await Promise.all([
                    supabase.from('creator_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
                    supabase.from('onboarding_responses').select('*').eq('user_id', authUser.id).maybeSingle(),
                    supabase.from('content_ideas').select('*, idea_evaluations(*)').eq('user_id', authUser.id).order('created_at', { ascending: false }),
                    supabase.from('idea_comparisons').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false })
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
                    'Education';

                if (Array.isArray(detectedFocus) && detectedFocus.length > 0) detectedFocus = detectedFocus[0];
                if (typeof detectedFocus === 'string' && detectedFocus.includes('&')) {
                    detectedFocus = detectedFocus.split('&')[0].trim();
                }

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
                    rawTopics = [detectedFocus, 'Content Strategy'];
                }

                if (isMounted) {
                    setCreatorProfile({
                        focus: detectedFocus,
                        goal: detectedGoal,
                        platform: resolvedPlatform,
                        topics: rawTopics
                    });

                    const derivedObs = [];

                    const formatCounts = {};
                    userIdeas.forEach(i => {
                        const fmt = i.intended_format || (i.idea_evaluations && i.idea_evaluations[0]?.format_suggested);
                        if (fmt) {
                            formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
                        }
                    });
                    const topFormat = Object.keys(formatCounts).sort((a, b) => formatCounts[b] - formatCounts[a])[0];

                    if (userIdeas.length >= 2 && topFormat) {
                        derivedObs.push({
                            id: 'real-format',
                            icon: 'explore',
                            text: `You have submitted ${userIdeas.length} ideas recently, most often experimenting with ${topFormat}.`,
                            verified: true
                        });
                    } else if (userIdeas.length === 1) {
                        derivedObs.push({
                            id: 'real-format-single',
                            icon: 'explore',
                            text: `You started planning "${userIdeas[0].title}" tailored for ${resolvedPlatform}.`,
                            verified: true
                        });
                    }

                    const chosenIdea = userIdeas.find(i => i.status === 'chosen');
                    if (chosenIdea) {
                        derivedObs.push({
                            id: 'real-chosen',
                            icon: 'trend',
                            text: `You selected "${chosenIdea.title}" to pursue on ${resolvedPlatform}.`,
                            verified: true
                        });
                    } else if (userComparisons.length > 0 && userComparisons[0].standout_title) {
                        derivedObs.push({
                            id: 'real-compared',
                            icon: 'trend',
                            text: `Your strongest tested idea right now is "${userComparisons[0].standout_title}".`,
                            verified: true
                        });
                    }

                    const userSituation = merged.current_situation || merged.situation;
                    const userChallenge = Array.isArray(merged.biggest_challenge) ? merged.biggest_challenge[0] : merged.biggest_challenge;

                    if (userSituation && userChallenge) {
                        derivedObs.push({
                            id: 'real-situation-challenge',
                            icon: 'save',
                            text: `You reported: "${userSituation}", with your main hurdle being ${userChallenge.toLowerCase()}.`,
                            verified: true
                        });
                    } else if (userSituation) {
                        derivedObs.push({
                            id: 'real-situation',
                            icon: 'save',
                            text: `Your stated stage is: "${userSituation}".`,
                            verified: true
                        });
                    } else if (userChallenge) {
                        derivedObs.push({
                            id: 'real-challenge',
                            icon: 'save',
                            text: `CKH is tuned to assist you with ${userChallenge.toLowerCase()}.`,
                            verified: true
                        });
                    }

                    const wordFrequency = {};
                    userIdeas.forEach(i => {
                        const words = i.title.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, ''));
                        words.forEach(w => {
                            if (w.length > 3 && !['video', 'make', 'about', 'with', 'this', 'that', 'from', 'your'].includes(w)) {
                                wordFrequency[w] = (wordFrequency[w] || 0) + 1;
                            }
                        });
                    });
                    const repeatedTheme = Object.keys(wordFrequency).find(w => wordFrequency[w] >= 2);

                    if (repeatedTheme) {
                        derivedObs.push({
                            id: 'real-pattern',
                            icon: 'explore',
                            text: `CKH detected repeated focus on "${repeatedTheme}" across your recent topics.`,
                            verified: true
                        });
                    }

                    if (derivedObs.length === 0) {
                        derivedObs.push({
                            id: 'initial-state',
                            icon: 'explore',
                            text: `You just set up your profile targeting ${resolvedPlatform} with a primary goal to ${detectedGoal.toLowerCase()}. CKH will discover deeper patterns as you evaluate ideas.`,
                            verified: true
                        });
                    }

                    setObservations(derivedObs);
                }
            } catch (err) {
                console.error(err);
            }
        }

        loadPersonalizedProfile();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const toggleObservationAccuracy = (id) => {
        setObservations(prev => prev.map(obs => {
            if (obs.id === id) {
                return { ...obs, verified: !obs.verified };
            }
            return obs;
        }));
    };

    const SidebarContent = ({ onClose }) => (
        <div className="flex flex-col justify-between h-full py-8 px-4 font-normal">
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

                <nav className="space-y-1 text-sm font-normal text-[#64748B]">
                    <div
                        onClick={() => { onClose?.(); navigate('/dashboard'); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
                    >
                        <FiGrid size={18} /> Dashboard
                    </div>
                    <div
                        onClick={() => { onClose?.(); navigate('/recommendations'); }}
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
                        onClick={() => { onClose?.(); navigate('/opportunities'); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
                    >
                        <FiCompass size={18} /> Opportunities
                    </div>
                    <div className="flex items-center gap-3 bg-white text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs transition-all duration-300 font-bold">
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
                <SidebarContent onClose={() => { }} />
            </div>

            <div className="flex-1 h-full overflow-y-auto bg-white">
                <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 space-y-10">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                        <div className="flex items-center gap-5">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={username}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-[#E2E8F0] shadow-xs"
                                />
                            ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#FFF0F5] text-[#ED4B9E] rounded-full border border-pink-200 flex items-center justify-center font-medium text-2xl shadow-xs">
                                    {initials}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <h1 className="text-2xl sm:text-3xl font-semibold text-[#0F172A] tracking-tight">
                                    {username}
                                </h1>

                                <div className="flex items-center gap-1.5 text-xs text-[#5352ED] font-medium tracking-wide uppercase">
                                    <HiOutlineSparkles size={14} /> CONTENT CREATOR
                                </div>

                                <p className="text-xs text-[#64748B] leading-relaxed max-w-md pt-0.5">
                                    Keep your creator profile up to date so CKH can provide more relevant guidance.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/account')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-normal text-[#1E293B] hover:bg-gray-50 transition-colors self-start sm:self-center shadow-2xs"
                        >
                            <FiEdit2 size={13} /> Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                        <div className="lg:col-span-8 space-y-8">

                            <div className="space-y-4">
                                <h2 className="text-lg font-medium text-[#0F172A] tracking-tight">
                                    About You
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl space-y-2 shadow-2xs hover:border-[#CBD5E1] transition-all">
                                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] uppercase tracking-wider">
                                            <LuLayoutGrid size={15} /> CREATOR FOCUS
                                        </div>
                                        <p className="text-sm font-medium text-[#1E293B]">
                                            {creatorProfile.focus}
                                        </p>
                                    </div>

                                    <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl space-y-2 shadow-2xs hover:border-[#CBD5E1] transition-all">
                                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] uppercase tracking-wider">
                                            <LuTrendingUp size={15} /> CURRENT GOAL
                                        </div>
                                        <p className="text-sm font-medium text-[#1E293B]">
                                            {creatorProfile.goal}
                                        </p>
                                    </div>

                                    <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl space-y-2 shadow-2xs hover:border-[#CBD5E1] transition-all">
                                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] uppercase tracking-wider">
                                            <LuSmartphone size={15} /> PRIMARY PLATFORM
                                        </div>
                                        <div>
                                            <span className="inline-block bg-[#F1F5F9] text-[#334155] text-xs px-3 py-1 rounded-lg">
                                                {creatorProfile.platform}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl space-y-2 shadow-2xs hover:border-[#CBD5E1] transition-all">
                                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] uppercase tracking-wider">
                                            <LuHash size={15} /> CONTENT TOPICS
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {creatorProfile.topics.map((t, idx) => (
                                                <span key={idx} className="bg-[#EEF2FF] text-[#4338CA] text-xs px-2.5 py-1 rounded-lg">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div>
                                    <h2 className="text-lg font-medium text-[#0F172A] tracking-tight">
                                        CKH Observations
                                    </h2>
                                    <p className="text-xs text-[#64748B] mt-0.5 font-normal">
                                        Insights gathered to personalize your experience. You control what we know.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {observations.map((obs) => (
                                        <div
                                            key={obs.id}
                                            className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-[#CBD5E1] transition-all"
                                        >
                                            <div className="flex items-start sm:items-center gap-3.5">
                                                <div className="text-[#5352ED] mt-0.5 sm:mt-0 shrink-0">
                                                    {obs.icon === 'explore' && <FiCompassOutline size={18} />}
                                                    {obs.icon === 'save' && <FiBookmark size={18} />}
                                                    {obs.icon === 'trend' && <LuTrendingUp size={18} />}
                                                </div>
                                                <span className="text-xs sm:text-sm text-[#1E293B] leading-snug">
                                                    {obs.text}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/edit-profile')}
                                                    className="text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
                                                >
                                                    Update
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleObservationAccuracy(obs.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-normal border transition-colors ${obs.verified
                                                        ? 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]'
                                                        : 'border-[#D1D5DB] text-[#64748B] hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {obs.verified ? 'Still accurate' : 'Needs update'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                            
                            {/* Membership & Subscription Plan Card */}
                            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-2xs hover:border-[#CBD5E1] transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] uppercase tracking-wider font-medium">
                                        <FiZap size={14} className="text-[#5352ED]" /> MEMBERSHIP PLAN
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                        isPremium 
                                            ? status === 'cancelled'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-[#EEF2FF] text-[#5352ED] border border-[#C7D2FE]' 
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                        {isPremium ? (status === 'cancelled' ? 'Cancelling Soon' : 'Auto-Renew Active') : 'Free Tier'}
                                    </span>
                                </div>

                                {isPremium ? (
                                    <div className="space-y-3">
                                        <div className={`p-3 rounded-xl border space-y-1 ${
                                            status === 'cancelled'
                                                ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                                                : 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
                                        }`}>
                                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                                                <FiCheckCircle size={14} />
                                                <span>
                                                    {status === 'cancelled' 
                                                        ? 'Subscription Cancelled (No Future Charges)' 
                                                        : 'CKH Premium Active ($2.99 / mo)'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed opacity-90">
                                                {status === 'cancelled'
                                                    ? 'You will not be billed next month. You still have full access to all features until your 30-day term ends.'
                                                    : 'Your subscription will automatically renew each month. You can cancel anytime.'}
                                            </p>
                                        </div>

                                        {expiresAt && (
                                            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                                <span className="flex items-center gap-1.5 text-[#64748B]">
                                                    <FiClock size={13} className="text-[#5352ED]" /> 
                                                    {status === 'cancelled' ? 'Access ends on:' : 'Next billing date:'}
                                                </span>
                                                <span className="font-bold text-[#0F172A]">
                                                    {new Date(expiresAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                                            {status === 'cancelled' ? (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        await resumeSubscription();
                                                        refreshSubscription();
                                                    }}
                                                    className="w-full py-2.5 px-3 bg-[#5352ED] hover:bg-[#4342D9] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                                >
                                                    Keep My Subscription (Resume Auto-Renew)
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (window.confirm('Cancel auto-renew? You will NOT be charged next month, and you keep all premium features until your current 30-day period ends.')) {
                                                            await cancelSubscription();
                                                            refreshSubscription();
                                                        }
                                                    }}
                                                    className="w-full py-2 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                                                >
                                                    Cancel Auto-Renewal
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (window.confirm('Disconnect your linked YouTube channel?')) {
                                                        await disconnectYouTubeChannel();
                                                        window.location.reload();
                                                    }
                                                }}
                                                className="w-full py-2 px-3 border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] rounded-xl text-xs font-medium transition-colors cursor-pointer"
                                            >
                                                Disconnect YouTube Channel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-baseline justify-between">
                                            <div>
                                                <span className="text-xl font-bold text-[#0F172A]">$2.99</span>
                                                <span className="text-xs text-[#64748B]"> / month</span>
                                            </div>
                                            <span className="text-[11px] text-[#5352ED] font-medium">ABA PayWay</span>
                                        </div>
                                        <p className="text-xs text-[#64748B] leading-relaxed">
                                            Unlock real-time YouTube intelligence, audience signals, and title analysis.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setIsUpgradeModalOpen(true)}
                                            className="w-full py-2.5 px-4 bg-[#5352ED] hover:bg-[#4342D9] text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <FiZap size={14} /> Upgrade to Premium
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-[#0F172A] tracking-tight mb-2">
                                    Data & Privacy
                                </h3>

                                <div className="divide-y divide-gray-100 text-xs text-[#334155]">
                                    <div
                                        onClick={() => navigate('/manage-info')}
                                        className="py-3 flex items-center justify-between cursor-pointer hover:text-[#5352ED] transition-colors"
                                    >
                                        <span>Manage My Information</span>
                                    </div>
                                    <div
                                        onClick={() => navigate('/edit-profile')}
                                        className="py-3 flex items-center justify-between cursor-pointer hover:text-[#5352ED] transition-colors"
                                    >
                                        <span>How CKH Uses My Information</span>
                                        <FiChevronRight className="text-[#94A3B8]" size={15} />
                                    </div>
                                    <div
                                        onClick={() => navigate('/edit-profile')}
                                        className="py-3 flex items-center justify-between cursor-pointer hover:text-[#5352ED] transition-colors"
                                    >
                                        <span>Privacy & Data</span>
                                        <FiChevronRight className="text-[#94A3B8]" size={15} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h3 className="text-sm font-medium text-[#0F172A] tracking-tight mb-2">
                                    Settings
                                </h3>

                                <div className="space-y-3 text-xs text-[#334155]">
                                    <div
                                        onClick={() => navigate('/edit-profile')}
                                        className="cursor-pointer hover:text-[#5352ED] transition-colors"
                                    >
                                        Account
                                    </div>
                                    <div
                                        onClick={() => navigate('/account')}
                                        className="cursor-pointer hover:text-[#5352ED] transition-colors"
                                    >
                                        Security
                                    </div>
                                    <div
                                        onClick={() => navigate('/history')}
                                        className="cursor-pointer hover:text-[#5352ED] transition-colors"
                                    >
                                        History
                                    </div>
                                    <div
                                        onClick={() => navigate('/saved')}
                                        className="cursor-pointer hover:text-[#5352ED] transition-colors font-thin"
                                    >
                                        Saved
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="inline-flex items-center gap-2 text-xs text-red-600 hover:text-red-700 transition-colors font-medium cursor-pointer"
                                    >
                                        <FiLogOut size={14} /> Logout
                                    </button>
                                </div>
                            </div>

                        </div>

                    </div>

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