import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const [k, ...v] = line.trim().split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkOpenAPI() {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Definitions in Supabase:", Object.keys(data.definitions || {}));
  for (const [name, def] of Object.entries(data.definitions || {})) {
    console.log(`\n--- TABLE: ${name} ---`);
    console.log("Properties:", Object.keys(def.properties || {}));
    console.log("Required:", def.required);
  }
}

checkOpenAPI().catch(console.error);
