export type SurveyStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';

export type QuestionType =
  | 'short-text'
  | 'long-text'
  | 'single-choice'
  | 'multi-choice'
  | 'dropdown'
  | 'rating'
  | 'linear-scale'
  | 'yes-no'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'file-upload'
  | 'ranking'
  | 'composite'
  | 'contact';

export interface LogicCondition {
  id: string;
  questionId: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than' | 'is-answered' | 'is-not-answered';
  value?: any;
}

export interface LogicRule {
  id: string;
  action: 'show' | 'hide' | 'skip-to';
  targetId: string; // ID of question or section to show/hide, or destination to skip to
  conditions: LogicCondition[];
  matchType: 'ANY' | 'ALL'; // OR vs AND
}

export interface QuestionOption {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
  value?: string;
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  visibility: 'VISIBLE' | 'HIDDEN' | 'CONDITIONAL';
  options?: QuestionOption[];
  subQuestions?: SurveyQuestion[]; // For composite/contact
  placeholder?: string;
  minLabel?: string; // For scale
  maxLabel?: string; // For scale
  min?: number;
  max?: number;
  order: number;
}

export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  order: number;
  visibility: 'VISIBLE' | 'HIDDEN' | 'CONDITIONAL';
  questions: SurveyQuestion[];
}

export interface CompanyProfile {
  name: string;
  logoUrl?: string;
  industry?: string;
  description?: string;
  website?: string;
  tagline?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  location?: string;
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
}

export interface SurveySettings {
  allowMultipleResponses: boolean;
  isAnonymous: boolean;
  requireEmail: boolean;
  showProgressIndicator: boolean;
  showQuestionNumbers: boolean;
  completionMessage: string;
  redirectUrl?: string;
  brandColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  estCompletionMinutes?: number;
}

export interface SurveySchema {
  id: string;
  slug?: string;
  title: string;
  description: string;
  purpose?: string;
  status: SurveyStatus;
  version: number;
  industry?: string;
  company?: CompanyProfile;
  sections: SurveySection[];
  logic: LogicRule[];
  settings: SurveySettings;
  createdAt: string;
  updatedAt: string;
  responseCount?: number;
}
