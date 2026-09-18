import { supabase } from './supabaseClient';

export async function connectYouTubeChannel() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please log in first.');

  localStorage.removeItem(`ckh_yt_disconnected_${user.id}`);
  localStorage.setItem('ckh_connecting_uid', user.id);

  try {
    // Attempt linkIdentity first
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        },
        redirectTo: `${window.location.origin}/recommendations`
      }
    });

    if (error) throw error;
    return data;
  } catch (err) {
    // If manual linking is turned off in Supabase, fall back to OAuth with same redirect
    console.warn('Manual link fallback, launching OAuth:', err.message);
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        },
        redirectTo: `${window.location.origin}/recommendations`
      }
    });

    if (oauthError) throw oauthError;
    return data;
  }
}

export async function disconnectYouTubeChannel() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  localStorage.setItem(`ckh_yt_disconnected_${user.id}`, 'true');
  localStorage.removeItem(`ckh_yt_token_${user.id}`);
  localStorage.removeItem('ckh_yt_token');

  await supabase
    .from('creator_youtube_connections')
    .update({ is_active: false, access_token: null, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);
}

export async function getValidYouTubeToken() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (localStorage.getItem(`ckh_yt_disconnected_${user.id}`) === 'true') {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.provider_token) {
    localStorage.setItem(`ckh_yt_token_${user.id}`, session.provider_token);
    return session.provider_token;
  }
  
  return localStorage.getItem(`ckh_yt_token_${user.id}`) || null;
}

