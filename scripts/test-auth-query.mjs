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

async function testSignInAndQuery() {
  console.log("Signing in with aditidas2486@gmail.com...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "aditidas2486@gmail.com",
    password: "TestPassword123!@#"
  });

  if (authError) {
    console.log("Sign in failed:", authError.message);
    return;
  }

  console.log("SIGNED IN SUCCESSFULLY! User ID:", authData.user.id);
  console.log("Session Access Token:", authData.session.access_token.substring(0, 20) + "...");

  // Now query surveys with this authenticated client!
  const { data: surveys, error: surveyError, count } = await supabase
    .from('surveys')
    .select('*', { count: 'exact' });

  console.log("Surveys as authenticated user:", {
    count,
    length: surveys?.length,
    surveys,
    error: surveyError?.message
  });

  // Query other tables as authenticated user
  const tables = [
    "survey_versions",
    "survey_sections",
    "questions",
    "question_options",
    "logic_rules",
    "survey_settings",
    "responses",
    "profiles"
  ];

  for (const t of tables) {
    const res = await supabase.from(t).select('*', { count: 'exact' }).limit(5);
    console.log(`[${t}] as authenticated user: count=${res.count}, rows=${res.data?.length}, error=${res.error?.message}`);
  }
}

testSignInAndQuery().catch(console.error);
