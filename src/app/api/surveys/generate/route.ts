import { NextRequest, NextResponse } from "next/server";
import { SurveySchema, SurveySection, SurveyQuestion, LogicRule } from "@/types/schema";

export async function POST(req: NextRequest) {
  try {
    const { prompt, industry, targetAudience, rawDocumentText, mode } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    // Mode 1: Parse from raw document or pasted questions text
    if (mode === "document" && rawDocumentText) {
      const generated = await parseDocumentToSurvey(rawDocumentText);
      return NextResponse.json({ success: true, survey: generated });
    }

    // Mode 2: Generate from prompt / description
    const generated = await generateProfessionalSurvey({
      prompt: prompt || "Customer satisfaction feedback survey",
      industry: industry || "General",
      targetAudience: targetAudience || "Target Participants",
      apiKey,
    });

    return NextResponse.json({ success: true, survey: generated });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate survey" },
      { status: 500 }
    );
  }
}

// Enterprise-grade survey generator
async function generateProfessionalSurvey({
  prompt,
  industry,
  targetAudience,
  apiKey,
}: {
  prompt: string;
  industry: string;
  targetAudience: string;
  apiKey?: string;
}): Promise<Partial<SurveySchema>> {
  // Try Gemini API if key is present
  if (apiKey) {
    try {
      const systemPrompt = `You are a Principal Survey Methodologist and Product Researcher at Kolaba Cloud AI.
Design an executive-grade, professional survey for:
Goal: "${prompt}"
Industry: "${industry}"
Target Audience: "${targetAudience}"

Rules:
1. Create 3 structured sections: Profile, Core Evaluation, Strategic Future.
2. Formulate 8-12 articulate questions using single-choice, multi-choice, rating (1-5), linear-scale (0-10), short-text, and long-text.
3. Every question must have an insightful title, clear guidance description, and realistic options.
4. Add 1-2 conditional branching rules.

Return ONLY pure JSON matching this exact structure:
{
  "title": string,
  "description": string,
  "industry": string,
  "sections": [
    {
      "id": string,
      "title": string,
      "description": string,
      "order": number,
      "visibility": "VISIBLE",
      "questions": [
        {
          "id": string,
          "type": string,
          "title": string,
          "description": string,
          "required": boolean,
          "visibility": "VISIBLE",
          "order": number,
          "options": [{"id": string, "label": string}],
          "min": number,
          "max": number,
          "minLabel": string,
          "maxLabel": string,
          "placeholder": string
        }
      ]
    }
  ],
  "logic": [
    {
      "id": string,
      "action": "show" | "hide",
      "targetId": string,
      "matchType": "ALL",
      "conditions": [
        {
          "id": string,
          "questionId": string,
          "operator": "equals",
          "value": string
        }
      ]
    }
  ]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { response_mime_type: "application/json" },
          }),
          signal: AbortSignal.timeout(6000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            ...parsed,
            id: `surv_${Date.now()}`,
            status: "DRAFT",
            version: 1,
            settings: {
              allowMultipleResponses: false,
              isAnonymous: false,
              requireEmail: true,
              showProgressIndicator: true,
              showQuestionNumbers: true,
              completionMessage: "Thank you for contributing to this research study!",
              brandColor: "#0D9488",
            },
          };
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to expert synthesis:", err);
    }
  }

  // Expert Synthesis Engine (Domain tailored, highly polished)
  const isEducation = /college|student|academic|faculty|school|university|engineering|curriculum|campus/i.test(
    prompt + industry
  );
  const isHealthcare = /health|patient|doctor|clinic|medical|hospital|clinical|pharma/i.test(
    prompt + industry
  );
  const isFintech = /fintech|bank|payment|invest|credit|crypto|financial|trading/i.test(
    prompt + industry
  );
  const isRoboticsOrHardware = /robot|vehicle|autonomous|hardware|sensor|lidar|automotive|drone/i.test(
    prompt + industry
  );

  let cleanTitle = prompt.trim();
  if (cleanTitle.length > 60) {
    cleanTitle = cleanTitle.substring(0, 57).trim() + "...";
  }
  if (!/survey|study|assessment|inquiry|feedback/i.test(cleanTitle)) {
    cleanTitle += " Strategic Assessment";
  }
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  let sec1Questions: SurveyQuestion[] = [];
  let sec2Questions: SurveyQuestion[] = [];
  let sec3Questions: SurveyQuestion[] = [];
  let logicRules: LogicRule[] = [];

  if (isEducation) {
    sec1Questions = [
      {
        id: "q_edu_role",
        type: "single-choice",
        title: "What is your primary affiliation within the technical institution?",
        description: "Helps tailor subsequent questions to your academic or student responsibilities.",
        required: true,
        visibility: "VISIBLE",
        order: 1,
        options: [
          { id: "opt_lead", label: "Principal / Dean / Academic Director" },
          { id: "opt_hod", label: "Department Head (HOD) / Professor" },
          { id: "opt_faculty", label: "Project Guide / Lab In-Charge" },
          { id: "opt_student", label: "Student / Club Lead / Hackathon Team" },
        ],
      },
      {
        id: "q_edu_institution",
        type: "short-text",
        title: "Institution / College Name",
        description: "Official name of the university or technical campus.",
        required: true,
        visibility: "VISIBLE",
        order: 2,
        placeholder: "e.g., National Institute of Technology (NIT)",
      },
      {
        id: "q_edu_email",
        type: "email",
        title: "Official Institutional Email",
        description: "We will share the published research summary to this address.",
        required: true,
        visibility: "VISIBLE",
        order: 3,
        placeholder: "name@college.edu.in",
      },
    ];

    sec2Questions = [
      {
        id: "q_edu_gpu_setup",
        type: "single-choice",
        title: "What GPU compute infrastructure is currently available for AI/ML student projects?",
        description: "Select the option that best reflects typical laboratory conditions.",
        required: true,
        visibility: "VISIBLE",
        order: 1,
        options: [
          { id: "opt_dedicated", label: "Dedicated on-prem GPU cluster (NVIDIA A100/H100/RTX 6000)" },
          { id: "opt_workstation", label: "Consumer workstations (RTX 3060/4090) in shared computer labs" },
          { id: "opt_cloud", label: "Commercial cloud credits (AWS/GCP/Azure) with budget limits" },
          { id: "opt_colab", label: "Students primarily rely on free Google Colab or personal laptops" },
          { id: "opt_none", label: "No specialized AI hardware currently available" },
        ],
      },
      {
        id: "q_edu_friction",
        type: "multi-choice",
        title: "Which challenges most severely impact the completion of advanced AI projects?",
        description: "Select all that apply to your department or team.",
        required: true,
        visibility: "VISIBLE",
        order: 2,
        options: [
          { id: "opt_f1", label: "GPU Out-Of-Memory (OOM) errors during LLM fine-tuning and training" },
          { id: "opt_f2", label: "High cost and unpredictable billing of public hyperscaler clouds" },
          { id: "opt_f3", label: "Lack of industry mentorship on real-world system architecture" },
          { id: "opt_f4", label: "Complex software environment setup (CUDA, drivers, PyTorch packages)" },
          { id: "opt_f5", label: "Placement recruiters reporting gaps in candidates' hands-on AI skills" },
        ],
      },
      {
        id: "q_edu_severity",
        type: "rating",
        title: "Rate the overall impact of compute bottlenecks on research and capstone project quality",
        description: "1 = Negligible impact, 5 = Severe blocker preventing publication-grade work",
        required: true,
        visibility: "VISIBLE",
        order: 3,
        min: 1,
        max: 5,
        minLabel: "Negligible",
        maxLabel: "Severe Blocker",
      },
    ];

    sec3Questions = [
      {
        id: "q_edu_sandbox_interest",
        type: "yes-no",
        title: "Would your department be interested in a zero-cost 30-day AI Sandbox & GPU pilot?",
        description: "Includes preloaded Jupyter environments, LLM inference endpoints, and student quota isolation.",
        required: true,
        visibility: "VISIBLE",
        order: 1,
      },
      {
        id: "q_edu_followup_contact",
        type: "phone",
        title: "WhatsApp / Direct Phone for Pilot Coordination",
        description: "Optional: Only used by our academic solutions team to schedule sandbox access.",
        required: false,
        visibility: "VISIBLE",
        order: 2,
        placeholder: "+91 98765 43210",
      },
      {
        id: "q_edu_recommendations",
        type: "long-text",
        title: "What is one initiative industry partners could provide that would most empower your engineers?",
        required: false,
        visibility: "VISIBLE",
        order: 3,
        placeholder: "e.g., Hackathon sponsorship, live GPU clusters, verified curriculum certificates...",
      },
    ];

    logicRules = [
      {
        id: "rule_followup_phone",
        action: "show",
        targetId: "q_edu_followup_contact",
        matchType: "ALL",
        conditions: [
          {
            id: "cond_yes_pilot",
            questionId: "q_edu_sandbox_interest",
            operator: "equals",
            value: "Yes",
          },
        ],
      },
    ];
  } else if (isRoboticsOrHardware) {
    sec1Questions = [
      {
        id: "q_robot_role",
        type: "single-choice",
        title: "What is your engineering specialty or function?",
        required: true,
        visibility: "VISIBLE",
        order: 1,
        options: [
          { id: "opt_perception", label: "Perception & Computer Vision" },
          { id: "opt_sensor", label: "Sensor Fusion & Hardware Integration" },
          { id: "opt_control", label: "Controls, Path Planning & Robotics" },
          { id: "opt_fleet", label: "Fleet Testing, Safety & Operations" },
        ],
      },
      {
        id: "q_robot_org",
        type: "short-text",
        title: "Company or Research Lab Name",
        required: true,
        visibility: "VISIBLE",
        order: 2,
        placeholder: "e.g., Autonomous Mobility Systems Lab",
      },
      {
        id: "q_robot_email",
        type: "email",
        title: "Professional Email Address",
        required: true,
        visibility: "VISIBLE",
        order: 3,
        placeholder: "engineer@company.com",
      },
    ];

    sec2Questions = [
      {
        id: "q_sensor_stack",
        type: "multi-choice",
        title: "Which primary sensing modalities are utilized in your active platform?",
        required: true,
        visibility: "VISIBLE",
        order: 1,
        options: [
          { id: "opt_lidar", label: "Solid-state or Mechanical 3D LiDAR" },
          { id: "opt_camera", label: "Stereo / Monocular HDR Cameras" },
          { id: "opt_radar", label: "Millimeter-Wave (mmWave) Radar" },
          { id: "opt_imu", label: "RTK GNSS / High-precision IMU" },
        ],
      },
      {
        id: "q_compute_latency",
        type: "rating",
        title: "How satisfied are you with on-vehicle edge compute inference latency?",
        description: "1 = Unacceptable latency, 5 = Real-time deterministic performance",
        required: true,
        visibility: "VISIBLE",
        order: 2,
        min: 1,
        max: 5,
        minLabel: "High Latency",
        maxLabel: "Deterministic Real-time",
      },
      {
        id: "q_simulation_platform",
        type: "single-choice",
        title: "What simulation framework do you use for synthetic scenario validation?",
        required: true,
        visibility: "VISIBLE",
        order: 3,
        options: [
          { id: "opt_carla", label: "CARLA Simulator" },
          { id: "opt_isaac", label: "NVIDIA Isaac Sim / Omniverse" },
          { id: "opt_gazebo", label: "ROS Gazebo / Ignition" },
          { id: "opt_custom", label: "Proprietary in-house simulation suite" },
        ],
      },
    ];

    sec3Questions = [
      {
        id: "q_cloud_telemetry",
        type: "yes-no",
        title: "Does your fleet ingest telematics and edge sensor logs into a centralized cloud lake?",
        required: true,
        visibility: "VISIBLE",
        order: 1,
      },
      {
        id: "q_biggest_safety_challenge",
        type: "long-text",
        title: "What represents your biggest edge corner-case or validation obstacle right now?",
        required: false,
        visibility: "VISIBLE",
        order: 2,
        placeholder: "Describe adverse weather, occlusions, sensor calibration drift...",
      },
    ];
  } else {
    // Universal Professional Assessment
    sec1Questions = [
      {
        id: "q_participant_name",
        type: "short-text",
        title: "Your Full Name",
        required: true,
        visibility: "VISIBLE",
        order: 1,
        placeholder: "e.g., Sarah Chen",
      },
      {
        id: "q_participant_email",
        type: "email",
        title: "Work / Professional Email Address",
        description: "Used to authenticate responses and share the final benchmark findings.",
        required: true,
        visibility: "VISIBLE",
        order: 2,
        placeholder: "name@organization.com",
      },
      {
        id: "q_experience_level",
        type: "single-choice",
        title: "What is your seniority or experience level in this domain?",
        required: true,
        visibility: "VISIBLE",
        order: 3,
        options: [
          { id: "opt_1", label: "Entry-level / Associate (0–2 years)" },
          { id: "opt_2", label: "Mid-level Professional (3–5 years)" },
          { id: "opt_3", label: "Senior Lead / Architect (6–10 years)" },
          { id: "opt_4", label: "Executive / Leadership / Founder (10+ years)" },
        ],
      },
    ];

    sec2Questions = [
      {
        id: "q_primary_challenges",
        type: "multi-choice",
        title: "Which operational or technical bottlenecks do you encounter most regularly?",
        description: "Select all that apply to your workflows.",
        required: true,
        visibility: "VISIBLE",
        order: 1,
        options: [
          { id: "opt_manual", label: "Repetitive manual workflows that resist easy automation" },
          { id: "opt_infra", label: "High infrastructure costs and resource allocation delays" },
          { id: "opt_integration", label: "Friction integrating disparate tools and proprietary APIs" },
          { id: "opt_governance", label: "Data privacy, compliance, and governance overhead" },
          { id: "opt_skills", label: "Talent shortage in emerging generative AI architectures" },
        ],
      },
      {
        id: "q_current_satisfaction",
        type: "rating",
        title: "Rate your overall satisfaction with your current toolset and workflow efficiency",
        description: "1 = Completely inadequate, 5 = Best-in-class capability",
        required: true,
        visibility: "VISIBLE",
        order: 2,
        min: 1,
        max: 5,
        minLabel: "Inadequate",
        maxLabel: "Best-in-class",
      },
      {
        id: "q_net_promoter",
        type: "linear-scale",
        title: "How likely are you to recommend modernizing this capability to other teams in your network?",
        description: "0 = Not likely at all, 10 = Extremely likely",
        required: true,
        visibility: "VISIBLE",
        order: 3,
        min: 0,
        max: 10,
        minLabel: "0 - Not Likely",
        maxLabel: "10 - Extremely Likely",
      },
    ];

    sec3Questions = [
      {
        id: "q_strategic_wish",
        type: "long-text",
        title: "If you could eliminate one recurring frustration in your day-to-day work, what would it be?",
        description: "Be as candid and specific as possible.",
        required: false,
        visibility: "VISIBLE",
        order: 1,
        placeholder: "Describe the exact bottleneck or ideal solution...",
      },
      {
        id: "q_pilot_optin",
        type: "yes-no",
        title: "Would you like to participate in an early-access preview of upcoming solutions?",
        required: true,
        visibility: "VISIBLE",
        order: 2,
      },
    ];
  }

  const sections: SurveySection[] = [
    {
      id: "sec_profile",
      title: "1. Professional Profile & Background",
      description: "Contextual information to calibrate your responses against industry benchmarks.",
      order: 1,
      visibility: "VISIBLE",
      questions: sec1Questions,
    },
    {
      id: "sec_assessment",
      title: "2. Deep Evaluation & Operational Bottlenecks",
      description: `Targeted analysis focused on ${prompt.toLowerCase()}.`,
      order: 2,
      visibility: "VISIBLE",
      questions: sec2Questions,
    },
    {
      id: "sec_future",
      title: "3. Strategic Priorities & Next Steps",
      description: "High-leverage opportunities, forward roadmap, and collaborative initiatives.",
      order: 3,
      visibility: "VISIBLE",
      questions: sec3Questions,
    },
  ];

  return {
    id: `surv_${Date.now()}`,
    title: cleanTitle,
    description: `A targeted inquiry examining ${prompt.toLowerCase()} across ${industry}. Designed to capture actionable metrics, structural friction, and qualitative recommendations.`,
    industry,
    status: "DRAFT",
    version: 1,
    sections,
    logic: logicRules,
    settings: {
      allowMultipleResponses: false,
      isAnonymous: false,
      requireEmail: true,
      showProgressIndicator: true,
      showQuestionNumbers: true,
      completionMessage: "Thank you for completing this survey! Your input directly shapes our research roadmap.",
      brandColor: "#0D9488",
    },
  };
}

// Parse document text into structured questions
function parseDocumentToSurvey(rawText: string): Partial<SurveySchema> {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  
  const extractedQuestions: SurveyQuestion[] = [];
  let currentQuestion: Partial<SurveyQuestion> | null = null;
  let qOrder = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line looks like a question (e.g. "1. What is...", "Q2: Rate...", or ends with '?')
    const isNumberedQ = /^(\d+|Q\d+|Question\s*\d+)[\.:\)]\s*/i.test(line);
    const endsWithQ = line.endsWith("?");

    if (isNumberedQ || (endsWithQ && line.length > 15)) {
      if (currentQuestion && currentQuestion.title) {
        extractedQuestions.push(finalizeQuestion(currentQuestion, qOrder++));
      }

      const cleanTitle = line.replace(/^(\d+|Q\d+|Question\s*\d+)[\.:\)]\s*/i, "");
      currentQuestion = {
        id: `q_${qOrder}`,
        title: cleanTitle,
        required: true,
        visibility: "VISIBLE",
        options: [],
      };
    } else if (currentQuestion) {
      // Check if line looks like an option (e.g., "a)", "[ ]", "-", "•")
      const isOption = /^([a-zA-Z\d][\.\)]|[-*•]|\[[ x]?\])\s*/.test(line);
      if (isOption) {
        const optionLabel = line.replace(/^([a-zA-Z\d][\.\)]|[-*•]|\[[ x]?\])\s*/, "");
        if (optionLabel) {
          if (!currentQuestion.options) currentQuestion.options = [];
          currentQuestion.options.push({
            id: `opt_${currentQuestion.options.length + 1}`,
            label: optionLabel,
          });
        }
      } else {
        // Additional description
        if (!currentQuestion.description) {
          currentQuestion.description = line;
        }
      }
    }
  }

  if (currentQuestion && currentQuestion.title) {
    extractedQuestions.push(finalizeQuestion(currentQuestion, qOrder++));
  }

  // If no questions could be parsed from formatting, treat paragraphs as questions
  if (extractedQuestions.length === 0) {
    lines.slice(0, 5).forEach((line, idx) => {
      extractedQuestions.push({
        id: `q_${idx + 1}`,
        type: "short-text",
        title: line,
        required: true,
        visibility: "VISIBLE",
        order: idx + 1,
      });
    });
  }

  return {
    id: `surv_${Date.now()}`,
    title: "Imported Questionnaire",
    description: "Parsed and structured from imported document content.",
    industry: "General",
    status: "DRAFT",
    version: 1,
    sections: [
      {
        id: "sec_imported",
        title: "Imported Questionnaire",
        order: 1,
        visibility: "VISIBLE",
        questions: extractedQuestions,
      },
    ],
    logic: [],
    settings: {
      allowMultipleResponses: false,
      isAnonymous: false,
      requireEmail: true,
      showProgressIndicator: true,
      showQuestionNumbers: true,
      completionMessage: "Thank you for completing this survey!",
      brandColor: "#0D9488",
    },
  };
}

function finalizeQuestion(q: Partial<SurveyQuestion>, order: number): SurveyQuestion {
  let type: SurveyQuestion["type"] = "short-text";

  if (q.options && q.options.length > 0) {
    type = "single-choice";
  } else if (/rate|scale|satisfaction|how much/i.test(q.title || "")) {
    type = "rating";
  } else if (/describe|explain|why|feedback|comment/i.test(q.title || "")) {
    type = "long-text";
  } else if (/email/i.test(q.title || "")) {
    type = "email";
  } else if (/phone|mobile/i.test(q.title || "")) {
    type = "phone";
  } else if (/yes\/no|agree\/disagree/i.test(q.title || "")) {
    type = "yes-no";
  }

  return {
    id: q.id || `q_${order}`,
    type,
    title: q.title || `Question ${order}`,
    description: q.description,
    required: q.required !== undefined ? q.required : true,
    visibility: "VISIBLE",
    options: q.options && q.options.length > 0 ? q.options : undefined,
    min: type === "rating" ? 1 : undefined,
    max: type === "rating" ? 5 : undefined,
    order,
  };
}
