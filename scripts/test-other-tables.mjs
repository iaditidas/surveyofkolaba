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

async function testOtherTableNames() {
  const tableCandidates = [
    "survey",
    "surveys",
    "survey_responses",
    "responses",
    "survey_templates",
    "templates",
    "questionnaires",
    "forms",
    "kolaba_surveys",
    "engineering_surveys",
    "ai_surveys",
    "admin_surveys",
    "public_surveys"
  ];

  for (const t of tableCandidates) {
    const res = await supabase.from(t).select("*", { count: "exact" }).limit(5);
    if (res.error) {
      console.log(`Table [${t}]: ERROR: ${res.error.message} (${res.error.code})`);
    } else {
      console.log(`Table [${t}]: EXISTS! count=${res.count}, rows=${res.data.length}`);
      if (res.data.length > 0) {
        console.log(`   DATA in ${t}:`, res.data);
      }
    }
  }
}

testOtherTableNames().catch(console.error);
