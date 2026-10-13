import { supabase } from './supabaseClient';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

const callGeminiJson = async (prompt, maxRetries = 2) => {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (response.status === 503 && attempt < maxRetries) {
        console.warn(`Gemini 3 Flash 503 high demand. Retrying attempt ${attempt + 1}...`);
        await new Promise(res => setTimeout(res, 1500 * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        throw new Error(`API failed with status: ${response.status}`);
      }

      const data = await response.json();
      let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiText) {
        throw new Error("No text returned by AI model.");
      }

      aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

      const jsonStartIndex = aiText.indexOf('{');
      const jsonEndIndex = aiText.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        aiText = aiText.substring(jsonStartIndex, jsonEndIndex + 1);
      }

      return JSON.parse(aiText);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, 1500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
};

// recommendation card on dashboard
export const generateWorkspaceData = async (selections = {}) => {
  const listValue = value => Array.isArray(value) ? value.filter(Boolean).join(", ") : (value || "");
  const profile = {
    topic: selections.topic || "",
    contentTags: listValue(selections.contentTags),
    recentIdeaPatterns: listValue(selections.recentIdeaPatterns),
    platform: selections.platform || "",
    language: selections.language || "",
    presentation: selections.presentation || "",
    audience: selections.audience || "",
    experience: selections.experience || "",
    primaryGoals: listValue(selections.primaryGoals),
    mattersMost: selections.mattersMost || "",
    recentSituation: selections.recentSituation || "",
    biggestChallenge: listValue(selections.biggestChallenge),
    supportNeeded: listValue(selections.supportNeeded)
  };

  const prompt = `
You are the Content Khmer Hub (CKH) creator decision-support engine.
Help this creator make a useful content decision based on their CURRENT preferences.

CURRENT CREATOR PROFILE (the source of truth for the recommendations):
${JSON.stringify(profile, null, 2)}

RULES:
1. The current topic/content focus and current goals have priority. Do not assume the creator is a coding, education, or YouTube creator unless their profile explicitly says so.
2. Do not substitute an old content idea or past activity for the creator's current topic. Past ideas are supporting context only and should be used only when relevant to the current focus.
3. Tailor all three recommendations to the stated topic, platform, goals, audience, language, creator style, current situation, challenges, and support needs when those details are provided.
4. If a profile field is empty, do not invent it or treat an example as a fact. Give broadly useful advice that stays within the stated topic.
5. Do not invent views, engagement, analytics, trends, or audience responses. Do not guarantee growth or success.
6. Do not advise the creator to wait for comments or ask the audience as the default solution. Suggest a creator-controlled action they can take.
7. Make the three recommendations meaningfully different:
   - rec_1: a specific topic or content angle within the creator's current focus;
   - rec_2: a suitable format, presentation, or packaging approach for the stated platform;
   - rec_3: a manageable series, experiment, or next step that fits their goals and constraints.
8. Recommendations must be practical and specific, not generic motivational advice. Use clear language suitable for creators in Cambodia when appropriate.

Return ONLY valid JSON with this exact structure:
{
  "current_focus": {
    "title": "Short actionable focus based on the current profile",
    "description": "One concise sentence connecting the current focus to an achievable milestone."
  },
  "active_recommendations": [
    {
      "id": "rec_1",
      "type": "Content Direction",
      "title": "Specific content angle",
      "reason": "Explain why this fits the current focus and one or more stated goals or challenges.",
      "action": "One concrete step the creator can take today."
    },
    {
      "id": "rec_2",
      "type": "Format / Packaging",
      "title": "Specific format or packaging approach",
      "reason": "Explain why this presentation approach fits the current topic and platform, if provided.",
      "action": "One concrete step the creator can take today."
    },
    {
      "id": "rec_3",
      "type": "Series & Experiment",
      "title": "Manageable series or experiment",
      "reason": "Explain how this fits the current goal and constraints.",
      "action": "One concrete step the creator can take today."
    }
  ]
}`;

  try {
    return await callGeminiJson(prompt);
  } catch (error) {
    console.error("AI Error caught successfully:", error);
    return {
      current_focus: {
        title: "Review your creator preferences",
        description: "Check your current content focus and goals, then try generating recommendations again."
      },
      active_recommendations: []
    };
  }
};

