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

async function testEmails() {
  const emails = [
    "admin@kolabacloud.com",
    "kolaba@admin.com",
    "aditidas2486@gmail.com",
    "shahrukh@kolabacloud.com",
    "info@kolabacloud.com"
  ];

  for (const email of emails) {
    const res = await supabase.auth.signInWithPassword({
      email,
      password: "Kolabacloud@75"
    });
    console.log(`Email [${email}]:`, res.error ? res.error.message : "SUCCESS! User: " + res.data.user.id);
  }
}

testEmails().catch(console.error);
