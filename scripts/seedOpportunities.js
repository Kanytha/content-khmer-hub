import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing keys. Found in .env:");
  console.error("URL:", supabaseUrl ? "OK" : "Missing");
  console.error("Key:", supabaseKey ? "OK" : "Missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// official opportunities that matching the exact onboarding creator topics
const rawOpportunities = [
  {
    title: 'Cambodia BACII Exam Season 2026',
    description: 'National high school examination period. Prime timing for creators providing study methods, exam tips, stress management, and resource breakdowns.',
    type: 'Events',
    organizer: 'Ministry of Education, Youth and Sport',
    source_url: 'https://moeys.gov.kh',
    location: 'Cambodia',
    start_date: '2026-10-05',
    end_date: '2026-10-06',
    deadline: '2026-09-30',
    eligibility: 'Educational and student creators',
    topics: ['Education'],
    badge_tag: 'Begins in 1 month'
  },
  {
    title: 'Cambodia Digital Trade Forum 2026',
    description: 'Flagship forum exploring digital commerce, AI integration, logistics, and local tech enterprise development in Phnom Penh.',
    type: 'Events',
    organizer: 'Ministry of Commerce',
    source_url: 'https://moc.gov.kh',
    location: 'Phnom Penh',
    start_date: '2026-11-12',
    end_date: '2026-11-14',
    deadline: '2026-11-05',
    eligibility: 'Tech, business, and commerce creators',
    topics: ['Technology', 'Business'],
    badge_tag: null
  },
  {
    title: 'Phnom Penh Creative Design Grant 2026',
    description: 'Micro-funding and workspace access for independent digital illustrators, visual artists, and multimedia storytellers.',
    type: 'Grants',
    organizer: 'Cambodian Creative Arts Fund',
    source_url: 'https://example.com/creative-grant',
    location: 'Phnom Penh',
    start_date: '2026-10-15',
    end_date: '2026-12-01',
    deadline: '2026-10-10',
    eligibility: 'Visual artists, designers, and animators',
    topics: ['Art & Design', 'Entertainment'],
    badge_tag: null
  },
  {
    title: 'Khmer Culinary Heritage Showcase',
    description: 'A national food festival highlighting local regional dishes, cooking workshops, and traditional ingredient showcases.',
    type: 'Campaigns',
    organizer: 'Cambodia Chefs Association',
    source_url: 'https://example.com/khmer-food-fest',
    location: 'Siem Reap',
    start_date: '2026-11-20',
    end_date: '2026-11-23',
    deadline: '2026-11-15',
    eligibility: 'Food reviewers, vloggers, and home chefs',
    topics: ['Food', 'Lifestyle'],
    badge_tag: null
  },
  {
    title: 'Southeast Asia Community Esports Cup',
    description: 'Open amateur tournament for mobile gaming teams with opportunities for caster commentary, streaming highlights, and team coverage.',
    type: 'Competitions',
    organizer: 'Khmer Esports Federation',
    source_url: 'https://example.com/sea-esports',
    location: 'Online / Phnom Penh',
    start_date: '2026-10-20',
    end_date: '2026-10-25',
    deadline: '2026-10-12',
    eligibility: 'Gaming streamers and esports commentators',
    topics: ['Gaming', 'Technology'],
    badge_tag: null
  },
  {
    title: 'Cardamom Eco-Tourism Creator Residency',
    description: 'A funded 4-day travel program inviting creators to document sustainable travel trails, community homestays, and wildlife conservation.',
    type: 'Campaigns',
    organizer: 'Wildlife Alliance Cambodia',
    source_url: 'https://example.com/cardamom-residency',
    location: 'Koh Kong',
    start_date: '2026-11-01',
    end_date: '2026-11-05',
    deadline: '2026-10-18',
    eligibility: 'Travel, nature, and adventure vloggers',
    topics: ['Travel', 'Lifestyle'],
    badge_tag: null
  }
];

async function runCollector() {
  console.log("Starting opportunity ingestion pipeline...");

  const { data, error } = await supabase
    .from('opportunities')
    .insert(rawOpportunities)
    .select();

  if (error) {
    console.error("Pipeline failed with error:", error.message);
    process.exit(1);
  }

  console.log(`Successfully ingested ${data.length} opportunities into Supabase!`);
}

runCollector();