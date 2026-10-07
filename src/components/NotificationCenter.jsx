import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMessageSquare, FiCompass, FiZap } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';

export default function NotificationCenter({ userId, isPremium = false, userNiche = '' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const getReadIdsFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(`ckh_read_notifs_${userId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }, [userId]);

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

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const readSet = getReadIdsFromStorage();

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25);

      let localDynamicNotifs = [];
      try {
        const rawLocal = 
          localStorage.getItem(`ckh_notifications_${userId}`) || 
          localStorage.getItem('ckh_notifications');
        if (rawLocal) {
          localDynamicNotifs = JSON.parse(rawLocal);
        }
      } catch (err) {
        console.warn("Could not parse local notifications:", err);
      }

      let list = [];

      const normalizedLocalNotifs = localDynamicNotifs.map(item => ({
        ...item,
        created_at: item.created_at || item.timestamp || item.date || new Date().toISOString()
      }));

      if (!error && data && data.length > 0) {
        list = [
          ...normalizedLocalNotifs,
          ...data.map(item => ({
            ...item,
            created_at: item.created_at || new Date().toISOString(),
            is_read: item.is_read || readSet.has(item.id)
          }))
        ];
      } else {
        // Starter creation timestamps stored once per user
        const storageKey = `ckh_starter_dates_${userId}`;
        let starterDates = {};
        try {
          starterDates = JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch {
          starterDates = {};
        }

        const now = Date.now();

        if (!starterDates['starter-opp']) {
          starterDates['starter-opp'] = new Date(now).toISOString();
        }
        if (!starterDates['starter-yt']) {
          starterDates['starter-yt'] = new Date(now - 10 * 60 * 1000).toISOString();
        }
        if (!starterDates['starter-welcome']) {
          starterDates['starter-welcome'] = new Date(now - 72 * 60 * 60 * 1000).toISOString();
        }

        localStorage.setItem(storageKey, JSON.stringify(starterDates));

        list = [
          ...normalizedLocalNotifs,
          {
            id: 'starter-opp',
            user_id: userId,
            title: `${userNiche || 'Content'} Opportunity Available`,
            message: 'A new opportunity specifically matches your audience style.',
            type: 'opportunity_match',
            action_link: '/opportunity-details?spotlight=true',
            is_read: readSet.has('starter-opp'),
            created_at: starterDates['starter-opp']
          },
          ...(isPremium ? [{
            id: 'starter-yt',
            user_id: userId,
            title: 'New Audience Intelligence',
            message: 'AI analyzed your latest comments. See viewer sentiment and questions.',
            type: 'youtube_ai',
            action_link: '/recommendations',
            is_read: readSet.has('starter-yt'),
            created_at: starterDates['starter-yt']
          }] : []),
          {
            id: 'starter-welcome',
            user_id: userId,
            title: 'Welcome to Content Khmer Hub',
            message: 'Set up your preferences to receive matched content ideas.',
            type: 'system',
            action_link: '/dashboard',
            is_read: true,
            created_at: starterDates['starter-welcome']
          }
        ];
      }

      list = list.map(item => ({
        ...item,
        is_read: item.is_read || readSet.has(item.id)
      }));

      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(list);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, isPremium, userNiche, getReadIdsFromStorage]);

  useEffect(() => {
    loadNotifications();

    const handleNewNotif = () => loadNotifications();
    window.addEventListener('ckh_new_notification', handleNewNotif);
    window.addEventListener('storage', handleNewNotif);

    return () => {
      window.removeEventListener('ckh_new_notification', handleNewNotif);
      window.removeEventListener('storage', handleNewNotif);
    };
  }, [loadNotifications]);

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

    if (notif.type === 'youtube_ai') {
      if (isPremium) {
        navigate('/recommendations');
      } else {
        navigate('/account');
      }
      return;
    }

    if (notif.action_link) {
      navigate(notif.action_link);
    } else {
      navigate('/dashboard');
    }
  };

  const getDayBucket = (dateString) => {
    if (!dateString) return 'today';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'today';

    const now = new Date();
    const targetMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const diffDays = Math.floor((todayMidnight - targetMidnight) / oneDayMs);

    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return 'earlier';
  };

  const todayNotifs = notifications.filter(n => getDayBucket(n.created_at) === 'today');
  const yesterdayNotifs = notifications.filter(n => getDayBucket(n.created_at) === 'yesterday');
  const earlierNotifs = notifications.filter(n => getDayBucket(n.created_at) === 'earlier');

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

  const renderNotificationItem = (item, badgeLabel) => (
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
          <span className="text-[10px] text-[#94A3B8] shrink-0 font-normal">
            {badgeLabel}
          </span>
        </div>
        <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2">
          {item.message}
        </p>
      </div>
    </div>
  );

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
                    <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-3">
                      Today
                    </p>
                    <div className="space-y-3">
                      {todayNotifs.map((item) => renderNotificationItem(item, 'Recent'))}
                    </div>
                  </div>
                )}

                {yesterdayNotifs.length > 0 && (
                  <div className="p-4 bg-gray-50/50">
                    <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-3">
                      Yesterday
                    </p>
                    <div className="space-y-3">
                      {yesterdayNotifs.map((item) => renderNotificationItem(item, 'Yesterday'))}
                    </div>
                  </div>
                )}

                {earlierNotifs.length > 0 && (
                  <div className="p-4 bg-gray-50/80">
                    <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-3">
                      Earlier
                    </p>
                    <div className="space-y-3">
                        {earlierNotifs.map((item) => {
                          const d = new Date(item.created_at);
                          const formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString() : 'Earlier';
                          return renderNotificationItem(item, formattedDate);
                        })}
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