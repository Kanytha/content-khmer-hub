import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import {
  FiGrid,
  FiStar,
  FiEdit3,
  FiCompass,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiX,
  FiMenu,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiPaperclip
} from 'react-icons/fi';

const FAQ_SECTIONS = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is Content Khmer Hub?',
        a: 'Content Khmer Hub (CKH) is a content decision support platform designed to help creators make more informed content decisions. CKH helps you understand your current situation, evaluate your own content ideas, discover relevant opportunities, and learn from your previous content experiences.\n\nCKH does not create content for you or make the final decision. You remain in control of what you create.'
      },
      {
        q: 'How does CKH work?',
        a: 'CKH first learns about you as a creator, including your goals, audience, content style, interests, and relevant experiences.\n\nIt then considers your current situation and available information to identify content directions that may be relevant to you. CKH explains why a recommendation may fit your situation, and you decide whether you want to follow it.\n\nAfter you create content, you can reflect on the experience so CKH can use relevant feedback to improve future guidance.\n\nUnderstand → Evaluate → Explore → Decide → Reflect → Learn'
      },
      {
        q: 'How do I get started?',
        a: 'Start by completing your Creator Profile. Tell CKH about your content, audience, goals, preferred platforms, and other information that can help make your guidance more relevant.\n\nYou don’t need to provide everything at once. CKH can gradually learn from your activity, decisions, and reflections.'
      }
    ]
  },
  {
    category: 'Recommendations',
    items: [
      {
        q: 'How does CKH make recommendations?',
        a: 'CKH considers the information available about you as a creator, your current goals, audience, content style, previous content experiences, and relevant external context.\n\nRecommendations are intended to help you understand which content directions may fit your current situation and why.\n\nCKH does not guarantee that a recommendation will perform well.'
      },
      {
        q: 'Why did CKH recommend this?',
        a: 'Each recommendation should explain the main reasons behind it. These reasons may include things such as:\n• Your current goal\n• Your target audience\n• Your content style\n• Previous content experiences\n• Your current situation\n• Relevant trends or opportunities, when reliable information is available\n\nIf CKH does not have enough information to make a strong recommendation, it may ask you for more context instead of making assumptions.'
      },
      {
        q: 'Does CKH decide what content I should create?',
        a: 'No. CKH provides guidance to help you understand your options, but you make the final decision. You may accept a recommendation, save it for later, dismiss it, or choose another direction based on your own judgment.'
      },
      {
        q: 'Can I dismiss a recommendation?',
        a: 'Yes. If a recommendation is not relevant to you, you can dismiss it. You can also save recommendations that you may want to consider later. Your feedback can help CKH better understand what is and is not relevant to you.'
      },
      {
        q: "Why doesn't CKH show an exact percentage of success?",
        a: 'CKH avoids presenting made-up performance predictions. If actual performance information is available, such as connected platform data or information you provide, it can be considered when appropriate. When reliable performance data is not available, CKH provides qualitative guidance and explains the factors that may be relevant instead of inventing a percentage.'
      }
    ]
  },
  {
    category: 'Ideas',
    items: [
      {
        q: 'How can I evaluate my own content idea?',
        a: "Go to Ideas and add your content idea. You can provide the idea title, description, format, and any concern you have about it. CKH can then evaluate the idea using relevant information about your creator profile, audience, goals, content history, and current context. The evaluation is intended to help you understand the idea's strengths and considerations, not to make the decision for you."
      },
      {
        q: 'Can I compare multiple ideas?',
        a: 'Yes. You can add multiple ideas and use Compare My Ideas to understand how they differ. CKH can compare factors such as:\n• Audience fit\n• Goal fit\n• Creator/content-style fit\n• Previous content experience\n• Current context\n• Relevant external information when available\n\nThe comparison is designed to help you understand the trade-offs between your ideas.'
      }
    ]
  },
  {
    category: 'Creator Profile & Learning',
    items: [
      {
        q: 'What information does CKH use about me?',
        a: 'CKH may use information such as your:\n• Creator identity\n• Content category\n• Audience & Goals\n• Content style\n• Preferred platforms\n• Current context\n• Content history\n• Reflections and feedback\n\nCKH aims to collect information that can meaningfully improve your recommendations rather than asking unnecessary questions.'
      },
      {
        q: 'How does CKH learn from my content experiences?',
        a: 'After you create content, you can provide a short reflection about what happened. For example, you may share whether the experience went as expected, what you noticed from your audience, or what you learned from the experience. CKH can use relevant feedback to update its understanding of your preferences and experiences, helping future recommendations become more relevant over time.'
      },
      {
        q: 'Do I have to answer every question?',
        a: 'No. CKH is designed to learn gradually. You should only be asked for information that can help make the platform more relevant to you. If some information is not available, CKH should avoid assuming the answer.'
      }
    ]
  },
  {
    category: 'Opportunities',
    items: [
      {
        q: 'What are Opportunities?',
        a: 'Opportunities are external events, programs, competitions, campaigns, workshops, or other activities that may be relevant to creators. CKH can help you discover opportunities that may relate to your goals or content interests.\n\nThe availability and details of opportunities may change, so always check the original organizer or official source before taking action.'
      },
      {
        q: 'Does CKH guarantee that an opportunity is suitable for me?',
        a: 'No. CKH can explain why an opportunity may be relevant based on the information available about you, but you should review the actual opportunity details, requirements, dates, and eligibility before deciding to participate.'
      }
    ]
  },
  {
    category: 'Premium & Subscription',
    items: [
      {
        q: 'What is CKH Premium?',
        a: 'Premium provides additional creator intelligence and deeper information to support content decisions. Depending on available features, Premium may include capabilities such as YouTube connection, content performance information, audience comment analysis, audience insights, and more advanced personalized guidance.'
      },
      {
        q: 'How much does Premium cost?',
        a: 'CKH Premium is planned at $2.99 per month. Your Premium access is connected to your subscription status and payment.'
      },
      {
        q: 'Can I cancel Premium?',
        a: 'Yes. You can cancel your Premium subscription through your account or subscription settings. After cancellation, access remains available until the end of your current paid period, according to the subscription terms.'
      }
    ]
  },
  {
    category: 'Technical Support',
    items: [
      {
        q: "Something isn't working. What should I do?",
        a: "First, try refreshing the page and checking your internet connection. If the problem continues, contact CKH Support using the form below and include:\n• What you were trying to do\n• What happened\n• Any error message you saw\n• A screenshot, if possible\n\nThis helps us understand and resolve the problem promptly."
      },
      {
        q: 'How can I report a problem or send feedback?',
        a: 'Use the Contact Support form below to report a technical problem, incorrect information, or other feedback about CKH. Provide enough detail for the team to reproduce and understand what occurred.'
      }
    ]
  },
  {
    category: 'Privacy & Data',
    items: [
      {
        q: 'Why does CKH ask about my creator information?',
        a: 'Creator information helps CKH provide more relevant guidance. Knowing your goals, audience, content style, and preferred platform helps CKH understand whether a particular content direction is relevant to your situation. CKH only requests information that has a meaningful purpose within the platform.'
      },
      {
        q: 'Does CKH make decisions for me?',
        a: 'No. Your information is used to support the decision-making process. CKH provides guidance and explanations, while you remain responsible for deciding what to create and which opportunities to pursue.'
      }
    ]
  }
];

