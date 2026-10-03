import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const [k, ...v] = line.trim().split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function probeSurveyFilters() {
  const statuses = ['PUBLISHED', 'published', 'DRAFT', 'draft', 'ACTIVE', 'active', 'LIVE', 'live'];
  for (const s of statuses) {
    const res = await supabase.from('surveys').select('*', { count: 'exact' }).eq('status', s);
    console.log(`Status [${s}]: count=${res.count}, data length=${res.data?.length}, error=${res.error?.message}`);
  }

  // Check without any filter with different column selections
  const resId = await supabase.from('surveys').select('id', { count: 'exact' });
  console.log(`Select id: count=${resId.count}, length=${resId.data?.length}`);

  // Check survey_versions
  const resVer = await supabase.from('survey_versions').select('id, survey_id, version_number, status', { count: 'exact' });
  console.log(`Select survey_versions: count=${resVer.count}, length=${resVer.data?.length}`);

  // Check questions
  const resQ = await supabase.from('questions').select('id, question_text, question_type', { count: 'exact' });
  console.log(`Select questions: count=${resQ.count}, length=${resQ.data?.length}`);
}

probeSurveyFilters().catch(console.error);
