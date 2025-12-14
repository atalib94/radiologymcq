-- Migration: Add Spaced Repetition and Mastery Tracking to user_progress
-- Run this SQL in Supabase SQL Editor to update existing tables

-- Add spaced repetition columns
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS ease_factor DECIMAL(3,2) DEFAULT 2.50,
ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_review TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS repetitions INTEGER DEFAULT 0;

-- Add mastery tracking columns
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS correct_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mastered BOOLEAN DEFAULT FALSE;

-- Update existing records with sensible defaults based on their history
UPDATE user_progress 
SET 
  ease_factor = COALESCE(ease_factor, 2.50),
  interval = COALESCE(interval, CASE WHEN answered_correctly THEN 1 ELSE 1 END),
  next_review = COALESCE(next_review, NOW()),
  repetitions = COALESCE(repetitions, CASE WHEN answered_correctly THEN 1 ELSE 0 END),
  correct_streak = COALESCE(correct_streak, CASE WHEN answered_correctly THEN 1 ELSE 0 END),
  total_correct = COALESCE(total_correct, CASE WHEN answered_correctly THEN 1 ELSE 0 END),
  mastered = COALESCE(mastered, FALSE)
WHERE ease_factor IS NULL OR interval IS NULL;

-- Create index for efficient spaced repetition queries
CREATE INDEX IF NOT EXISTS idx_progress_next_review ON user_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_progress_mastered ON user_progress(mastered);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Spaced repetition and mastery tracking columns added!';
END $$;
