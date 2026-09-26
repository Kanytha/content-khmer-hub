import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMessageSquare, FiCompass, FiZap } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';

export default function NotificationCenter({ userId, isPremium = false, userNiche = '' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const getReadIdsFromStorage = () => {
    try {
      const stored = localStorage.getItem(`ckh_read_notifs_${userId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };

  const saveReadIdToStorage = (id) => {
    try {
      const readSet = getReadIdsFromStorage();
      readSet.add(id);
      localStorage.setItem(`ckh_read_notifs_${userId}`, JSON.stringify(Array.from(readSet)));
    } catch (e) {
      console.error(e);
    }
  };

  const saveAllReadIdsToStorage = (ids) => {
    try {
      const readSet = getReadIdsFromStorage();
      ids.forEach(id => readSet.add(id));
      localStorage.setItem(`ckh_read_notifs_${userId}`, JSON.stringify(Array.from(readSet)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!userId) return;

    async function loadNotifications() {
      setLoading(true);
      try {
        const readSet = getReadIdsFromStorage();

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(15);

        if (!error && data && data.length > 0) {
          const merged = data.map(item => ({
            ...item,
            is_read: item.is_read || readSet.has(item.id)
          }));
          setNotifications(merged);
        } else {
          const starters = [
            {
              id: 'starter-1',
              user_id: userId,
              title: 'Reflection follow-up',
              message: 'Tell us how your recent content experience went.',
              type: 'reflection',
              action_link: '/reflection',
              is_read: readSet.has('starter-1'),
              created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
            },
            ...(isPremium ? [{
              id: 'starter-yt',
              user_id: userId,
              title: 'New Audience Intelligence',
              message: 'AI analyzed your latest comments. See viewer sentiment and questions.',
              type: 'youtube_ai',
              action_link: '/dashboard',
              is_read: readSet.has('starter-yt'),
              created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
            }] : []),
            {
              id: 'starter-opp',
              user_id: userId,
              title: `${userNiche || 'Content'} Opportunity Available`,
              message: 'A new opportunity specifically matches your audience style.',
              type: 'opportunity_match',
              action_link: '/opportunities',
              is_read: true,
              created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
            }
          ];
          setNotifications(starters);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [userId, isPremium, userNiche]);

  const hasUnread = notifications.some(n => !n.is_read);

  const handleMarkAllRead = async () => {
    const allIds = notifications.map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    saveAllReadIdsToStorage(allIds);

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      saveReadIdToStorage(notif.id);

      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notif.id);
      } catch (e) {
        console.error(e);
      }
    }
    setIsOpen(false);
    if (notif.action_link) {
      navigate(notif.action_link);
    }
  };

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };

  const todayNotifs = notifications.filter(n => isToday(n.created_at));
  const olderNotifs = notifications.filter(n => !isToday(n.created_at));

  const renderIcon = (type) => {
    switch (type) {
      case 'youtube_ai':
        return <FiZap className="text-[#5352ED]" size={16} />;
      case 'opportunity_match':
        return <FiCompass className="text-[#5352ED]" size={16} />;
      default:
        return <FiMessageSquare className="text-[#5352ED]" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-[#EEF2FF] text-[#5352ED] hover:bg-[#E0E7FF] transition-all cursor-pointer"
        aria-label="View notifications"
      >
        <FiBell size={18} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#5352ED] rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <div className="fixed right-4 sm:absolute sm:right-0 mt-3 sm:mt-2 w-[calc(100vw-32px)] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden animate-page-enter">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#F1F5F9]">
            <h3 className="font-semibold text-base text-[#0F172A]">Notifications</h3>
            {hasUnread && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[#64748B] hover:text-[#5352ED] font-medium transition-colors cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 text-xs">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8]">
                No new notifications right now.
              </div>
            ) : (
              <>
                {todayNotifs.length > 0 && (
                  <div className="p-4">
                    <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-3">Today</p>
                    <div className="space-y-3">
                      {todayNotifs.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className="flex items-start gap-3 p-2 rounded-2xl hover:bg-[#F8FAFC] transition-colors cursor-pointer group relative"
                        >
                          {!item.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#5352ED] absolute left-0 top-3.5" />
                          )}
                          <div className="w-9 h-9 rounded-xl bg-[#F5F2FF] flex items-center justify-center shrink-0 ml-2">
                            {renderIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4 className={`text-xs truncate ${!item.is_read ? 'font-semibold text-[#0F172A]' : 'font-medium text-[#475569]'}`}>
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-[#94A3B8] shrink-0">Recent</span>
                            </div>
                            <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {olderNotifs.length > 0 && (
                  <div className="p-4 bg-gray-50/50">
                    <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-3">Yesterday</p>
                    <div className="space-y-3">
                      {olderNotifs.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className="flex items-start gap-3 p-2 rounded-2xl hover:bg-white transition-colors cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#64748B] flex items-center justify-center shrink-0">
                            {renderIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4 className="text-xs font-medium text-[#475569] truncate">
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-[#94A3B8] shrink-0">Yesterday</span>
                            </div>
                            <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}