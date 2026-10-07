import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabaseClient';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

// 1. Gather creator context (Includes past reflections & tier status)
export async function getCreatorContext(userId) {
  const [profileRes, opportunitiesRes, reflectionsRes, recentIdeasRes] =
    await Promise.all([
      supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),

      supabase
        .from('opportunities')
        .select('title, topics, type, deadline, start_date')
        .limit(6),

      supabase
        .from('reflections')
        .select(
          'recommendation_title, expectation_result, future_change, unexpected_notes'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4),

      supabase
        .from('content_ideas')
        .select('title, intended_format, format, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6)
    ]);

  const profile = profileRes.data || {};
  const answers = profile?.onboarding_answers || {};

  const isPremium = Boolean(
    profile?.is_premium || profile?.subscription_status === 'active'
  );

  const recentFormats = (recentIdeasRes.data || [])
    .map(i => i.intended_format || i.format)
    .filter(Boolean);

  return {
    creator: {
      topic:
        profile.focus ||
        answers.topic ||
        'General',

      platform:
        profile.primary_platform ||
        profile.platform ||
        answers.primaryPlatform ||
        answers.platform ||
        'Unknown',

      audience:
        profile.target_audience ||
        answers.targetAudience ||
        'Cambodian youth & students',

      goals:
        profile.goal ||
        answers.primaryGoals?.[0] ||
        'Grow My Audience',

      style:
        answers.personalityStyle ||
        'Engaging & Authentic',

      isPremium
    },

    pastReflections: reflectionsRes.data || [],
    recentIdeas: recentIdeasRes.data || [],
    recentFormatsUsed: recentFormats,

    currentContext: {
      focus:
        profile.focus ||
        answers.topic ||
        'General',

      currentDate: new Date().toISOString(),

      recentActivity: recentIdeasRes.data || [],

      recentReflections: reflectionsRes.data || [],

      opportunities: opportunitiesRes.data || []
    },

    opportunities: opportunitiesRes.data || []
  };
}

