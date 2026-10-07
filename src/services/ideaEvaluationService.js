import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabaseClient';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

// 1. Gather creator context (Includes past reflections & tier status)
export async function getCreatorContext(userId) {
  const [profileRes, opportunitiesRes, reflectionsRes] = await Promise.all([
    supabase.from('creator_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('opportunities').select('title, topics, type, deadline, start_date').limit(6),
    supabase.from('reflections').select('recommendation_title, expectation_result, future_change, unexpected_notes').eq('user_id', userId).order('created_at', { ascending: false }).limit(3)
  ]);

  const profile = profileRes.data || {};
  const answers = profile?.onboarding_answers || {};
  const isPremium = Boolean(profile?.is_premium || profile?.subscription_status === 'active');

  return {
    creator: {
      topic: answers.topic || profile.focus || 'General',
      platform: answers.primaryPlatform || profile.platform || 'TikTok / Facebook',
      audience: answers.targetAudience || 'Cambodian youth & students',
      goals: answers.primaryGoals?.[0] || 'Grow My Audience',
      style: answers.personalityStyle || 'Engaging & Authentic',
      isPremium: isPremium
    },
    pastReflections: reflectionsRes.data || [],
    currentContext: {
      focus: answers.topic || 'Education & Digital Content',
      contextPeriod: 'Current cycle / Active creator season'
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
You are the content strategist for Content Khmer Hub (CKH). 
Compare these evaluated ideas, pick the standout winner, AND provide clear improvements for each idea so the creator knows how to make them significantly better.

CREATOR GOAL: ${context.creator.goals}
CREATOR PLATFORM: ${context.creator.platform}
CREATOR NICHE: ${context.creator.topic}
AUDIENCE: ${context.creator.audience}
IS PREMIUM MEMBER: ${context.creator.isPremium}

PAST AUDIENCE LEARNINGS (REFLECTIONS):
${JSON.stringify(context.pastReflections)}

ACTIVE TRENDS & OPPORTUNITIES:
${JSON.stringify((context.opportunities || []).map(o => o.title))}

IDEAS TO COMPARE:
${JSON.stringify(ideasWithEvals.map(item => ({
  id: item.idea.id,
  title: item.idea.title,
  description: item.idea.description,
  concern: item.idea.concern,
  eval: item.eval
})))}

INSTRUCTIONS FOR IMPROVEMENTS:
- Give a sharper hook (first 3 seconds / headline).
- Give 1 concrete thing to add or adjust.
- Explain why this improves performance based on their target audience and context.
${context.creator.isPremium ? '- Include deeper external trend signals and retention tactics since they are a Premium member.' : '- Use CKH creator profile insights and audience alignment.'}

Return JSON with this exact structure:
{
  "strongest_fit_id": "the idea id of the top recommendation",
  "standout_title": "Title of the winning idea",
  "standout_reason": "2 sentences explaining why this specific idea is the highest priority right now.",
  "relevant_context_note": "A short note on why this timing matters.",
  "improvements": [
    {
      "idea_id": "matching idea id",
      "idea_title": "Idea title",
      "suggested_hook": "A punchy opening hook or headline that stops the scroll.",
      "actionable_upgrade": "What specific angle or structure to add to make this stronger.",
      "why_it_works": "Why this will perform better with their specific audience."
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}