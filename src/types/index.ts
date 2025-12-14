export type ExamPhase = 'phase1' | 'phase2';

export type QuestionCategory = 
  | 'anatomy'
  | 'ait'
  | 'pathology'
  | 'radiology'
  | 'radioclinical';

export type Subspecialty = 
  | 'chest'
  | 'cardiac'
  | 'msk'
  | 'neuro'
  | 'ent'
  | 'abdo'
  | 'gu'
  | 'gynae'
  | 'breast'
  | 'paeds'
  | 'vascular'
  | 'interventional'
  | 'nuclear'
  | 'general';

export const CATEGORY_INFO: Record<QuestionCategory, { name: string; description: string; phase: ExamPhase }> = {
  anatomy: { 
    name: 'Anatomy', 
    description: 'Radiological anatomy across all modalities',
    phase: 'phase1'
  },
  ait: { 
    name: 'Applied Imaging Technology', 
    description: 'Physics, radiation protection, and imaging technology',
    phase: 'phase1'
  },
  pathology: { 
    name: 'Pathology', 
    description: 'General and systemic pathology relevant to radiology',
    phase: 'phase2'
  },
  radiology: { 
    name: 'Radiology', 
    description: 'Image interpretation and radiological signs',
    phase: 'phase2'
  },
  radioclinical: { 
    name: 'Radioclinical Correlation', 
    description: 'Clinical relevance of imaging findings, management and indications',
    phase: 'phase2'
  },
};

export const SUBSPECIALTY_INFO: Record<Subspecialty, { name: string; icon?: string }> = {
  chest: { name: 'Chest' },
  cardiac: { name: 'Cardiac' },
  msk: { name: 'MSK' },
  neuro: { name: 'Neuro' },
  ent: { name: 'ENT / Head & Neck' },
  abdo: { name: 'Abdominal' },
  gu: { name: 'Genitourinary' },
  gynae: { name: 'Gynaecology' },
  breast: { name: 'Breast' },
  paeds: { name: 'Paediatrics' },
  vascular: { name: 'Vascular' },
  interventional: { name: 'Interventional' },
  nuclear: { name: 'Nuclear Medicine' },
  general: { name: 'General' },
};

export interface Question {
  id: string;
  phase: ExamPhase;
  category: QuestionCategory;
  subspecialties: Subspecialty[];
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  image_url?: string;
  tags?: string[];
  difficulty: 'easy' | 'moderate' | 'hard';
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  question_id?: string;
  category?: QuestionCategory;
  title: string;
  content: string;
  tags?: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: string;
  answered_correctly: boolean;
  user_answer: string;
  attempts: number;
  last_attempted: string;
}
