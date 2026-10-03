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

async function checkEmails() {
  const candidateEmails = [
    "aditidas2486@gmail.com",
    "aditidas@kolabacloud.com",
    "kolaba@admin.com",
    "shahrukh@kolabacloud.com",
    "shahr@kolabacloud.com",
    "admin@kolabacloud.com",
    "info@kolabacloud.com"
  ];

  for (const email of candidateEmails) {
    // If we call signUp with a dummy password:
    // If user already registered, Supabase often returns:
    // "User already registered" or returns user without session
    const res = await supabase.auth.signUp({
      email,
      password: "TestPassword123!@#"
    });

    console.log(`Email [${email}]:`, {
      user: res.data?.user?.id,
      identities: res.data?.user?.identities?.length,
      error: res.error?.message
    });
  }
}

checkEmails().catch(console.error);