// recommendation details page
export const generateDetailedRecommendation = async (basicRec, selections = {}) => {
  const listValue = value => Array.isArray(value) ? value.filter(Boolean).join(", ") : (value || "");
  const currentProfile = {
    topic: selections.topic || "",
    contentTags: listValue(selections.contentTags),
    platform: selections.platform || "",
    language: selections.language || "",
    presentation: selections.presentation || "",
    audience: selections.audience || "",
    experience: selections.experience || "",
    primaryGoals: listValue(selections.primaryGoals),
    mattersMost: selections.mattersMost || "",
    recentSituation: selections.recentSituation || "",
    biggestChallenge: listValue(selections.biggestChallenge),
    supportNeeded: listValue(selections.supportNeeded),
    recentIdeaPatterns: listValue(selections.recentIdeaPatterns)
  };

  const recommendation = {
    title: basicRec?.title || "Content Direction",
    reason: basicRec?.reason || "",
    action: basicRec?.action || "",
    type: basicRec?.type || basicRec?.category || ""
  };

  const prompt = `
You are the Content Khmer Hub (CKH) decision-support advisor.
Explain the selected recommendation in a way that helps the creator decide whether and how to use it.

CURRENT CREATOR PROFILE (source of truth):
${JSON.stringify(currentProfile, null, 2)}

SELECTED RECOMMENDATION:
${JSON.stringify(recommendation, null, 2)}

RULES:
1. The current profile's topic, content focus, platform, goals, and constraints take priority over older ideas or past activity.
2. Do not change the selected recommendation's title or pretend it belongs to a different niche. Explain its relevance to the current focus honestly. If the connection is weak, say so in the summary and considerations, and suggest a sensible way to adapt it to the current focus.
3. Previous ideas and experience are supporting context only. Mention them only when relevant to the current focus; never treat them as the creator's current niche by themselves.
4. Use only the profile and recommendation information provided. Do not invent analytics, audience behavior, trends, results, or external opportunities.
5. Do not guarantee views, growth, engagement, or success.
6. Make advice practical and specific to the stated profile. If a field is missing, do not invent an answer.
7. Provide 2 to 4 evidence items in "why_prepared", 2 to 3 options in "what_this_could_help_with.options", and 2 to 3 trade-offs in "considerations".
8. If the supplied information does not identify a real opportunity, set "related_opportunity" to null.
9. If prior experience is relevant, explain how it may inform the next decision without letting it override the current preference.

Return ONLY a valid JSON object matching this schema:
{
  "title": ${JSON.stringify(recommendation.title)},
  "category": "CONTENT STRATEGY",
  "summary": "One or two sentences explaining how this recommendation fits or does not fully fit the creator's current focus, goals, and situation.",
  "why_prepared": [
    {
      "label": "CURRENT GOAL",
      "value": ${JSON.stringify(currentProfile.primaryGoals || "Not provided")},
      "source": "Provided in your current creator profile"
    },
    {
      "label": "CURRENT CONTENT FOCUS",
      "value": ${JSON.stringify(currentProfile.topic || currentProfile.contentTags || "Not provided")},
      "source": "Provided in your current creator profile"
    },
    {
      "label": "PLATFORM OR STYLE",
      "value": ${JSON.stringify(currentProfile.platform || currentProfile.presentation || "Not provided")},
      "source": "Provided in your current creator profile"
    }
  ],
  "what_this_could_help_with": {
    "description": "Explain what the creator can evaluate by trying or adapting this recommendation.",
    "options": [
      {
        "id": "opt_1",
        "title": "Try the core idea",
        "description": "A concrete first step adapted to the creator's current topic."
      },
      {
        "id": "opt_2",
        "title": "Adapt it to your style",
        "description": "A practical way to adapt the format or angle to the creator's current platform and presentation preferences."
      },
      {
        "id": "opt_3",
        "title": "Keep it manageable",
        "description": "A smaller version that fits the creator's current situation and support needs."
      }
    ]
  },
  "considerations": [
    "One realistic trade-off based on the creator's stated situation or challenge.",
    "One point to check before investing more time in this direction.",
    "If the recommendation is not closely aligned with the current focus, explain what should be adapted first."
  ],
  "related_opportunity": null,
  "personalized_approach": {
    "available": true,
    "suggested_title": "One practical next step tailored to the current creator profile.",
    "badge_text": "Start Planning"
  },
  "missing_context": {
    "needed": false,
    "prompt": ""
  }
}`;

  try {
    return await callGeminiJson(prompt);
  } catch (error) {
    console.error("Error generating detailed recommendation:", error);
    return {
      title: recommendation.title,
      category: "CONTENT STRATEGY",
      summary: recommendation.reason || "Review this recommendation against your current content focus and goals before deciding.",
      why_prepared: [
        {
          label: "CURRENT GOAL",
          value: currentProfile.primaryGoals || "Not provided",
          source: "Provided in your current creator profile"
        },
        {
          label: "CURRENT CONTENT FOCUS",
          value: currentProfile.topic || currentProfile.contentTags || "Not provided",
          source: "Provided in your current creator profile"
        }
      ],
      what_this_could_help_with: {
        description: "Try a small version first and decide whether it fits your current direction.",
        options: []
      },
      considerations: [
        "Check that this recommendation matches your current topic and goals.",
        "Adapt the effort to your current time and support needs."
      ],
      related_opportunity: null,
      personalized_approach: {
        available: false
      },
      missing_context: null
    };
  }
};

