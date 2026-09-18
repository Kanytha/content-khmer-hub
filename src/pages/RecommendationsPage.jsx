import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import UpgradeModal from '../components/UpgradeModal';
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

    useEffect(() => {
        async function loadIntelligence() {
            if (!isPremium) return;
            try {
                const token = await getValidYouTubeToken();
                if (token) {
                    setIsConnected(true);
                    const data = await fetchChannelIntelligence(token);
                    if (data) setYoutubeData(data);
                }
            } catch (err) {
                console.error(err);
            }
        }
        loadIntelligence();
    }, [isPremium]);

    const SidebarContent = ({ onClose }) => (
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
                        <FiGrid size={18} /> Dashboard
                    </div>
                    <div className="flex items-center gap-3 bg-white text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs font-bold">
                        <FiStar size={18} /> Recommendations
                    </div>
                    <div onClick={() => navigate('/ideas')} className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                        <FiEdit3 size={18} /> Ideas
                    </div>
                    <div onClick={() => navigate('/opportunities')} className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                        <FiCompass size={18} /> Opportunities
                    </div>
                    <div onClick={() => navigate('/profile')} className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                        <FiUser size={18} /> Profile
                    </div>
                </nav>
            </div>

            <div className="space-y-1 text-sm font-semibold text-[#64748B]">
                <div onClick={() => navigate('/account')} className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                    <FiSettings size={18} /> Settings
                </div>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-xl cursor-pointer">
                    <FiHelpCircle size={18} /> Support
                </div>
            </div>
        </div>
    );

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
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">Recommendations</h1>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isPremium ? 'bg-[#EEF2FF] text-[#5352ED]' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {isPremium ? 'Premium Plan' : 'Free Plan'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                                Data-driven strategic suggestions tailored to elevate your content output.
                            </p>
                        </div>

                        {!isPremium ? (
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
                                onClick={connectYouTubeChannel}
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

                    {/* BASIC RECOMMENDATIONS */}
                    <div className="border border-[#E2E8F0] rounded-3xl p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#0F172A]">Content Foundations</h2>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${isPremium
                                    ? 'bg-[#EEF2FF] text-[#5352ED]'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                {isPremium ? 'Included with Premium' : 'Free Tier'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                                <span className="text-xs font-bold text-[#0F172A]">Consistency Blueprint</span>
                                <p className="text-[11px] text-[#64748B] leading-relaxed">
                                    Publishing 1 thorough project walkthrough or lesson per week yields the highest long-term retention.
                                </p>
                            </div>
                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                                <span className="text-xs font-bold text-[#0F172A]">Hook Structure</span>
                                <p className="text-[11px] text-[#64748B] leading-relaxed">
                                    Demonstrate the final working app or outcome within the first 15 seconds before explaining syntax.
                                </p>
                            </div>
                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                                <span className="text-xs font-bold text-[#0F172A]">Khmer Search Optimization</span>
                                <p className="text-[11px] text-[#64748B] leading-relaxed">
                                    Combine English tech terminology with Khmer search descriptors in titles (e.g., C++ សម្រាប់អ្នកចាប់ផ្តើម).
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
                                <h3 className="text-xl font-bold text-[#0F172A]">Unlock Personalized Creator Intelligence</h3>
                                <p className="text-xs text-[#64748B] leading-relaxed">
                                    Connect your YouTube channel to analyze verbatim viewer comments, evaluate your video titles, track audience demographics, and uncover trending topic signals.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsUpgradeModalOpen(true)}
                                    className="px-6 py-3 bg-[#5352ED] hover:bg-[#4342D9] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                                >
                                    <FiZap size={14} /> Upgrade to Premium for $2.99/mo
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {youtubeData && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B] mb-1">
                                            <FiUsers size={14} /> Subscribers
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                                            {Number(youtubeData.subscribers).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B] mb-1">
                                            <FiEye size={14} /> Total Views
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                                            {Number(youtubeData.totalViews).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B] mb-1">
                                            <FiVideo size={14} /> Videos Uploaded
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                                            {Number(youtubeData.videoCount).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">Recent Content</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(youtubeData?.videos || []).slice(0, 3).map((v, i) => (
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
                                                <span>{Number(v.views).toLocaleString()} views</span>
                                                <span>{v.comments} comments</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-white space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[#5352ED]">
                                            <FiMessageSquare size={16} />
                                            <h3 className="font-bold text-sm text-[#0F172A]">Recent Audience Comments</h3>
                                        </div>
                                        <span className="text-[11px] bg-[#EEF2FF] text-[#5352ED] font-bold px-2 py-0.5 rounded-full">
                                            {youtubeData?.recentComments?.length || 0} found
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
                                            No comments on recent uploads yet. Viewer notes will appear here directly.
                                        </div>
                                    )}
                                </div>

                                <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-white space-y-4">
                                    <div className="flex items-center gap-2 text-[#5352ED]">
                                        <FiTarget size={16} />
                                        <h3 className="font-bold text-sm text-[#0F172A]">Audience Demographics & Persona</h3>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                                            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Estimated Age Group</span>
                                            <span className="text-xs font-bold text-[#0F172A]">{youtubeData?.dominantNiche ? '18 - 24 years (Students / Junior Devs)' : '18 - 28 years (General Creators)'}</span>
                                        </div>
                                        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                                            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Viewer Goal / Intent</span>
                                            <span className="text-xs font-medium text-[#334155]">Learning practical coding concepts and examining student project builds.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white space-y-4">
                                <div className="flex items-center gap-2 text-[#0F172A]">
                                    <FiUsers className="text-[#5352ED]" size={18} />
                                    <h3 className="text-sm font-bold">Similar Videos in Your Niche (Inspiration)</h3>
                                </div>
                                <p className="text-xs text-[#64748B]">
                                    Discover ideas and formats from other creators teaching similar topics:
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
                                            <span className="text-[10px] text-[#64748B] block truncate">By {comp.channelTitle}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {youtubeData?.titleAudit && (
                                <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-[#0F172A]">Title Optimization Review</h3>
                                            {youtubeData.titleAudit.detectedFormat && (
                                                <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                                                    Detected: {youtubeData.titleAudit.detectedFormat}
                                                </span>
                                            )}
                                        </div>
                                        {youtubeData.titleAudit.needsOptimization ? (
                                            <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-1 rounded-full">
                                                Showcase Framing Suggested
                                            </span>
                                        ) : (
                                            <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <FiCheck size={12} /> Title Looks Strong
                                            </span>
                                        )}
                                    </div>

                                    {youtubeData.titleAudit.needsOptimization && (
                                        <div className="space-y-3">
                                            <p className="text-xs text-[#64748B]">
                                                Current title: "{youtubeData.titleAudit.currentTitle}"
                                            </p>
                                            <div className="space-y-2">
                                                {youtubeData.titleAudit.recommendations.map((title, idx) => (
                                                    <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                                                        <span className="font-medium text-[#1E293B]">{title}</span>
                                                        <button
                                                            onClick={() => navigate('/ideas')}
                                                            className="text-[#5352ED] font-semibold flex items-center gap-1 hover:underline ml-2 shrink-0 cursor-pointer"
                                                        >
                                                            Use in Ideas <FiArrowRight size={12} />
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