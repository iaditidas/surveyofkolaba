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

async function probeTable(table, candidateCols) {
  const valid = [];
  for (const c of candidateCols) {
    const res = await supabase.from(table).select(c).limit(0);
    if (!res.error) {
      valid.push(c);
    }
  }
  console.log(`\n=== Table: ${table} ===`);
  console.log(valid.join(', '));
  return valid;
}

async function run() {
  await probeTable("surveys", [
    "id", "title", "slug", "description", "purpose", "industry", "company_name", "company_logo",
    "status", "created_by", "created_at", "updated_at", "deleted_at", "current_version_id",
    "metadata", "is_active", "settings", "sections", "theme", "logo_url", "brand_color"
  ]);

  await probeTable("survey_versions", [
    "id", "survey_id", "version_number", "version", "status", "changelog", "created_by",
    "created_at", "updated_at", "is_published", "published_at", "metadata"
  ]);

  await probeTable("survey_sections", [
    "id", "survey_id", "survey_version_id", "version_id", "title", "description", "order_index",
    "order", "visibility", "created_at", "updated_at", "metadata"
  ]);

  await probeTable("questions", [
    "id", "survey_id", "survey_version_id", "version_id", "section_id", "title", "question_text",
    "type", "question_type", "description", "placeholder", "required", "is_required", "order_index",
    "order", "visibility", "settings", "config", "created_at", "updated_at", "metadata", "min", "max"
  ]);

  await probeTable("question_options", [
    "id", "question_id", "label", "value", "sublabel", "order_index", "order", "created_at",
    "updated_at", "metadata"
  ]);

  await probeTable("logic_rules", [
    "id", "survey_id", "survey_version_id", "version_id", "source_question_id", "target_question_id",
    "target_section_id", "action", "operator", "value", "conditions", "match_type", "created_at", "metadata"
  ]);

  await probeTable("survey_settings", [
    "id", "survey_id", "survey_version_id", "version_id", "allow_multiple_responses", "is_anonymous",
    "require_email", "require_phone", "show_progress", "show_progress_indicator", "show_question_numbers",
    "completion_message", "brand_color", "brand_primary_color", "brand_secondary_color", "redirect_url",
    "created_at", "updated_at", "metadata"
  ]);

  await probeTable("responses", [
    "id", "survey_id", "survey_version_id", "version_id", "respondent_id", "respondent_email",
    "respondent_name", "respondent_phone", "status", "started_at", "submitted_at", "completed_at",
    "created_at", "updated_at", "time_spent_seconds", "metadata"
  ]);

  await probeTable("response_answers", [
    "id", "response_id", "question_id", "answer_value", "text_value", "numeric_value",
    "selected_option_ids", "created_at", "metadata"
  ]);

  await probeTable("profiles", [
    "id", "email", "full_name", "name", "role", "avatar_url", "company", "created_at", "updated_at"
  ]);
}

run().catch(console.error);
