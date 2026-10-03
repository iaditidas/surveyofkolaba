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

async function testAuthUsers() {
  console.log("Testing signInWithOtp for admin@kolabacloud.com...");
  const otpRes = await supabase.auth.signInWithOtp({
    email: 'admin@kolabacloud.com',
    options: {
      shouldCreateUser: false
    }
  });
  console.log("signInWithOtp result:", otpRes);
}

testAuthUsers().catch(console.error);
