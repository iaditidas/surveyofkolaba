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

console.log("Supabase URL:", url);
console.log("Supabase Key:", key ? key.substring(0, 15) + "..." : "missing");

const supabase = createClient(url, key);

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

async function inspect() {
  console.log("=== INSPECTING SUPABASE TABLES ===");
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .limit(5);

      if (error) {
        console.log(`[${table}] ERROR:`, error.message, error.code, error.details);
      } else {
        console.log(`[${table}] Count: ${count}, Sample Rows: ${data.length}`);
        if (data.length > 0) {
          console.log(`   Sample columns:`, Object.keys(data[0]));
          console.log(`   First row:`, JSON.stringify(data[0], null, 2));
        }
      }
    } catch (e) {
      console.log(`[${table}] Exception:`, e.message);
    }
  }
}

inspect();
