-- RANZCR MCQ Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase TEXT NOT NULL CHECK (phase IN ('phase1', 'phase2')),
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mcq' CHECK (type IN ('mcq', 'saq', 'label', 'case')),
  question_text TEXT NOT NULL,
  options JSONB, -- { a: "...", b: "...", c: "...", d: "...", e: "..." }
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  image_url TEXT,
  tags TEXT[],
  difficulty TEXT DEFAULT 'moderate' CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  category TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table with Spaced Repetition and Mastery tracking
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answered_correctly BOOLEAN NOT NULL,
  user_answer TEXT NOT NULL,
  time_spent_seconds INTEGER,
  attempts INTEGER DEFAULT 1,
  last_attempted TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Spaced repetition fields (SM-2 algorithm)
  ease_factor DECIMAL(3,2) DEFAULT 2.50,
  interval INTEGER DEFAULT 1,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  repetitions INTEGER DEFAULT 0,
  -- Mastery tracking
  correct_streak INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  mastered BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, question_id)
);

-- Indexes for better query performance
CREATE INDEX idx_questions_phase ON questions(phase);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_progress_question_id ON user_progress(question_id);

-- Full text search for notes
ALTER TABLE notes ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || content)) STORED;
CREATE INDEX idx_notes_fts ON notes USING GIN(fts);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (optional, for multi-user setup)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for public access (single user mode)
-- For multi-user, you'd want to restrict based on auth.uid()
CREATE POLICY "Allow all access to questions" ON questions FOR ALL USING (true);
CREATE POLICY "Allow all access to notes" ON notes FOR ALL USING (true);
CREATE POLICY "Allow all access to progress" ON user_progress FOR ALL USING (true);

-- Sample questions to get started
INSERT INTO questions (phase, category, type, question_text, options, correct_answer, explanation, tags, difficulty) VALUES
(
  'phase1',
  'anatomy',
  'mcq',
  'Which structure passes through the foramen rotundum?',
  '{"a": "Maxillary nerve (V2)", "b": "Mandibular nerve (V3)", "c": "Ophthalmic nerve (V1)", "d": "Middle meningeal artery"}',
  'a',
  'The foramen rotundum transmits the maxillary nerve (V2), the second division of the trigeminal nerve. The mandibular nerve (V3) passes through the foramen ovale, and the ophthalmic nerve (V1) passes through the superior orbital fissure.',
  ARRAY['skull base', 'cranial nerves', 'foramina'],
  'moderate'
),
(
  'phase1',
  'anatomy',
  'mcq',
  'The celiac trunk typically gives rise to which three arteries?',
  '{"a": "Left gastric, splenic, and common hepatic", "b": "Left gastric, right gastric, and splenic", "c": "Splenic, superior mesenteric, and left gastric", "d": "Common hepatic, superior mesenteric, and splenic"}',
  'a',
  'The celiac trunk (celiac axis) classically branches into three arteries: the left gastric artery, the splenic artery, and the common hepatic artery. This is the classic tripod configuration, though anatomical variants are common.',
  ARRAY['vascular anatomy', 'abdomen', 'arteries'],
  'easy'
),
(
  'phase1',
  'ait',
  'mcq',
  'What is the typical effective dose from a standard chest X-ray (PA view)?',
  '{"a": "0.02 mSv", "b": "0.1 mSv", "c": "1 mSv", "d": "5 mSv"}',
  'a',
  'A standard PA chest X-ray delivers approximately 0.02 mSv effective dose. This is often used as a reference point for comparing radiation doses from other imaging modalities. A CT chest delivers approximately 7 mSv (350x chest X-ray).',
  ARRAY['radiation dose', 'radiation protection', 'chest imaging'],
  'easy'
),
(
  'phase2',
  'radiology',
  'mcq',
  'In a patient with suspected pulmonary embolism, which CT finding is most specific for acute PE?',
  '{"a": "Filling defect within the pulmonary artery", "b": "Mosaic attenuation of lung parenchyma", "c": "Pleural effusion", "d": "Enlarged right ventricle"}',
  'a',
  'A filling defect within the pulmonary artery on CTPA is the most specific finding for acute pulmonary embolism. The defect typically forms an acute angle with the vessel wall. Chronic PE shows obtuse angles and may be calcified or result in web/band formation.',
  ARRAY['PE', 'CTPA', 'chest', 'vascular'],
  'moderate'
),
(
  'phase2',
  'pathology',
  'mcq',
  'Which imaging feature best differentiates hepatocellular carcinoma from metastatic disease on multiphasic CT?',
  '{"a": "Arterial phase hyperenhancement with washout", "b": "Peripheral nodular enhancement", "c": "Central scar", "d": "Capsular retraction"}',
  'a',
  'HCC characteristically shows arterial phase hyperenhancement (due to arterial blood supply) followed by washout in the portal venous or delayed phase. This pattern has high specificity for HCC in the setting of cirrhosis (LI-RADS 5). Metastases typically show rim enhancement.',
  ARRAY['liver', 'HCC', 'oncology', 'contrast enhancement'],
  'moderate'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully with sample questions!';
END $$;
