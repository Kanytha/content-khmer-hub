import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const firecrawlKey = process.env.FIRECRAWL_API_KEY;

if (!supabaseUrl || !supabaseKey || !firecrawlKey) {
  console.error('Missing keys in .env. Please check Supabase and FIRECRAWL_API_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const app = new FirecrawlApp({ apiKey: firecrawlKey });

const ONBOARDING_TOPICS = [
  'Education',
  'Lifestyle',
  'Gaming',
  'Business',
  'Beauty',
  'Technology',
  'Food',
  'Entertainment',
  'Personal Branding',
  'Art & Design',
  'Travel',
  'Music / Concert',
  'Other'
];

const targetSources = [
  {
    name: 'Opportunity Desk Cambodia (Youth & Grants)',
    url: 'https://opportunitydesk.org/category/regions/asia-pacific/cambodia/',
    defaultTopic: 'Education'
  },
  {
    name: 'CADT Cambodia Digital Events',
    url: 'https://www.cadt.edu.kh/news/',
    defaultTopic: 'Technology'
  },
  {
    name: 'Impact Hub Phnom Penh Programs',
    url: 'https://phnompenh.impacthub.net/programs/',
    defaultTopic: 'Business'
  },
  {
    name: 'Visit Cambodia Events',
    url: 'https://visitcambodia.co/cambodia/events',
    defaultTopic: 'Travel'
  },
  {
    name: 'Cambodia Scholarships & Exchanges',
    url: 'https://greatyop.com/regions/cambodia/',
    defaultTopic: 'Education'
  },
  {
    name: 'Phnom Penh Creative & Cultural Calendar',
    url: 'https://www.bestofpp.com/en/calendar',
    defaultTopic: 'Music / Concert'
  },
  {
    name: 'Meta House Phnom Penh',
    url: 'https://meta-house.com/',
    defaultTopic: 'Art & Design'
  },
  {
    name: 'MPL Cambodia (Mobile Legends Esports)',
    url: 'https://liquipedia.net/mobilelegends/MPL/Cambodia',
    defaultTopic: 'Gaming'
  }
];

function sanitizeDate(dateValue) {
  if (!dateValue) return null;

  const str = String(dateValue).trim();
  if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const date = new Date(`${str}T00:00:00`);
    if (!isNaN(date.getTime())) {
      return str;
    }
    return null;
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split('T')[0];
}

// checks if the title mentions an older year like "ODIC 2025" while today is in 2026
function hasOldYearMismatch(title, today) {
  if (!title) return false;
  
  const currentYear = parseInt(today.split('-')[0], 10);
  const matches = title.match(/\b(20\d\d)\b/g);

  if (!matches) return false;

  for (const yearStr of matches) {
    const parsedYear = parseInt(yearStr, 10);
    // if title contains a year older than this year, it is past content
    if (parsedYear < currentYear) {
      return true;
    }
  }

  return false;
}

function validateOpportunityDates({ startDate, endDate, deadline, today }) {
  const errors = [];

  if (startDate && endDate && endDate < startDate) {
    errors.push(`end_date (${endDate}) is before start_date (${startDate})`);
  }

  if (endDate && endDate < today) {
    errors.push(`event ended on ${endDate}`);
  }

  if (deadline && deadline < today) {
    errors.push(`deadline passed on ${deadline}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function getOpportunityStatus({ startDate, endDate, deadline, today }) {
  if (deadline && deadline < today && (!startDate || startDate > today)) {
    return 'closed';
  }

  if (endDate && endDate < today) {
    return 'closed';
  }

  if (startDate && startDate <= today && (!endDate || endDate >= today)) {
    return 'ongoing';
  }

  if (startDate && startDate > today) {
    return 'upcoming';
  }

  if (deadline && deadline >= today && (!startDate || startDate > today)) {
    return 'upcoming';
  }

  return 'unknown';
}

async function crawlAndSync() {
  const today = new Date().toISOString().split('T')[0];
  const currentYear = today.split('-')[0];
  const verifiedAt = new Date().toISOString();

  console.log('Starting CKH opportunity crawler...');
  console.log(`Current date: ${today}`);
  console.log(`Sources: ${targetSources.length}\n`);

  for (const source of targetSources) {
    console.log('==============================================');
    console.log(`Crawling: ${source.name}`);
    console.log(`URL: ${source.url}`);
    console.log('==============================================\n');

    try {
      const scrapeResult = await app.scrapeUrl(source.url, {
        formats: [
          {
            type: 'json',
            prompt: `
Today is ${today}.

You are extracting active, ongoing, or upcoming opportunities for Content Khmer Hub (CKH).

IMPORTANT YEAR AND RECENCY RULES:
- The current year is ${currentYear}.
- Many posts are archived from past years (e.g., 2024, 2025).
- If an opportunity title or content mentions a past year (like "2024" or "2025"), its deadline is in the past. DO NOT invent or bump the date to ${currentYear}.
- If only a month and day are listed (e.g., "September 30"), check the post date. DO NOT assume it belongs to ${currentYear} if it was posted in 2025.
- ONLY extract items that are currently active or happening in the future relative to ${today}.

DATE RULES:
- start_date: YYYY-MM-DD format, only if stated.
- end_date: YYYY-MM-DD format, only if stated.
- deadline: YYYY-MM-DD format, only if stated.
- If not explicitly stated, set them to null. Do not guess.

TOPICS:
Pick 1-3 topics only from: ${JSON.stringify(ONBOARDING_TOPICS)}.
`,
            schema: {
              type: 'object',
              properties: {
                opportunities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      type: {
                        type: 'string',
                        enum: [
                          'Programs',
                          'Scholarships',
                          'Grants',
                          'Competitions',
                          'Campaigns',
                          'Workshops',
                          'Events',
                          'Festivals'
                        ]
                      },
                      organizer: { type: 'string' },
                      source_url: { type: 'string' },
                      location: { type: 'string' },
                      start_date: { type: 'string', nullable: true },
                      end_date: { type: 'string', nullable: true },
                      deadline: { type: 'string', nullable: true },
                      date_evidence: { type: 'string', nullable: true },
                      eligibility: { type: 'string', nullable: true },
                      topics: {
                        type: 'array',
                        items: { type: 'string', enum: ONBOARDING_TOPICS }
                      },
                      subtopics: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    },
                    required: ['title', 'description', 'source_url', 'topics']
                  }
                }
              },
              required: ['opportunities']
            }
          }
        ],
        waitFor: 1500,
        onlyMainContent: true
      });

      const extractedData = scrapeResult?.json?.opportunities || [];

      if (!Array.isArray(extractedData)) {
        console.log(`Invalid extraction format from ${source.name}`);
        continue;
      }

      console.log(`Candidate opportunities found: ${extractedData.length}`);

      for (const opp of extractedData) {
        // Drop past events like "ODIC 2025" right away
        if (hasOldYearMismatch(opp.title, today)) {
          console.log(`Skipped "${opp.title}" — contains a past year.`);
          continue;
        }

        const cleanStartDate = sanitizeDate(opp.start_date);
        const cleanEndDate = sanitizeDate(opp.end_date);
        const cleanDeadline = sanitizeDate(opp.deadline);

        if (!cleanStartDate && !cleanEndDate && !cleanDeadline) {
          console.log(`Skipped "${opp.title}" — no reliable date found.`);
          continue;
        }

        const validation = validateOpportunityDates({
          startDate: cleanStartDate,
          endDate: cleanEndDate,
          deadline: cleanDeadline,
          today
        });

        if (!validation.valid) {
          console.log(`Skipped "${opp.title}"`);
          validation.errors.forEach(err => console.log(`   → ${err}`));
          continue;
        }

        const status = getOpportunityStatus({
          startDate: cleanStartDate,
          endDate: cleanEndDate,
          deadline: cleanDeadline,
          today
        });

        if (status === 'closed' || status === 'unknown') {
          console.log(`Skipped "${opp.title}" — status is ${status}.`);
          continue;
        }

        const finalStartDate = cleanStartDate || cleanDeadline || today;
        const finalEndDate = cleanEndDate || cleanStartDate || cleanDeadline || today;
        const finalTopics = Array.isArray(opp.topics) && opp.topics.length > 0
          ? opp.topics
          : [source.defaultTopic];
        const finalSubtopics = Array.isArray(opp.subtopics) ? opp.subtopics : [];
        const finalEligibility = opp.eligibility && opp.eligibility.trim() !== ''
          ? opp.eligibility.trim()
          : null;

          const fallbackDesc = `${opp.title?.trim()} — Opportunity details available via source link.`;

          const record = {
              title: opp.title?.trim(),
              description: opp.description?.trim() || fallbackDesc,
              type: opp.type || 'Events',
              organizer: opp.organizer?.trim() || source.name,
              source_url: opp.source_url?.trim() || source.url,
              location: opp.location?.trim() || 'Cambodia',
              start_date: finalStartDate,
              end_date: finalEndDate,
              deadline: cleanDeadline,
              topics: finalTopics,
              eligibility: finalEligibility
          };

          const { error } = await supabase
              .from('opportunities')
          .upsert(record, { onConflict: 'title' });

        if (error) {
          console.error(`✗ Failed to save "${opp.title}":`, error.message);
          continue;
        }

        console.log(`✓ Saved "${opp.title}" (${status})`);
      }

      console.log(`Finished syncing ${source.name}\n`);
    } catch (err) {
      console.error(`Could not crawl ${source.name}:`, err?.message || err);
      console.log('Skipping to next source...\n');
    }
  }

  console.log('\nChecking for expired opportunities in Supabase...');

  const { data: existingOpportunities, error: fetchError } = await supabase
    .from('opportunities')
    .select('id, title, start_date, end_date, deadline');

  if (fetchError) {
    console.error('Could not check old opportunities:', fetchError.message);
  } else {
    for (const opp of existingOpportunities || []) {
      const endDate = sanitizeDate(opp.end_date);
      const deadline = sanitizeDate(opp.deadline);

      const hasEnded = endDate && endDate < today;
      const hasExpiredDeadline = deadline && deadline < today && (!opp.start_date || opp.start_date > today);
      const hasPastYearTitle = hasOldYearMismatch(opp.title, today);

      if (hasEnded || hasExpiredDeadline || hasPastYearTitle) {
        console.log(`Removing expired/outdated opportunity: "${opp.title}"`);

        const { error: deleteError } = await supabase
          .from('opportunities')
          .delete()
          .eq('id', opp.id);

        if (deleteError) {
          console.error(`   ✗ Could not remove: ${deleteError.message}`);
        } else {
          console.log('   ✓ Removed');
        }
      }
    }
  }

  console.log('\n==============================================');
  console.log('CKH opportunity sync completed.');
  console.log(`Verified at: ${verifiedAt}`);
  console.log('==============================================');
}

crawlAndSync();