// Opportunity relevance evaluator
export const evaluateOpportunityRelevance = async (opportunities, selections) => {
  const prompt = `
    You are the Content Khmer Hub (CKH) Opportunity Matcher.
    Assess the relevance of each opportunity for this specific creator.
    Never modify factual opportunity details (dates, names, links).
    
    CREATOR PROFILE:
    - Topic / Focus: ${selections?.topic || "General Content"}
    - Primary Platform: ${selections?.platform || "Social Media"}
    - Primary Goals: ${selections?.primaryGoals?.join(", ") || "Growth"}
    - Challenges: ${selections?.biggestChallenge?.join(", ") || "Consistency"}

    OPPORTUNITIES LIST:
    ${JSON.stringify(opportunities.map(o => ({ id: o.id, title: o.title, topics: o.topics, description: o.description })))}

    TASK:
    Return a JSON array rating each opportunity.
    Schema:
    [
      {
        "id": "matching_opportunity_id",
        "is_relevant": true,
        "relevance_level": "High",
        "reason": "One concise sentence explaining why this matches their topic or goals."
      }
    ]
  `;

  try {
    return await callGeminiJson(prompt);
  } catch (err) {
    console.error("Opportunity relevance evaluation failed:", err);
    return opportunities.map(o => ({
      id: o.id,
      is_relevant: false,
      relevance_level: "Low",
      reason: "Explore this upcoming opportunity in Cambodia."
    }));
  }
};

// Opportunity Details: Decision-support analysis
export const generateOpportunityAnalysis = async (opportunity, selections) => {
  const niche = selections?.topic || selections?.focus || "Content Creation";
  const goals = Array.isArray(selections?.primaryGoals)
    ? selections.primaryGoals.join(", ")
    : (selections?.goal || "Channel Growth & Audience Value");
  const challenges = Array.isArray(selections?.biggestChallenge)
    ? selections.biggestChallenge.join(", ")
    : (selections?.challenge || "Balancing Time & Production Effort");

  const prompt = `
    You are the Content Khmer Hub (CKH) Decision AI, an authentic content advisor for social media creators in Cambodia.
    Analyze an external Cambodian opportunity (scholarship, workshop, contest, or event) for this specific creator.

    CREATOR PROFILE:
    - Primary Niche / Topic: "${niche}"
    - Primary Platform: "${selections?.platform || "Social Media"}"
    - Current Growth Goals: "${goals}"
    - Key Pain Point / Challenge: "${challenges}"

    EXTERNAL OPPORTUNITY DATA:
    - Title: "${opportunity?.title || 'External Program'}"
    - Type / Category: "${opportunity?.type || 'Event / Opportunity'}"
    - Organizer: "${opportunity?.organizer || 'Cambodian Organization'}"
    - Location: "${opportunity?.location || 'Cambodia'}"
    - Topics: "${opportunity?.topics?.join(", ") || 'General'}"
    - Description: "${opportunity?.description || 'No detailed description provided'}"

    ANALYSIS RULES:
    1. Ground the advice directly in their niche ("${niche}"). Never give generic filler like "this is a good event to attend".
    2. Respect creator time: address how much effort/preparation covering this takes vs. their current schedule.
    3. Never guarantee views or algorithm success. Use supportive, pragmatic wording ("explore this angle", "test as a short update").
    4. Provide one specific, tangible hook or production angle they can record or post.

    Return ONLY a valid JSON object matching this schema:
    {
      "why_relevant": "2 concise sentences explaining specifically why this announcement matters to an audience interested in ${niche}, and how covering it builds creator authority.",
      "considerations": [
        "First practical trade-off or requirement (e.g. deadline urgency, verification of eligibility, or filming setup)",
        "Second practical consideration (e.g. balancing research time vs. creating a fast 45s summary)"
      ],
      "suggested_content_angle": "A concrete video or post hook + format idea (e.g., 'Record a 45s breakdown answering: What documents do you actually need before the deadline?')"
    }
  `;

  try {
    return await callGeminiJson(prompt);
  } catch (error) {
    console.error("Failed to generate opportunity analysis:", error);
    return {
      why_relevant: `This ${opportunity?.type?.toLowerCase() || 'event'} relates directly to your focus on ${niche}, offering a timely real-world resource your followers can benefit from.`,
      considerations: [
        "Check the official deadline and eligibility criteria before scripting your post.",
        "Consider whether a quick 30-60 second highlight fits your current weekly production schedule."
      ],
      suggested_content_angle: "Draft a concise 3-point breakdown highlighting who qualifies, key dates, and official next steps."
    };
  }
};

// OPPORTUNITY ALERT
export async function notifyMatchingCreators(newOpp) {
  try {
    const oppType = newOpp.type || newOpp.category || 'Scholarships';

    // Find creators whose preferences include this opportunity type
    const { data: matchedCreators, error } = await supabase
      .from('creator_profiles')
      .select('user_id, opportunity_alert_preferences')
      .contains('opportunity_alert_preferences', [oppType]);

    if (error || !matchedCreators || matchedCreators.length === 0) return;

    // Send notifications only to matching creators
    const notificationsToInsert = matchedCreators.map(creator => ({
      user_id: creator.user_id,
      title: `New ${oppType} Alert`,
      message: `${newOpp.title || 'A new opportunity'} matches your alert preferences.`,
      type: 'opportunity_match',
      action_link: '/opportunities',
      is_read: false
    }));

    await supabase.from('notifications').insert(notificationsToInsert);
  } catch (err) {
    console.error("Error creating opportunity notification:", err);
  }
}