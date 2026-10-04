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
export const generateWorkspaceData = async (selections) => {
  const prompt = `
You are the Content Khmer Hub (CKH) decision-support engine.

CREATOR PROFILE & ACTIVITY:
- Primary Category: ${selections.topic || "Education"}
- Specific Content Focus & Tags: ${selections.contentTags?.join(", ") || "Web Development, Coding, Frontend, Portfolio"}
- Recent Submitted Ideas / Activity: ${selections.recentIdeaPatterns?.join("; ") || "Building complete portfolio websites"}
- Platform: ${selections.platform || "YouTube"}
- Primary Goal: ${selections.primaryGoals?.join(", ") || "Reach More People"}
- Current Challenge: ${selections.biggestChallenge?.join(", ") || "Consistency"}

CRITICAL DOMAIN RULE:
Do NOT produce generic, high-level education advice (e.g., studying tips, general school homework).
The creator's specific domain is technical coding, software development, and digital creation.
All recommendations, formats, hooks, and actions MUST directly relate to programming, code workflows, website building, or technical tools.

ABSOLUTE DATA RULE:
1. Ground truth only: Rely strictly on the profile and technical tags above.
2. NEVER advise "asking your audience or waiting for comments". Focus entirely on creator-controlled coding examples and structure.
3. Provide 3 distinct technical angles:
   - rec_1: Specific Technical Angle (a concrete coding concept or beginner trap)
   - rec_2: Technical Format / Packaging (before/after code refactor, short teardown, workflow demo)
   - rec_3: Series / Scope Narrowing (splitting a large project like a portfolio build into bite-sized segments)

OUTPUT FORMAT:
Return ONLY raw JSON with this exact structure:
{
  "current_focus": {
    "title": "Actionable technical focus title",
    "description": "One concise sentence connecting their coding focus to an achievable milestone."
  },
  "active_recommendations": [
    {
      "id": "rec_1",
      "type": "Content Direction",
      "title": "Specific Code Angle Title",
      "reason": "Explain why this matches their stated goal and challenge based on their specific technical focus.",
      "action": "One concrete step the creator can code or outline today."
    },
    {
      "id": "rec_2",
      "type": "Format / Packaging",
      "title": "Specific Code Packaging Title",
      "reason": "Explain why this format highlights code clarity and retention without audience reliance.",
      "action": "One concrete step the creator can code or outline today."
    },
    {
      "id": "rec_3",
      "type": "Series & Experiment",
      "title": "Manageable Build Title",
      "reason": "Explain why breaking down this programming build reduces project friction.",
      "action": "One concrete step the creator can code or outline today."
    }
  ]
}
  `;

  try {
    return await callGeminiJson(prompt);
  } catch (error) {
    console.error("AI Error caught successfully:", error);
    return {
      current_focus: {
        title: "Complete your creator profile",
        description: "Add more details about your goals and technical focus so CKH can generate structured decision support."
      },
      active_recommendations: []
    };
  }
};

// recommendation details page
export const generateDetailedRecommendation = async (basicRec, selections) => {
  const prompt = `
    You are the Content Khmer Hub (CKH) AI, a strict decision-support system.
    Your purpose is to help the creator decide whether this specific recommendation is suitable for their current situation.

    STRICT RULES:
    1. Do not invent audience behavior, views, engagement, trends, or analytics.
    2. Do not guarantee growth, views, or success. Use words like "explore", "test", or "opportunity".
    3. Use ONLY the data provided below.
    4. If related opportunities do not exist in the data, return "related_opportunity": null. Never fabricate an opportunity.
    5. Provide 2 to 4 evidence items for "why_prepared", 2 to 3 concise points for "what_this_could_help_with", and 2 to 3 trade-offs for "considerations".

    CREATOR PROFILE DATA:
    - Topic / Content Focus: ${selections?.topic || "General Content"}
    - Primary Platform: ${selections?.platform || "Social Media"}
    - Language: ${selections?.language || "Khmer"}
    - Primary Goals: ${selections?.primaryGoals?.join(", ") || "Growth"}
    - Stated Challenges: ${selections?.biggestChallenge?.join(", ") || "Consistency"}
    - Current Focus: ${selections?.recentSituation || "Not specified"}

    SELECTED RECOMMENDATION TO EXPAND:
    - Title: ${basicRec?.title || "Content Direction"}
    - Context Reason: ${basicRec?.reason || ""}

    Return ONLY a raw JSON object matching this schema exactly:
    {
      "title": "${basicRec?.title || "Content Direction"}",
      "category": "CONTENT STRATEGY",
      "summary": "1-2 sentences explaining why exploring this direction could help build on what they have shared with CKH.",
      "why_prepared": [
        {
          "label": "CURRENT GOAL",
          "value": "${selections?.primaryGoals?.[0] || "Growth"}",
          "source": "Provided by you"
        },
        {
          "label": "CONTENT FOCUS",
          "value": "${selections?.topic || "General Content"}",
          "source": "Provided by you"
        },
        {
          "label": "CREATOR PREFERENCE",
          "value": "Practical, useful content",
          "source": "Learned from onboarding"
        }
      ],
      "what_this_could_help_with": {
        "description": "Short explanation of how this can be explored without overhauling existing workflow.",
        "options": [
          {
            "id": "opt_1",
            "title": "Quick Tutorial",
            "description": "Explain one practical topic clearly."
          },
          {
            "id": "opt_2",
            "title": "Common Problem → Solution",
            "description": "Address a common hurdle your audience faces."
          },
          {
            "id": "opt_3",
            "title": "How I Do It",
            "description": "Share your personal workflow or perspective."
          }
        ]
      },
      "considerations": [
        "This fits your current goal, but evaluate if it matches your bandwidth right now.",
        "CKH does not track your platform performance metrics, so audience interest cannot be confirmed yet.",
        "Consider whether this topic aligns with your personal style before committing."
      ],
      "related_opportunity": null,
      "personalized_approach": {
        "available": true,
        "suggested_title": "Choose one practical topic you know well and test it in a single post.",
        "badge_text": "Start Planning"
      },
      "missing_context": {
        "needed": true,
        "prompt": "Share more about your specific audience demographics to refine suggestions."
      }
    }
  `;

  try {
    return await callGeminiJson(prompt);
  } catch (error) {
    console.error("Error generating detailed recommendation:", error);
    return {
      title: basicRec?.title || "Recommendation Details",
      category: "CONTENT STRATEGY",
      summary: basicRec?.reason || "Here is the context behind this direction.",
      why_prepared: [
        {
          "label": "CURRENT GOAL",
          "value": selections?.primaryGoals?.[0] || "Growth",
          "source": "Provided by you"
        }
      ],
      what_this_could_help_with: {
        description: "Explore small tests to evaluate how this format feels.",
        options: []
      },
      considerations: [
        "Take this direction at your own pace and adapt it to your workflow."
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