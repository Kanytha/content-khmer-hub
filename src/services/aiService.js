const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

const callGeminiJson = async (prompt) => {
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
};

// recommendation card on dashboard
export const generateWorkspaceData = async (selections) => {
  const prompt = `
    You are the Content Khmer Hub (CKH) AI. CKH is a decision-support system, not a content generator. 
    Do not invent analytics, audience behavior, trends, or creator information. 
    Use ONLY the information provided below. Always explain the reasoning based on this exact data.

    CREATOR PROFILE:
    - Topic: ${selections.topic || "General Content"}
    - Platform: ${selections.platform || "Social Media"}
    - Goals: ${selections.primaryGoals?.join(", ") || "Growth"}
    - Challenge: ${selections.biggestChallenge?.join(", ") || "Consistency"}
    
    TASK:
    Generate 1 "Current Focus" and 3 "Recommendations". 
    Make them highly specific to the Creator Profile above. 
    
    Return ONLY a raw JSON object exactly like this structure, with absolutely no markdown formatting or conversational text:
    {
      "current_focus": {
        "title": "Short action-oriented title",
        "description": "One specific sentence explaining what to focus on right now and why it fits their profile."
      },
      "active_recommendations": [
        {
          "id": "rec_1",
          "title": "Actionable Idea Title",
          "reason": "Explain exactly why this fits their stated goals and challenges.",
          "action": "Specific next step to take"
        },
        {
          "id": "rec_2",
          "title": "Actionable Idea Title",
          "reason": "Explain exactly why this fits their stated goals and challenges.",
          "action": "Specific next step to take"
        },
        {
          "id": "rec_3",
          "title": "Actionable Idea Title",
          "reason": "Explain exactly why this fits their stated goals and challenges.",
          "action": "Specific next step to take"
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
        title: "Welcome to your workspace!",
        description: "We are preparing your personalized ideas. Please check back later."
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
  const prompt = `
    You are the Content Khmer Hub (CKH) AI, a strict decision-support system.
    Analyze an external Cambodian opportunity for a specific creator.
    
    STRICT RULES:
    1. Do not modify or fabricate any factual event details (dates, eligibility, location).
    2. Explain WHY this opportunity could be relevant to the creator's content and goals.
    3. Provide realistic considerations or trade-offs (e.g., preparation time, travel, research vs. production).
    4. Never guarantee views, reach, or success. Use words like "explore", "opportunity to cover", "test".

    CREATOR PROFILE:
    - Topic / Focus: ${selections?.topic || "General Content"}
    - Platform: ${selections?.platform || "Social Media"}
    - Goals: ${selections?.primaryGoals?.join(", ") || "Growth"}
    - Challenges: ${selections?.biggestChallenge?.join(", ") || "Consistency"}

    OPPORTUNITY DETAILS:
    - Title: ${opportunity.title}
    - Type: ${opportunity.type}
    - Organizer: ${opportunity.organizer}
    - Location: ${opportunity.location}
    - Topics: ${opportunity.topics?.join(", ")}
    - Description: ${opportunity.description}

    Return a JSON object with this exact schema:
    {
      "why_relevant": "1-2 sentences explaining why this fits their specific topic and goals, and how they could turn it into content.",
      "considerations": [
        "First practical trade-off or requirement",
        "Second practical consideration"
      ],
      "suggested_content_angle": "One actionable idea for how to cover or participate in this opportunity."
    }
  `;

  try {
    return await callGeminiJson(prompt);
  } catch (error) {
    console.error("Failed to generate opportunity analysis:", error);
    return {
      why_relevant: `This ${opportunity.type?.toLowerCase() || 'event'} relates to your focus on ${selections?.topic || 'content creation'} and could provide authentic real-world topics for your audience.`,
      considerations: [
        "Review the official eligibility and registration criteria before committing.",
        "Consider whether attending or covering this fits your current production schedule."
      ],
      suggested_content_angle: "Document key takeaways or your personal perspective to share with your audience."
    };
  }
};