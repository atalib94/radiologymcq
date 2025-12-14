/**
 * Spaced Repetition System using SM-2 Algorithm
 * Includes mastery tracking with "double streak" requirement
 */

export interface SpacedRepetitionData {
  ease_factor: number;
  interval: number;
  next_review: string;
  repetitions: number;
  correct_streak: number;
  total_correct: number;
  mastered: boolean;
}

// Quality ratings for SM-2
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Calculate the next review date and update SM-2 parameters
 * Quality scale:
 * 0 - Complete blackout
 * 1 - Incorrect; remembered upon seeing answer
 * 2 - Incorrect; answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct after hesitation
 * 5 - Perfect response
 */
export function calculateNextReview(
  currentData: Partial<SpacedRepetitionData>,
  isCorrect: boolean
): SpacedRepetitionData {
  // Initialize defaults
  let easeFactor = currentData.ease_factor ?? 2.5;
  let interval = currentData.interval ?? 1;
  let repetitions = currentData.repetitions ?? 0;
  let correctStreak = currentData.correct_streak ?? 0;
  let totalCorrect = currentData.total_correct ?? 0;
  let mastered = currentData.mastered ?? false;

  // Determine quality based on correctness
  // Simplified: correct = quality 4, incorrect = quality 1
  const quality: Quality = isCorrect ? 4 : 1;

  if (isCorrect) {
    // Update mastery tracking
    correctStreak += 1;
    totalCorrect += 1;

    // Check mastery condition: 3+ total correct AND 2+ streak (double streak)
    if (totalCorrect >= 3 && correctStreak >= 2) {
      mastered = true;
    }

    // SM-2 algorithm for correct answers
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Reset streak on incorrect answer
    correctStreak = 0;
    
    // SM-2 algorithm for incorrect answers
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor using SM-2 formula
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ease factor minimum is 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ease_factor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    interval,
    next_review: nextReview.toISOString(),
    repetitions,
    correct_streak: correctStreak,
    total_correct: totalCorrect,
    mastered,
  };
}

/**
 * Check if a question is due for review
 */
export function isDueForReview(nextReview: string | null | undefined): boolean {
  if (!nextReview) return true;
  return new Date(nextReview) <= new Date();
}

/**
 * Get review priority score (lower = more urgent)
 * Considers: overdue days, ease factor, and mastery status
 */
export function getReviewPriority(
  nextReview: string | null | undefined,
  easeFactor: number = 2.5,
  mastered: boolean = false
): number {
  if (mastered) return Infinity; // Mastered items have lowest priority
  
  if (!nextReview) return -Infinity; // Never reviewed = highest priority
  
  const now = new Date();
  const reviewDate = new Date(nextReview);
  const daysDiff = (reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  // Lower ease factor = harder item = higher priority (lower score)
  // More overdue = higher priority (lower score)
  return daysDiff * easeFactor;
}

/**
 * Sort questions by spaced repetition priority
 */
export function sortByReviewPriority<T extends { id: string }>(
  questions: T[],
  progressMap: Map<string, SpacedRepetitionData>
): T[] {
  return [...questions].sort((a, b) => {
    const progressA = progressMap.get(a.id);
    const progressB = progressMap.get(b.id);
    
    const priorityA = getReviewPriority(
      progressA?.next_review,
      progressA?.ease_factor,
      progressA?.mastered
    );
    const priorityB = getReviewPriority(
      progressB?.next_review,
      progressB?.ease_factor,
      progressB?.mastered
    );
    
    return priorityA - priorityB;
  });
}

/**
 * Filter questions that are due for review
 */
export function filterDueForReview<T extends { id: string }>(
  questions: T[],
  progressMap: Map<string, SpacedRepetitionData>,
  includeMastered: boolean = false
): T[] {
  return questions.filter(q => {
    const progress = progressMap.get(q.id);
    
    // Never answered = due
    if (!progress) return true;
    
    // Skip mastered unless explicitly included
    if (progress.mastered && !includeMastered) return false;
    
    return isDueForReview(progress.next_review);
  });
}

/**
 * Filter questions that were previously answered incorrectly
 */
export function filterPreviouslyWrong<T extends { id: string }>(
  questions: T[],
  progressMap: Map<string, { answered_correctly: boolean; total_correct: number; attempts: number }>
): T[] {
  return questions.filter(q => {
    const progress = progressMap.get(q.id);
    if (!progress) return false;
    
    // Include if: ever answered wrong (attempts > total_correct means at least one wrong)
    // OR last answer was wrong
    return !progress.answered_correctly || progress.attempts > progress.total_correct;
  });
}

/**
 * Get mastery status label
 */
export function getMasteryLabel(
  totalCorrect: number,
  correctStreak: number,
  mastered: boolean
): { label: string; color: string; progress: number } {
  if (mastered) {
    return { label: 'Mastered', color: 'green', progress: 100 };
  }
  
  if (totalCorrect === 0) {
    return { label: 'Not started', color: 'gray', progress: 0 };
  }
  
  // Progress towards mastery (need 3 correct with 2 streak)
  const correctProgress = Math.min(totalCorrect, 3) / 3;
  const streakProgress = Math.min(correctStreak, 2) / 2;
  const overallProgress = ((correctProgress + streakProgress) / 2) * 100;
  
  if (totalCorrect >= 3) {
    return { label: `${correctStreak}/2 streak`, color: 'blue', progress: overallProgress };
  }
  
  return { label: `${totalCorrect}/3 correct`, color: 'amber', progress: overallProgress };
}

/**
 * Get human-readable next review time
 */
export function getNextReviewLabel(nextReview: string | null | undefined): string {
  if (!nextReview) return 'Now';
  
  const now = new Date();
  const reviewDate = new Date(nextReview);
  const diffMs = reviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'Now';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
  return `In ${Math.ceil(diffDays / 30)} months`;
}
