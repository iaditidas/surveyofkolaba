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

async function testQuery() {
  // Let's test inserting a test row or selecting with different filters or errors
  const { data, error } = await supabase.from("surveys").select("*");
  console.log("Surveys select:", { data, error });

  // Let's check auth settings or users
  const { data: authData, error: authError } = await supabase.auth.getSession();
  console.log("Auth session:", { authData, authError });

  // Let's test insert on surveys to see what columns are expected or if RLS blocks
  const testInsert = await supabase.from("surveys").insert({
    title: "Test Inspection Survey"
  }).select();
  console.log("Test insert result:", testInsert);
}

testQuery().catch(console.error);
