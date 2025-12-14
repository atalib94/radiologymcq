// RANZCR Examination Structure Types

export type ExamPhase = 'phase1' | 'phase2';

export type Phase1Category = 
  | 'anatomy'           // Anatomy examination
  | 'ait';              // Applied Imaging Technology

export type Phase2Category = 
  | 'pathology'         // Pathology MCQs and SAQs
  | 'radiology'         // Clinical Radiology MCQs
  | 'film_reading'      // e-Film Reading (case-based)
  | 'viva_chest'        // Viva - Chest
  | 'viva_msk'          // Viva - Musculoskeletal
  | 'viva_neuro'        // Viva - Neuroradiology
  | 'viva_abdo'         // Viva - Abdominal
  | 'viva_paeds'        // Viva - Paediatrics
  | 'viva_breast'       // Viva - Breast
  | 'viva_pathology';   // Viva - Pathology

export type QuestionCategory = Phase1Category | Phase2Category;

export type QuestionType = 
  | 'mcq'               // Multiple Choice Question
  | 'saq'               // Short Answer Question
  | 'label'             // Image Labeling
  | 'case';             // Case-based question

export interface Question {
  id: string;
  phase: ExamPhase;
  category: QuestionCategory;
  type: QuestionType;
  question_text: string;
  options?: {
    a: string;
    b: string;
    c: string;
    d: string;
    e?: string;
  };
  correct_answer: string;
  explanation?: string;
  image_url?: string;
  tags?: string[];
  difficulty?: 'easy' | 'moderate' | 'hard';
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: string;
  answered_correctly: boolean;
  user_answer: string;
  time_spent_seconds?: number;
  attempts: number;
  last_attempted: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  question_id?: string;
  category?: QuestionCategory;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_questions: number;
  questions_attempted: number;
  questions_correct: number;
  accuracy_percentage: number;
  by_phase: {
    phase1: { attempted: number; correct: number };
    phase2: { attempted: number; correct: number };
  };
  by_category: Record<QuestionCategory, { attempted: number; correct: number }>;
}

// Category display names and descriptions
export const CATEGORY_INFO: Record<QuestionCategory, { name: string; description: string; phase: ExamPhase }> = {
  // Phase 1
  anatomy: {
    name: 'Anatomy',
    description: 'Radiological anatomy across all imaging modalities',
    phase: 'phase1'
  },
  ait: {
    name: 'Applied Imaging Technology',
    description: 'Physics, radiation protection, and imaging technology',
    phase: 'phase1'
  },
  // Phase 2
  pathology: {
    name: 'Pathology',
    description: 'Pathology MCQs and SAQs',
    phase: 'phase2'
  },
  radiology: {
    name: 'Clinical Radiology',
    description: 'Clinical radiology MCQs',
    phase: 'phase2'
  },
  film_reading: {
    name: 'Film Reading',
    description: 'Case-based film reading questions',
    phase: 'phase2'
  },
  viva_chest: {
    name: 'Viva - Chest',
    description: 'Chest radiology oral examination cases',
    phase: 'phase2'
  },
  viva_msk: {
    name: 'Viva - MSK',
    description: 'Musculoskeletal radiology oral examination cases',
    phase: 'phase2'
  },
  viva_neuro: {
    name: 'Viva - Neuroradiology',
    description: 'Neuroradiology oral examination cases',
    phase: 'phase2'
  },
  viva_abdo: {
    name: 'Viva - Abdominal',
    description: 'Abdominal radiology oral examination cases',
    phase: 'phase2'
  },
  viva_paeds: {
    name: 'Viva - Paediatrics',
    description: 'Paediatric radiology oral examination cases',
    phase: 'phase2'
  },
  viva_breast: {
    name: 'Viva - Breast',
    description: 'Breast imaging oral examination cases',
    phase: 'phase2'
  },
  viva_pathology: {
    name: 'Viva - Pathology',
    description: 'Pathology oral examination cases',
    phase: 'phase2'
  },
};