// 2. Evaluate a Single Idea
export async function evaluateSingleIdea(idea, context) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `
You are the AI advisor for Content Khmer Hub (CKH). Evaluate this creator's idea based on their context.

CREATOR CONTEXT:
- Main Topic: ${context.creator.topic}
- Platform: ${context.creator.platform}
- Target Audience: ${context.creator.audience}
- Primary Goal: ${context.creator.goals}
- Content Style: ${context.creator.style}
- Is Premium Subscriber: ${context.creator.isPremium}

RECENT REFLECTIONS / LEARNINGS:
${JSON.stringify(context.pastReflections)}

ACTIVE OPPORTUNITIES:
${JSON.stringify((context.opportunities || []).map(o => o.title))}

IDEA:
- Title: "${idea.title}"
- Description: "${idea.description}"
- Intended Format: "${idea.intended_format || 'Not sure yet'}"
- Unsure/Concern: "${idea.concern || 'None'}"

CRITICAL BREVITY RULES:
- STRICT RULE: NEVER USE EMOJIS. Do not include any emoji, symbols, or emoticons anywhere in your response.
- Keep every sentence punchy and under 15 words.
- Provide practical creator coaching.

Return valid JSON with this exact schema:
{
  "alignment_badge": "Strong Alignment" | "Good Alignment" | "Possible Alignment",
  "goal_alignment": "Strong" | "Good" | "Moderate" | "Limited",
  "audience_fit": "Strong" | "Good" | "Moderate" | "Limited",
  "current_direction": "Very High" | "Moderate" | "Low",
  "recent_experience": "Max 8 words on past track record.",
  "timing_context": "Max 8 words on why timely right now.",
  "format_suggested": "Short Video" | "Carousel" | "Long Video" | "Photo Post",
  "one_thing_to_consider": "1 concise sentence (under 12 words) pointing out a single challenge or suggestion."
}
`;

  const result = await model.generateContent(prompt);
  const evaluation = JSON.parse(result.response.text());

  const finalFormat = (idea.intended_format && idea.intended_format !== 'Not sure yet')
    ? idea.intended_format
    : (evaluation.format_suggested || 'Short Video');

  const { data, error } = await supabase
    .from('idea_evaluations')
    .upsert({
      idea_id: idea.id,
      user_id: idea.user_id,
      alignment_badge: evaluation.alignment_badge,
      goal_alignment: evaluation.goal_alignment,
      audience_fit: evaluation.audience_fit,
      current_direction: evaluation.current_direction,
      recent_experience: evaluation.recent_experience,
      timing_context: evaluation.timing_context,
      format_suggested: finalFormat,
      one_thing_to_consider: evaluation.one_thing_to_consider,
      full_evaluation_json: { ...evaluation, format_suggested: finalFormat }
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 3. Compare Multiple Ideas AND Generate Tailored Improvements
export async function compareIdeas(ideasWithEvals, context) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `
You are the lead content growth consultant for Content Khmer Hub (CKH).
Compare these evaluated ideas, pick the standout winner, AND provide tailored platform-specific improvements for each idea.

CRITICAL FORMATTING RULE:
- NEVER USE EMOJIS. Absolutely zero emojis, icons, or pictorial symbols anywhere in hooks, titles, upgrades, or notes. Use clean plain text only.

CREATOR IDENTITY:
- Primary Platform: ${context.creator.platform} (CRITICAL: All hook, format, and pacing recommendations MUST follow native best practices for ${context.creator.platform})
- Main Niche: ${context.creator.topic}
- Target Audience: ${context.creator.audience}
- Primary Goal: ${context.creator.goals}
- Recent Formats Published: ${JSON.stringify(context.recentFormatsUsed)}
- Is Premium Creator: ${context.creator.isPremium}

PAST REFLECTIONS & LEARNINGS:
${JSON.stringify(context.pastReflections)}

ACTIVE TRENDS & OPPORTUNITIES:
${JSON.stringify((context.opportunities || []).map(o => o.title))}

IDEAS TO COMPARE:
${JSON.stringify(ideasWithEvals.map(item => ({
  id: item.idea.id,
  title: item.idea.title,
  description: item.idea.description,
  intended_format: item.idea.intended_format,
  opening_hook: item.idea.opening_hook || 'Not specified',
  target_action: item.idea.target_action || 'Not specified',
  concern: item.idea.concern,
  eval: item.eval
})))}

STRATEGY GUIDELINES FOR CKH:
1. PLATFORM-NATIVE TACTICS:
   - TikTok / Reels: Optimize for 2-second visual/verbal hooks, high-speed delivery, sound/trend resonance.
   - YouTube (Long form): Focus on clickable packaging (title/thumbnail angle) and mid-video retention payoff.
   - Instagram Carousel: Focus on saveable slide checklists or visual swipe cues.
   - Facebook: Focus on relatable storytelling that sparks community discussion in the comments.

2. FORMAT DIVERSITY & FATIGUE DETECTION:
   - Check "Recent Formats Published". If the creator has done multiple long-form videos recently, suggest testing a Short video or Carousel post to diversify reach and prevent creator burnout.

Return valid JSON with this exact structure:
{
  "strongest_fit_id": "the idea id of the top recommendation",
  "standout_title": "Title of the winning idea",
  "standout_reason": "2 sentences explaining why this specific idea fits their current platform and goals best.",
  "relevant_context_note": "A short note on why this timing matters right now.",
  "improvements": [
    {
      "idea_id": "matching idea id",
      "idea_title": "Idea title",
      "suggested_hook": "Platform-native opening hook tailored for ${context.creator.platform} (first 3 seconds or headline). Plain text only, NO EMOJIS.",
      "recommended_format_tweak": "Suggested format pivot if fatigue is detected (e.g. 'Pivot to 45s Short' or 'Keep as Carousel'). Plain text only.",
      "actionable_upgrade": "Concrete advice on what to cut, add, or change in structure. Plain text only, NO EMOJIS.",
      "why_it_works": "Why this specific strategy succeeds on ${context.creator.platform} with their audience. Plain text only, NO EMOJIS."
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  const cleanText = (str) =>
    typeof str === 'string'
      ? str.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim()
      : str;

  if (parsed.improvements && Array.isArray(parsed.improvements)) {
    parsed.improvements = parsed.improvements.map(item => ({
      ...item,
      suggested_hook: cleanText(item.suggested_hook),
      recommended_format_tweak: cleanText(item.recommended_format_tweak),
      actionable_upgrade: cleanText(item.actionable_upgrade),
      why_it_works: cleanText(item.why_it_works)
    }));
  }

  if (parsed.standout_reason) parsed.standout_reason = cleanText(parsed.standout_reason);
  if (parsed.relevant_context_note) parsed.relevant_context_note = cleanText(parsed.relevant_context_note);

  return parsed;
}