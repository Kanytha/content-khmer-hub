import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { generateOpportunityAnalysis } from '../services/aiService';
import NotificationCenter from '../components/NotificationCenter';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import {
    FiArrowLeft,
    FiExternalLink,
    FiCalendar,
    FiMapPin,
    FiClock,
    FiCheckCircle,
    FiBookmark,
    FiInfo,
    FiZap,
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

export default function OpportunityDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const oppId = searchParams.get('id');

    const [opportunity, setOpportunity] = useState(location.state?.opportunity || null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Profile & Notification Center state
    const [userId, setUserId] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [userNiche, setUserNiche] = useState('');
    const [initials, setInitials] = useState('CR');
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        const fetchOpportunityAndAnalysis = async () => {
            let activeOpp = opportunity;

            // 1. If not passed in router state, fetch by ID or get the latest from Supabase
            if (!activeOpp) {
                let query = supabase.from('opportunities').select('*');
                if (oppId) {
                    query = query.eq('id', oppId);
                } else {
                    query = query.order('created_at', { ascending: false }).limit(1);
                }

                const { data, error } = await query.maybeSingle();

                if (data && !error) {
                    activeOpp = data;
                    setOpportunity(data);
                }
            }

            // 2. If no opportunity exists anywhere, safely redirect to the main opportunities page
            if (!activeOpp) {
                navigate('/opportunities');
                return;
            }

            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                let selections = {};

                if (user) {
                    setUserId(user.id);

                    // User name & initials
                    const name = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
                    const parts = name.trim().split(/\s+/);
                    const computedInitials = parts.length > 1
                        ? (parts[0][0] + parts[1][0]).toUpperCase()
                        : name.slice(0, 2).toUpperCase();
                    setInitials(computedInitials);

                    const cachedAvatar = localStorage.getItem('user_avatar_url');
                    if (user.user_metadata?.avatar_url || user.user_metadata?.picture || cachedAvatar) {
                        setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || cachedAvatar);
                    }

                    // Profile data
                    const { data: profile } = await supabase
                        .from('creator_profiles')
                        .select('*')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (profile) {
                        if (profile.onboarding_answers) selections = profile.onboarding_answers;
                        if (profile.is_premium) setIsPremium(profile.is_premium);
                        if (profile.focus || profile.topic) setUserNiche(profile.focus || profile.topic);
                    }
                }

                const result = await generateOpportunityAnalysis(activeOpp, selections);
                setAnalysis(result);
            } catch (err) {
                console.error("Error analyzing opportunity:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOpportunityAndAnalysis();
    }, [oppId, navigate]);

    if (!opportunity) return null;

    const SidebarContent = () => (
        <div className="flex flex-col justify-between h-full py-8 px-4 bg-[#F8F7FF]">
            <div>
                <div className="px-2 mb-10 flex justify-between items-center">
                    <img
                        src={logo}
                        alt="Logo"
                        className="h-12 w-auto object-contain cursor-pointer"
                        onClick={() => navigate('/dashboard')}
                    />
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <nav className="space-y-1 text-sm font-semibold text-[#64748B]">
                    <div
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
                    >
                        <FiGrid size={18} /> Dashboard
                    </div>
                    <div
                        onClick={() => navigate('/recommendation-details')}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
                    >
                        <FiStar size={18} /> Recommendations
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300">
                        <FiEdit3 size={18} /> Ideas
                    </div>
                    <div
                        onClick={() => navigate('/opportunities')}
                        className="flex items-center gap-3 bg-[#FFFFFF] text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs font-bold"
                    >
                        <FiCompass size={18} /> Opportunities
                    </div>
                    <div
                        onClick={() => navigate('/onboarding')}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
                    >
                        <FiUser size={18} /> Profile
                    </div>
                </nav>
            </div>

            <div className="space-y-1 text-sm font-semibold text-[#64748B]">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300">
                    <FiSettings size={18} /> Settings
                </div>
                <div
                    onClick={() => navigate('/support')}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
                >
                    <FiHelpCircle size={18} /> Support
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FFFFFF] flex text-[#0F172A]">

            {/* DESKTOP SIDEBAR */}
            <aside className="w-64 bg-[#F8F7FF] border-r border-[#F1F0FE] hidden md:block shrink-0 sticky top-0 h-screen">
                <SidebarContent />
            </aside>

            {/* MOBILE SIDEBAR MODAL */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative w-64 bg-[#F8F7FF] shadow-xl flex flex-col z-10">
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0 bg-[#FFFFFF] flex flex-col">
                {/* Mobile Header Toggle */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E2E8F0]">
                    <img src={logo} alt="Logo" className="h-8 w-auto" />
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-[#64748B]">
                        <FiMenu size={22} />
                    </button>
                </div>

                <div className="p-6 md:p-10 space-y-6 max-w-[95%] mx-auto w-full">

                    {/* Top Header Matching Dashboard */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate('/opportunities')}
                            className="flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                        >
                            <FiArrowLeft size={16} /> Back to Opportunities
                        </button>

                        <div className="flex items-center gap-4">
                            {/* NotificationCenter without the wrapping button element */}
                            <div className="relative flex items-center">
                                <NotificationCenter
                                    userId={userId}
                                    isPremium={isPremium}
                                    userNiche={userNiche}
                                />
                            </div>

                            {/* User Avatar */}
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-[#FFE4E6] text-[#E11D48] text-xs font-bold flex items-center justify-center border border-[#FECDD3]">
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="bg-[#FFF7ED] text-[#EA580C] text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                            {opportunity.type}
                        </span>
                        <span className="text-xs text-[#64748B]">
                            • Source: <strong className="text-[#0F172A]">{opportunity.organizer || opportunity.source || 'Organizer'}</strong>
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                        {opportunity.title}
                    </h1>

                    {/* Two-Column Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">

                        {/* LEFT COLUMN: Factual Information & AI Guidance */}
                        <div className="lg:col-span-8 space-y-5">

                            {/* Factual Description Card */}
                            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs">
                                <h2 className="text-base font-bold mb-2 text-[#0F172A]">About This Opportunity</h2>
                                <p className="text-xs md:text-sm text-[#475569] leading-relaxed">
                                    {opportunity.description}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#F1F5F9] text-xs">
                                    <div className="flex items-start gap-3">
                                        <FiCalendar className="text-[#5352ED] shrink-0 mt-0.5" size={16} />
                                        <div>
                                            <span className="text-[#94A3B8] font-semibold uppercase text-[10px] block">Dates</span>
                                            <span className="font-semibold text-[#0F172A]">
                                                {opportunity.start_date} {opportunity.end_date && opportunity.end_date !== opportunity.start_date && `– ${opportunity.end_date}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <FiMapPin className="text-[#5352ED] shrink-0 mt-0.5" size={16} />
                                        <div>
                                            <span className="text-[#94A3B8] font-semibold uppercase text-[10px] block">Location</span>
                                            <span className="font-semibold text-[#0F172A]">{opportunity.location}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <FiClock className="text-[#DC2626] shrink-0 mt-0.5" size={16} />
                                        <div>
                                            <span className="text-[#94A3B8] font-semibold uppercase text-[10px] block">Registration Deadline</span>
                                            <span className="font-semibold text-[#DC2626]">{opportunity.deadline || 'Ongoing'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <FiCheckCircle className="text-[#5352ED] shrink-0 mt-0.5" size={16} />
                                        <div>
                                            <span className="text-[#94A3B8] font-semibold uppercase text-[10px] block">Eligibility</span>
                                            <span className="font-semibold text-[#0F172A]">{opportunity.eligibility || 'Open to all creators'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Why CKH Thinks It May Be Relevant (AI Generated) */}
                            <div className="bg-[#F8F7FF] rounded-2xl p-6 border border-[#ECEBFF] shadow-xs">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiZap className="text-[#5352ED]" size={18} />
                                    <h2 className="text-sm md:text-base font-bold text-[#0F172A]">Why CKH Thinks It May Be Relevant</h2>
                                </div>

                                {loading ? (
                                    <div className="flex items-center gap-2 py-4 text-xs text-[#64748B]">
                                        <div className="w-4 h-4 border-2 border-[#5352ED] border-t-transparent rounded-full animate-spin"></div>
                                        Evaluating relevance to your profile...
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-xs md:text-sm text-[#475569] leading-relaxed">
                                            {analysis?.why_relevant}
                                        </p>

                                        {analysis?.suggested_content_angle && (
                                            <div className="bg-white rounded-xl p-4 border border-[#E0E7FF]">
                                                <span className="text-[10px] font-bold text-[#5352ED] uppercase tracking-wider block mb-1">
                                                    Suggested Content Angle
                                                </span>
                                                <p className="text-xs text-[#0F172A] font-medium leading-relaxed">
                                                    {analysis.suggested_content_angle}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Things to Consider (Trade-offs & Constraints) */}
                            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs">
                                <h2 className="text-sm md:text-base font-bold text-[#0F172A] mb-3">Things to Consider</h2>
                                {loading ? (
                                    <div className="text-xs text-[#94A3B8]">Reviewing practical constraints...</div>
                                ) : (
                                    <ul className="space-y-2.5">
                                        {analysis?.considerations?.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-xs text-[#475569] leading-relaxed">
                                                <FiInfo className="text-[#64748B] shrink-0 mt-0.5" size={15} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Actions & Categories */}
                        <div className="lg:col-span-4 space-y-4">

                            {/* Action Box */}
                            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-3">
                                <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Actions</h3>

                                {opportunity.source_url ? (
                                    <a
                                        href={opportunity.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#5352ED] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#4342D9] transition-colors shadow-xs"
                                    >
                                        Open Official Announcement <FiExternalLink size={14} />
                                    </a>
                                ) : (
                                    <div className="text-xs text-[#94A3B8] text-center py-2 bg-gray-50 rounded-xl">
                                        No external link provided
                                    </div>
                                )}

                                <button
                                    onClick={() => setSaved(!saved)}
                                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-colors ${
                                        saved
                                            ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]'
                                            : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-gray-50'
                                    }`}
                                >
                                    <FiBookmark size={15} /> {saved ? 'Saved to Your List' : 'Save Opportunity'}
                                </button>

                                <button
                                    onClick={() => navigate('/opportunities')}
                                    className="w-full text-center text-xs text-[#94A3B8] hover:text-[#64748B] pt-2 transition-colors cursor-pointer"
                                >
                                    Mark as Not Relevant
                                </button>
                            </div>

                            {/* Topics Card */}
                            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
                                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-2">
                                    Matching Categories
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {opportunity.topics?.map((topic, i) => (
                                        <span
                                            key={i}
                                            className="bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-lg text-xs font-medium"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </main>

        </div>
    );
}