export type RespondentType = 'student' | 'faculty' | 'tpo' | 'admin';

export type QuestionType =
  | 'single-choice'
  | 'multi-choice'
  | 'scale'
  | 'ranking'
  | 'text'
  | 'composite'
  | 'contact';

export interface QuestionOption {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

export interface SubQuestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single-choice' | 'multi-choice' | 'text' | 'scale';
  options?: QuestionOption[];
  placeholder?: string;
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  condition?: (answers: Record<string, any>) => boolean;
  required?: boolean;
}

export interface QuestionDefinition {
  id: string; // e.g. 'gate', 'D1', 'D2', etc.
  stepNumber: number; // 1..10
  sectionCode: string; // 'D', 'B', 'C', 'A'
  sectionName: string; // 'Student / Club Lead', 'HOD / Faculty', etc.
  tag: string; // Category pill, e.g. 'Context', 'Pain Points', 'Solution Fit', etc.
  title: string | ((answers: Record<string, any>) => string);
  subtitle?: string | ((answers: Record<string, any>) => string);
  helperText?: string;
  type: QuestionType;
  options?: QuestionOption[];
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  subQuestions?: SubQuestion[];
  linkReason?: string;
  feedsDecision?: string;
  getNextQuestionId?: (currentAnswer: any, allAnswers: Record<string, any>) => string | null;
}

export interface SurveyPathStep {
  questionId: string;
  stepNumber: number;
  questionTitle: string;
  answerSummary: string;
  rawAnswer: any;
}

export interface SurveyResponse {
  id: string;
  respondent_type: RespondentType;
  respondent_type_label: string;
  respondent_name: string;
  college: string;
  department?: string;
  role?: string;
  email: string;
  phone: string;
  answers: Record<string, any>;
  survey_path: SurveyPathStep[];
  pilot_interest: boolean | string | string[] | any;
  consent: boolean;
  created_at: string;
  time_spent_seconds?: number;
  metadata?: {
    browser?: string;
    os?: string;
    referrer?: string;
    completedAt?: string;
    [key: string]: any;
  };
}

export interface SurveySummaryStats {
  totalResponses: number;
  studentCount: number;
  facultyCount: number;
  tpoCount: number;
  adminCount: number;
  pilotInterestCount: number;
  pilotInterestRate: number;
  topRequestedSupport: Array<{ name: string; count: number; percentage: number }>;
  topPainPoints: Array<{ name: string; count: number; percentage: number }>;
  willingnessToPay: Array<{ range: string; count: number }>;
  timelineSatisfaction: Array<{ status: string; count: number }>;
  recentResponses: SurveyResponse[];
}