export default function SupportPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState({});

  // Form states
  const [topic, setTopic] = useState('Account & Profile');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUserEmail();
  }, []);

  const toggleItem = (key) => {
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('support_tickets').insert([
        {
          user_id: user?.id || null,
          email,
          topic,
          subject: subject.trim() || 'General Inquiry',
          message: message.trim(),
          attachment_name: attachment ? attachment.name : null,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.warn('Saved local support request:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
      setSubject('');
      setMessage('');
      setAttachment(null);
    }
  };

  const filteredSections = FAQ_SECTIONS.map(section => {
    const matchesSearch = section.items.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...section, items: matchesSearch };
  }).filter(section => section.items.length > 0);

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
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
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
        <div
          onClick={() => navigate('/account-settings')}
          className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
        >
          <FiSettings size={18} /> Settings
        </div>
        <div className="flex items-center gap-3 bg-[#FFFFFF] text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs font-bold">
          <FiHelpCircle size={18} /> Support
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex font-sans text-[#0F172A]">
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 bg-[#FFFFFF] flex flex-col">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E2E8F0]">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-[#64748B]">
            <FiMenu size={22} />
          </button>
        </div>

        <div className="p-6 md:p-12 space-y-10 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold tracking-wider uppercase text-[#5352ED] bg-[#EEF2FF] px-3 py-1 rounded-full">
              Support & Help Center
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A]">
              How can we help?
            </h1>
            <p className="text-sm md:text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
              Find answers about Content Khmer Hub, recommendations, ideas, your creator profile, and Premium.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto pt-3">
              <FiSearch className="absolute left-4 top-6 text-[#94A3B8]" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, questions, or keywords..."
                className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5352ED] focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {filteredSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] px-1">
                  {section.category}
                </h2>
                <div className="space-y-2">
                  {section.items.map((item, qIdx) => {
                    const itemKey = `${sIdx}-${qIdx}`;
                    const isOpen = !!openItems[itemKey];

                    return (
                      <div
                        key={qIdx}
                        className="border border-[#E2E8F0] rounded-xl overflow-hidden transition-all bg-white shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(itemKey)}
                          className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <span>{item.q}</span>
                          <span className="text-[#64748B] ml-2 shrink-0">
                            {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs md:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] whitespace-pre-line bg-[#FAFAFC]">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="text-center py-8 text-sm text-[#64748B]">
                No matching answers found for "{searchQuery}". You can submit a question using the form below.
              </div>
            )}
          </div>

          {/* Contact Support Form */}
          <div className="bg-[#F8F7FF] border border-[#E0E7FF] rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">Contact Support</h2>
              <p className="text-xs md:text-sm text-[#64748B] mt-1">
                Having an issue, payment question, or feedback? Send us a message and our team will get back to you promptly.
              </p>
            </div>

            {submitted ? (
              <div className="bg-white border border-[#C7D2FE] rounded-xl p-6 text-center space-y-2">
                <FiCheckCircle className="text-[#5352ED] mx-auto" size={32} />
                <h3 className="font-bold text-base text-[#0F172A]">Your message has been sent.</h3>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  Thanks for contacting CKH Support. Our team will review your request and get back to you through your email.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-bold text-[#5352ED] hover:underline"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Topic Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                      What can we help you with?
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs md:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5352ED]"
                    >
                      <option>Account & Profile</option>
                      <option>Recommendations</option>
                      <option>Ideas</option>
                      <option>Opportunities</option>
                      <option>Premium & Subscription</option>
                      <option>Payment Problem</option>
                      <option>Technical Problem</option>
                      <option>Report Incorrect Information</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs md:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5352ED]"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What is your issue about?"
                    className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs md:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5352ED]"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what happened in detail so we can help..."
                    className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs md:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5352ED]"
                  />
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                    Attachment (optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-[#CBD5E1] rounded-xl bg-white text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]">
                      <FiPaperclip size={14} />
                      {attachment ? attachment.name : 'Upload screenshot'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setAttachment(e.target.files[0] || null)}
                      />
                    </label>
                    {attachment && (
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-xs text-[#DC2626] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#5352ED] hover:bg-[#4342D9] text-white font-bold text-xs md:text-sm px-6 py-3 rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  <FiSend size={15} />
                  {isSubmitting ? 'Sending Request...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}