export async function fetchChannelIntelligence(accessToken) {
  if (!accessToken) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!channelRes.ok) return null;
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];
    if (!channel) return null;

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=15`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const playlistData = await playlistRes.json();
    const videoItems = playlistData.items || [];
    const videoIds = videoItems.map(i => i.snippet?.resourceId?.videoId).filter(Boolean).join(',');

    let videoStats = [];
    if (videoIds) {
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        videoStats = statsData.items || [];
      }
    }

    // 3. Fetch verbatim viewer comments safely
    let rawComments = [];
    for (const vid of videoStats.slice(0, 6)) {
      if (Number(vid.statistics?.commentCount || 0) > 0) {
        try {
          const commentsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${vid.id}&maxResults=8&order=relevance`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (commentsRes.ok) {
            const commentsJson = await commentsRes.json();
            if (commentsJson.items) {
              commentsJson.items.forEach(c => {
                const item = c.snippet?.topLevelComment?.snippet;
                if (item) {
                  rawComments.push({
                    author: item.authorDisplayName,
                    avatar: item.authorProfileImageUrl,
                    text: item.textDisplay,
                    publishedAt: item.publishedAt,
                    videoTitle: vid.snippet.title
                  });
                }
              });
            }
          }
        } catch {}
      }
    }

    const allTitles = videoStats.map(v => v.snippet?.title || '');
    const channelCoreProfile = analyzeChannelProfile(allTitles, channel.snippet.description || '');

    let inspirationVideos = [];
    let trendingKeywords = [];

    try {
      const coreSearchQuery = channelCoreProfile.primarySearchQuery;
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(coreSearchQuery)}&type=video&maxResults=6`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        inspirationVideos = (searchData.items || [])
          .filter(item => item.snippet.channelTitle !== channel.snippet.title)
          .slice(0, 4)
          .map(item => ({
            channelTitle: item.snippet.channelTitle,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url,
            videoId: item.id?.videoId || item.snippet?.resourceId?.videoId
          }));

        const tagsFound = searchData.items?.flatMap(item => 
          item.snippet.title.split(/[\s|,\-–—:!?()]+/g)
        ).filter(w => w.length > 2 && !['Tutorial', 'Video', 'How', 'The', 'Full', 'Demo'].includes(w)) || [];

        trendingKeywords = Array.from(new Set([
          ...channelCoreProfile.coreKeywords,
          ...tagsFound.slice(0, 4)
        ])).slice(0, 6);
      }
    } catch {
      trendingKeywords = channelCoreProfile.coreKeywords;
    }

    const audienceProfile = await synthesizeAudienceAndPersona({
      channelName: channel.snippet.title,
      allTitles,
      comments: rawComments,
      dominantNiche: channelCoreProfile.dominantNiche
    });

    const titleAudit = await auditTitles(videoStats, channelCoreProfile);

    const assembledIntelligence = {
      channelTitle: channel.snippet.title,
      subscribers: channel.statistics.subscriberCount,
      totalViews: channel.statistics.viewCount,
      videoCount: channel.statistics.videoCount,
      dominantNiche: channelCoreProfile.dominantNiche,
      videos: videoStats.map(v => ({
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        views: v.statistics.viewCount,
        likes: v.statistics.likeCount || 0,
        comments: v.statistics.commentCount || 0
      })),
      recentComments: rawComments,
      inspirationVideos,
      trendingKeywords,
      audienceProfile,
      titleAudit
    };

    if (user) {
      await supabase
        .from('creator_youtube_connections')
        .upsert({
          user_id: user.id,
          channel_id: channel.id,
          channel_title: channel.snippet.title,
          access_token: accessToken,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }

    return assembledIntelligence;
  } catch (err) {
    console.error('Error fetching channel intelligence:', err);
    return null;
  }
}

function analyzeChannelProfile(titles = [], channelDesc = '') {
  if (!titles.length) {
    return {
      dominantNiche: 'Digital Content Creation',
      primarySearchQuery: 'Khmer content creator tutorial',
      coreKeywords: ['Creator Tips', 'Video Production', 'Khmer Audience']
    };
  }

  const text = (titles.join(' ') + ' ' + channelDesc).toLowerCase();

  const categories = [
    {
      name: 'Computer Science & Programming Education',
      query: 'Khmer programming tutorial code',
      keywords: ['Coding Logic', 'Programming Tutorial', 'Software Development'],
      matches: ['c++', 'python', 'javascript', 'code', 'coding', 'program', 'loop', 'dev', 'html', 'css', 'react', 'algorithm', 'syntax']
    },
    {
      name: 'UI/UX & Web Development Projects',
      query: 'Web design development tutorial Khmer',
      keywords: ['Web Design', 'Frontend Build', 'UI Animation'],
      matches: ['web', 'website', 'design', 'ui', 'ux', 'animation', 'frontend', 'wiboard', 'responsive', 'figma']
    },
    {
      name: 'Technology & Digital Tools',
      query: 'Technology review digital tools Khmer',
      keywords: ['Tech Review', 'Software Tools', 'Digital Workflow'],
      matches: ['tech', 'app', 'ai', 'tool', 'pc', 'hardware', 'software', 'mobile', 'setup', 'update']
    },
    {
      name: 'Education & Academic Lessons',
      query: 'Education study tutorial Khmer',
      keywords: ['Student Guide', 'Learning Tips', 'Lesson Walkthrough'],
      matches: ['learn', 'study', 'education', 'course', 'lesson', 'class', 'student', 'how to', 'guide', 'tips']
    },
    {
      name: 'Gaming & Entertainment',
      query: 'Gaming walkthrough gameplay Khmer',
      keywords: ['Gameplay', 'Game Highlights', 'Gaming Strategy'],
      matches: ['game', 'gaming', 'play', 'walkthrough', 'highlight', 'stream', 'funny', 'challenge']
    }
  ];

  let bestCategory = categories[0];
  let highestScore = -1;

  for (const cat of categories) {
    let score = 0;
    for (const word of cat.matches) {
      const occurrences = text.split(word).length - 1;
      score += occurrences;
    }
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  if (highestScore <= 0) {
    const stopWords = ['the', 'and', 'with', 'for', 'from', 'this', 'that', 'your', 'part', 'demo', 'video'];
    const words = text
      .replace(/[^a-zA-Z0-9\u1780-\u17FF\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.includes(w));

    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const topWords = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 3);

    return {
      dominantNiche: topWords.length ? `${topWords.join(' & ')} Creation` : 'Creative Video Content',
      primarySearchQuery: topWords.join(' ') || 'Content creator tutorial Khmer',
      coreKeywords: topWords.length ? topWords : ['Content Strategy', 'Video Creation']
    };
  }

  return {
    dominantNiche: bestCategory.name,
    primarySearchQuery: bestCategory.query,
    coreKeywords: bestCategory.keywords
  };
}

async function auditTitles(videos = [], channelCoreProfile) {
  if (!videos.length) return null;
  const latestVideo = videos[0];
  const title = latestVideo?.snippet?.title || '';
  const description = latestVideo?.snippet?.description || '';

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIzaSy')) {
    const prompt = `
