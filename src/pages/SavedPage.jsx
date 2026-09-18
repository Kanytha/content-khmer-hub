import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import { 
  FiGrid, FiStar, FiEdit3, FiCompass, FiUser, 
  FiSettings, FiHelpCircle, FiX, FiMenu, FiArrowLeft,
  FiBookmark, FiFolder, FiPlus, FiTrash2, FiExternalLink,
  FiCalendar, FiMapPin, FiCheckCircle
} from 'react-icons/fi';

export default function SavedPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [folders, setFolders] = useState(['All Items', 'Next Video Ideas', 'Grant Programs', 'Event Inspos']);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    async function loadSavedData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          navigate('/');
          return;
        }

        const localSaved = localStorage.getItem(`ckh_saved_items_${user.id}`);
        if (localSaved) {
          try {
            setSavedItems(JSON.parse(localSaved));
          } catch (e) {}
        } else {
          const defaults = [
            {
              id: 'rec-1',
              title: 'Turn questions into content',
              type: 'recommendation',
              folder: 'Next Video Ideas',
              reason: 'Your recent post sparked several similar questions from your audience. Responding to them now can strengthen engagement.',
              savedAt: 'Sep 10'
            },
            {
              id: 'opp-1',
              title: 'Digital Creator Innovation Fund',
              type: 'opportunity',
              folder: 'Grant Programs',
              organizer: 'Meta & Mekong Tech',
              category: 'Grants',
              deadline: 'October 15, 2026',
              location: 'Phnom Penh / Hybrid',
              savedAt: 'Sep 8'
            },
            {
              id: 'opp-2',
              title: 'Southeast Asia Creator Summit 2026',
              type: 'opportunity',
              folder: 'Event Inspos',
              organizer: 'Creator Lab Global',
              category: 'Events',
              deadline: 'September 28, 2026',
              location: 'Bangkok & Online',
              savedAt: 'Sep 5'
            }
          ];
          setSavedItems(defaults);
          localStorage.setItem(`ckh_saved_items_${user.id}`, JSON.stringify(defaults));
        }

        const localFolders = localStorage.getItem(`ckh_folders_${user.id}`);
        if (localFolders) {
          try {
            setFolders(JSON.parse(localFolders));
          } catch (e) {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadSavedData();
  }, [navigate]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (folders.includes(newFolderName.trim())) return;

    const updated = [...folders, newFolderName.trim()];
    setFolders(updated);
    if (user) {
      localStorage.setItem(`ckh_folders_${user.id}`, JSON.stringify(updated));
    }
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleRemoveSaved = async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    if (user) {
      localStorage.setItem(`ckh_saved_items_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleChangeFolder = async (id, targetFolder) => {
    const { data: { user } } = await supabase.auth.getUser();
    const updated = savedItems.map(item => {
      if (item.id === id) {
        return { ...item, folder: targetFolder };
      }
      return item;
    });
    setSavedItems(updated);
    if (user) {
      localStorage.setItem(`ckh_saved_items_${user.id}`, JSON.stringify(updated));
    }
  };

  const filteredItems = useMemo(() => {
    return savedItems.filter(item => {
      const matchType = 
        activeCategory === 'All' ? true :
        activeCategory === 'Recommendations' ? item.type === 'recommendation' :
        activeCategory === 'Opportunities' ? item.type === 'opportunity' : true;

      const matchFolder = 
        selectedFolder === 'All' || selectedFolder === 'All Items' ? true :
        item.folder === selectedFolder;

      return matchType && matchFolder;
    });
  }, [savedItems, activeCategory, selectedFolder]);

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

        <nav className="space-y-1 text-sm font-semibold text-[#64748B]">
          <div 
            onClick={() => { onClose?.(); navigate('/dashboard'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
          >
            <FiGrid size={18} /> Dashboard
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/recommendations'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
          >
            <FiStar size={18} /> Recommendations
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/ideas'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
          >
            <FiEdit3 size={18} /> Ideas
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/opportunities'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
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

      <div className="space-y-1 text-sm font-semibold text-[#64748B]">
        <div 
          onClick={() => { onClose?.(); navigate('/account'); }}
          className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold"
        >
          <FiSettings size={18} /> Settings
        </div>
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300 font-semibold">
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
                Saved Library
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Organize recommendations, ideas, and opportunities you've bookmarked to revisit later.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['All', 'Recommendations', 'Opportunities'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-[#5352ED] text-white shadow-xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#F8F7FF] border border-[#ECE8FB] rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1E293B]">
                    <FiFolder className="text-[#5352ED]" size={16} />
                    <span>Folders</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingFolder(prev => !prev)}
                    className="text-xs text-[#5352ED] font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <FiPlus size={13} /> New
                  </button>
                </div>

                {isCreatingFolder && (
                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="text" 
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name..."
                      className="text-xs border border-[#5352ED] rounded-xl px-3 py-1.5 w-full text-[#1E293B] focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateFolder}
                      className="px-3 py-1.5 bg-[#5352ED] text-white text-xs font-semibold rounded-xl hover:bg-[#4342D9] transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="space-y-1.5 text-xs">
                  {folders.map(f => {
                    const isSelected = selectedFolder === f || (f === 'All Items' && selectedFolder === 'All');
                    const count = f === 'All Items' 
                      ? savedItems.length 
                      : savedItems.filter(i => i.folder === f).length;

                    return (
                      <div
                        key={f}
                        onClick={() => setSelectedFolder(f === 'All Items' ? 'All' : f)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white text-[#5352ED] font-semibold shadow-2xs border border-[#E2E8F0]'
                            : 'text-[#64748B] hover:bg-white/60 hover:text-[#0F172A]'
                        }`}
                      >
                        <span className="truncate">{f}</span>
                        <span className="text-[11px] bg-[#EEF2FF] text-[#4338CA] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-[#E2E8F0] rounded-2xl p-8 space-y-2 bg-white">
                  <FiBookmark className="mx-auto text-[#CBD5E1]" size={28} />
                  <p className="text-xs font-semibold text-[#64748B]">No saved items in this folder.</p>
                  <p className="text-[11px] text-[#94A3B8]">Save recommendations or opportunities to access them anytime.</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div 
                    key={item.id}
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs hover:border-[#CBD5E1] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'recommendation' 
                              ? 'bg-[#EEF2FF] text-[#5352ED]' 
                              : 'bg-[#FFF7ED] text-[#EA580C]'
                          }`}>
                            {item.type}
                          </span>
                          
                          {item.category && (
                            <span className="text-xs text-[#64748B]">
                              • {item.category}
                            </span>
                          )}

                          {item.organizer && (
                            <span className="text-xs text-[#64748B]">
                              • By {item.organizer}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-semibold text-[#1E293B] tracking-tight">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                        <select
                          value={item.folder || 'Unsorted'}
                          onChange={(e) => handleChangeFolder(item.id, e.target.value)}
                          className="text-[11px] border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-[#475569] bg-white focus:outline-none font-medium cursor-pointer"
                        >
                          {folders.filter(f => f !== 'All Items').map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>

                        <button 
                          type="button"
                          onClick={() => handleRemoveSaved(item.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove from saved"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {item.reason && (
                      <p className="text-xs text-[#475569] leading-relaxed">
                        {item.reason}
                      </p>
                    )}

                    {item.type === 'opportunity' && (
                      <div className="grid grid-cols-2 gap-3 text-xs text-[#64748B] pt-1">
                        <span className="flex items-center gap-1.5"><FiCalendar size={13} /> {item.deadline}</span>
                        <span className="flex items-center gap-1.5"><FiMapPin size={13} /> {item.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <span className="text-[#94A3B8] text-[11px]">Saved on {item.savedAt}</span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (item.type === 'recommendation') {
                            navigate('/recommendations');
                          } else {
                            navigate('/opportunities');
                          }
                        }}
                        className="text-[#5352ED] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Open details <FiExternalLink size={12} />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}