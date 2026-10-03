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

async function checkEnum() {
  const candidates = ['draft', 'published', 'archived', 'closed', 'paused', 'inactive', 'review'];
  for (const c of candidates) {
    const res = await supabase.from('surveys').select('id').eq('status', c);
    if (res.error) {
      console.log(`Candidate [${c}] ERROR:`, res.error.message);
    } else {
      console.log(`Candidate [${c}] VALID ENUM VALUE!`);
    }
  }
}

checkEnum().catch(console.error);
