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

async function inspectColumns() {
  const tables = [
    "profiles",
    "surveys",
    "survey_versions",
    "survey_sections",
    "questions",
    "question_options",
    "logic_rules",
    "survey_settings",
    "responses",
    "response_answers",
    "survey_templates",
    "survey_assets",
    "audit_logs",
    "ai_import_jobs"
  ];

  for (const table of tables) {
    // We can query with select('*') and check if there are rows or if we can see properties
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`[${table}] error:`, error.message);
    } else {
      console.log(`[${table}] success, row count:`, data.length);
      if (data.length > 0) {
        console.log(`   columns:`, Object.keys(data[0]));
        console.log(`   data:`, data[0]);
      }
    }
  }
}

inspectColumns().catch(console.error);