You are an expert YouTube strategist.
Creator's overall channel niche: ${channelCoreProfile?.dominantNiche || 'Content Creation'}
Latest Video Title: "${title}"
Video Description: "${description.slice(0, 300)}"

Instructions:
1. Understand the true nature of this video. If it's a project presentation or demo, suggest showcase titles.
2. If it's an educational lesson, suggest educational improvement titles.
3. Suggest titles in Khmer and English relevant to this specific video topic.

Return JSON strictly:
{
  "detectedFormat": "e.g., Project Showcase, Educational Lesson, or Vlog",
  "needsOptimization": true,
  "reason": "Brief reason explaining why this adjustment helps",
  "recommendations": ["Title 1", "Title 2", "Title 3"]
}
`;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
        return {
          currentTitle: title,
          detectedFormat: parsed.detectedFormat || 'Standard Upload',
          needsOptimization: Boolean(parsed.needsOptimization),
          reason: parsed.reason || '',
          recommendations: parsed.recommendations || []
        };
      }
    } catch {}
  }

  const isShowcase = title.toLowerCase().includes('demo') || title.toLowerCase().includes('project') || title.toLowerCase().includes('showcase');
  const cleanTitle = title.replace(/demo|project/gi, '').trim() || title;

  if (isShowcase || title.length < 25) {
    return {
      needsOptimization: true,
      currentTitle: title,
      detectedFormat: isShowcase ? 'Project Showcase & Demo' : 'Topic Walkthrough',
      recommendations: [
        `បង្ហាញគម្រោង: ${cleanTitle} (Walkthrough)`,
        `Full Overview: ${cleanTitle} Explained`,
        `របៀបដែលខ្ញុំបង្កើត ${cleanTitle}`
      ],
      reason: 'Framing your video as a clear walkthrough helps viewers immediately understand what they will learn.'
    };
  }

  return {
    needsOptimization: false,
    currentTitle: title,
    detectedFormat: 'Educational Lesson',
    reason: 'Title contains clear keywords and context for viewers.'
  };
}

async function synthesizeAudienceAndPersona({ channelName, allTitles, comments, dominantNiche }) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIzaSy')) {
    const prompt = `
Channel: "${channelName}"
Dominant Niche: "${dominantNiche}"
Recent Titles: ${JSON.stringify(allTitles)}
Comments: ${JSON.stringify(comments.map(c => c.text))}

Determine:
1. Likely Audience Demographic/Age group for this content
2. Viewer Intent (why they watch)
3. Key signals from comments or viewer needs
4. One practical advice sentence for creator

Return JSON strictly:
{
  "ageSegment": "e.g., 18 - 24 years (Students / Junior Creators)",
  "audienceIntent": "Brief sentence describing why they watch",
  "signals": ["signal 1", "signal 2"],
  "creatorTip": "Friendly, encouraging advice sentence"
}
`;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      }
    } catch {}
  }

  const hasComments = comments.length > 0;
  return {
    ageSegment: dominantNiche.includes('Programming') || dominantNiche.includes('Education')
      ? '18 - 24 years (Students & Early Learners)'
      : '18 - 34 years (General Audience)',
    audienceIntent: `Looking for clear, practical examples and guidance in ${dominantNiche}.`,
    signals: hasComments
      ? comments.slice(0, 3).map(c => `Viewer note: "${c.text}"`)
      : ['Audience engages well with visual demonstrations', 'Clear Khmer language explanations drive retention'],
    creatorTip: 'Keep publishing practical, step-by-step walkthroughs tailored to your core niche.'
  };
}