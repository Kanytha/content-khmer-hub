import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabaseClient';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

// 1. Gather creator context
export async function getCreatorContext(userId) {
  const [profileRes, opportunitiesRes] = await Promise.all([
    supabase.from('creator_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('opportunities').select('title, topics, type, deadline, start_date').limit(6)
  ]);

  const answers = profileRes.data?.onboarding_answers || {};

  return {
    creator: {
      topic: answers.topic || 'General',
      platform: answers.primaryPlatform || 'TikTok / Facebook',
      audience: answers.targetAudience || 'Cambodian youth & students',
      goals: answers.primaryGoals?.[0] || 'Grow My Audience',
      style: answers.personalityStyle || 'Engaging & Authentic'
    },
    currentContext: {
      focus: answers.topic || 'Education & Digital Content',
      contextPeriod: 'Current semester / Active exam cycle'
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
You are the person to give the consultantation/advice for the user in Content Khmer Hub (CKH). Evaluate this creator's idea based on their context.

CREATOR CONTEXT:
- Main Topic: ${context.creator.topic}
- Platform: ${context.creator.platform}
- Target Audience: ${context.creator.audience}
- Primary Goal: ${context.creator.goals}
- Content Style: ${context.creator.style}
- Current Context Period: ${context.currentContext.contextPeriod}

ACTIVE OPPORTUNITIES:
${JSON.stringify(context.opportunities.map(o => o.title))}

IDEA:
- Title: "${idea.title}"
- Description: "${idea.description}"
- Intended Format: "${idea.intended_format || 'Not sure yet'}"
- Unsure/Concern: "${idea.concern || 'None'}"

CRITICAL BREVITY RULES:
- Keep every sentence ultra-short, punchy, and under 12 words.
- Never write essays or long paragraphs. Be direct and concise.

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

  // Save evaluation to Supabase
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
      format_suggested: evaluation.format_suggested,
      one_thing_to_consider: evaluation.one_thing_to_consider,
      full_evaluation_json: evaluation
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 3. Compare Multiple Evaluated Ideas
export async function compareIdeas(ideasWithEvals, context) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `
You are the AI advisor for Content Khmer Hub (CKH). Compare these evaluated content ideas for this creator.

CREATOR GOAL: ${context.creator.goals}
CURRENT CONTEXT: ${context.currentContext.contextPeriod}

IDEAS TO COMPARE:
${JSON.stringify(ideasWithEvals.map(item => ({
  id: item.idea.id,
  title: item.idea.title,
  eval: item.eval
})))}

Evaluate which idea stands out best for their current goal, and write a contextual note.
Return JSON:
{
  "strongest_fit_id": "the idea id of the top recommendation",
  "standout_title": "Title of the winning idea",
  "standout_reason": "2 sentences explaining why this specific idea is the highest priority right now.",
  "relevant_context_note": "A short note on why this timing matters (e.g. current exam period, trend)."
}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}