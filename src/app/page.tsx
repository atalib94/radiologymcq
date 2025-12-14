'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  Question, 
  Note, 
  UserProgress, 
  QuestionCategory, 
  ExamPhase,
  CATEGORY_INFO 
} from '@/types';

// Icons as inline SVG components
const Icons = {
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Book: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Notes: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

type View = 'dashboard' | 'practice' | 'notes' | 'stats' | 'add-question' | 'add-note';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<ExamPhase | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  
  // Data states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Practice states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  const supabase = createClient();
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    setLoading(true);
    try {
      const [questionsRes, notesRes, progressRes] = await Promise.all([
        supabase.from('questions').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('updated_at', { ascending: false }),
        supabase.from('user_progress').select('*'),
      ]);
      
      if (questionsRes.data) setQuestions(questionsRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      if (progressRes.data) setProgress(progressRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  }
  
  // Filter questions by category
  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (selectedPhase) {
      filtered = filtered.filter(q => q.phase === selectedPhase);
    }
    if (selectedCategory) {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    return filtered;
  }, [questions, selectedPhase, selectedCategory]);
  
  // Filter notes by search
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      n.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);
  
  // Stats calculations
  const stats = useMemo(() => {
    const attempted = progress.length;
    const correct = progress.filter(p => p.answered_correctly).length;
    
    const byCategory: Record<string, { attempted: number; correct: number }> = {};
    
    progress.forEach(p => {
      const question = questions.find(q => q.id === p.question_id);
      if (question) {
        if (!byCategory[question.category]) {
          byCategory[question.category] = { attempted: 0, correct: 0 };
        }
        byCategory[question.category].attempted++;
        if (p.answered_correctly) {
          byCategory[question.category].correct++;
        }
      }
    });
    
    return {
      total: questions.length,
      attempted,
      correct,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
      byCategory,
    };
  }, [questions, progress]);
  
  // Handle answer selection
  async function handleAnswer(answer: string) {
    if (showExplanation) return;
    
    setSelectedAnswer(answer);
    setShowExplanation(true);
    
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;
    
    // Save progress
    try {
      await supabase.from('user_progress').upsert({
        user_id: 'default', // Replace with actual user ID when auth is added
        question_id: currentQuestion.id,
        answered_correctly: isCorrect,
        user_answer: answer,
        attempts: 1,
        last_attempted: new Date().toISOString(),
      });
      
      // Refresh progress
      const { data } = await supabase.from('user_progress').select('*');
      if (data) setProgress(data);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }
  
  function nextQuestion() {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }
  
  function startPractice(phase?: ExamPhase, category?: QuestionCategory) {
    setSelectedPhase(phase || null);
    setSelectedCategory(category || null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentView('practice');
    setSidebarOpen(false);
  }
  
  // Navigation component
  const Navigation = () => (
    <nav className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 border-r border-navy-700 transform transition-transform duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static
    `}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-navy-700">
          <h1 className="text-xl font-bold text-gold-400">RANZCR MCQ</h1>
          <p className="text-sm text-navy-400 mt-1">Exam Practice</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 stagger-children">
          <NavButton icon={<Icons.Home />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} />
          <NavButton icon={<Icons.Book />} label="Practice" active={currentView === 'practice'} onClick={() => startPractice()} />
          <NavButton icon={<Icons.Notes />} label="Notes" active={currentView === 'notes'} onClick={() => { setCurrentView('notes'); setSidebarOpen(false); }} />
          <NavButton icon={<Icons.Chart />} label="Statistics" active={currentView === 'stats'} onClick={() => { setCurrentView('stats'); setSidebarOpen(false); }} />
          
          <div className="pt-4 border-t border-navy-700 mt-4">
            <p className="text-xs text-navy-500 uppercase tracking-wider mb-2">Quick Add</p>
            <NavButton icon={<Icons.Plus />} label="Add Question" onClick={() => { setCurrentView('add-question'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Plus />} label="Add Note" onClick={() => { setCurrentView('add-note'); setSidebarOpen(false); }} />
          </div>
        </div>
        
        <div className="p-4 border-t border-navy-700 text-xs text-navy-500">
          {questions.length} questions · {notes.length} notes
        </div>
      </div>
    </nav>
  );
  
  const NavButton = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
        ${active 
          ? 'bg-gold-400/10 text-gold-400 border border-gold-400/30' 
          : 'text-navy-300 hover:bg-navy-800 hover:text-white'}
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
  
  // Dashboard view
  const DashboardView = () => (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
        <p className="text-navy-400">Continue your RANZCR exam preparation</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Questions" value={stats.total} />
        <StatCard label="Attempted" value={stats.attempted} />
        <StatCard label="Correct" value={stats.correct} />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} highlight />
      </div>
      
      {/* Phase Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Exam Phase</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <PhaseCard 
            phase="phase1"
            title="Phase 1"
            description="Anatomy & Applied Imaging Technology"
            categories={['anatomy', 'ait']}
            onStart={startPractice}
          />
          <PhaseCard 
            phase="phase2"
            title="Phase 2"
            description="Pathology, Clinical Radiology & Vivas"
            categories={['pathology', 'radiology', 'film_reading', 'viva_chest', 'viva_msk', 'viva_neuro', 'viva_abdo', 'viva_paeds', 'viva_breast', 'viva_pathology']}
            onStart={startPractice}
          />
        </div>
      </div>
      
      {/* Recent Notes */}
      {notes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent Notes</h3>
          <div className="space-y-2">
            {notes.slice(0, 3).map(note => (
              <div key={note.id} className="p-3 bg-navy-800/50 rounded-lg border border-navy-700 hover:border-navy-600 transition-colors cursor-pointer">
                <h4 className="font-medium">{note.title}</h4>
                <p className="text-sm text-navy-400 line-clamp-1 mt-1">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  const StatCard = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-gold-400/10 border-gold-400/30' : 'bg-navy-800/50 border-navy-700'}`}>
      <p className="text-sm text-navy-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-gold-400' : 'text-white'}`}>{value}</p>
    </div>
  );
  
  const PhaseCard = ({ phase, title, description, categories, onStart }: {
    phase: ExamPhase;
    title: string;
    description: string;
    categories: QuestionCategory[];
    onStart: (phase: ExamPhase, category?: QuestionCategory) => void;
  }) => {
    const phaseQuestions = questions.filter(q => q.phase === phase);
    
    return (
      <div className="p-5 bg-navy-800/50 rounded-xl border border-navy-700 card-hover">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-lg font-semibold">{title}</h4>
            <p className="text-sm text-navy-400">{description}</p>
          </div>
          <span className="px-2 py-1 bg-navy-700 rounded text-xs">{phaseQuestions.length} Q</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onStart(phase, cat)}
              className="px-2 py-1 text-xs bg-navy-700 hover:bg-navy-600 rounded transition-colors"
            >
              {CATEGORY_INFO[cat].name}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onStart(phase)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold rounded-lg transition-colors"
        >
          Start Practice <Icons.ArrowRight />
        </button>
      </div>
    );
  };
  
  // Practice view
  const PracticeView = () => {
    if (filteredQuestions.length === 0) {
      return (
        <div className="text-center py-12 animate-fadeIn">
          <p className="text-navy-400 mb-4">No questions in this category yet.</p>
          <button
            onClick={() => setCurrentView('add-question')}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold rounded-lg transition-colors"
          >
            Add Question
          </button>
        </div>
      );
    }
    
    const question = filteredQuestions[currentQuestionIndex];
    const progressItem = progress.find(p => p.question_id === question.id);
    
    return (
      <div className="max-w-3xl mx-auto animate-fadeIn">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-navy-400 mb-2">
            <span>{CATEGORY_INFO[question.category].name}</span>
            <span>{currentQuestionIndex + 1} / {filteredQuestions.length}</span>
          </div>
          <div className="h-1 bg-navy-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gold-400 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Question */}
        <div className="p-6 bg-navy-800/50 rounded-xl border border-navy-700 mb-6">
          {question.image_url && (
            <img 
              src={question.image_url} 
              alt="Question image" 
              className="w-full max-h-64 object-contain rounded-lg mb-4 bg-navy-900"
            />
          )}
          <p className="text-lg leading-relaxed">{question.question_text}</p>
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {question.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-navy-700 rounded text-xs text-navy-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Options */}
        {question.options && (
          <div className="space-y-3 mb-6 stagger-children">
            {Object.entries(question.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                disabled={showExplanation}
                className={`
                  option-button
                  ${selectedAnswer === key ? 'selected' : ''}
                  ${showExplanation && key === question.correct_answer ? 'correct' : ''}
                  ${showExplanation && selectedAnswer === key && key !== question.correct_answer ? 'incorrect' : ''}
                `}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-navy-700 mr-3 font-semibold">
                  {key.toUpperCase()}
                </span>
                {value}
              </button>
            ))}
          </div>
        )}
        
        {/* Explanation */}
        {showExplanation && (
          <div className="animate-fadeIn">
            <div className={`p-4 rounded-xl mb-4 ${
              selectedAnswer === question.correct_answer 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <p className="font-semibold mb-2">
                {selectedAnswer === question.correct_answer ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {question.explanation && (
                <p className="text-navy-300">{question.explanation}</p>
              )}
            </div>
            
            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex >= filteredQuestions.length - 1}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-navy-500 text-navy-900 font-semibold rounded-lg transition-colors"
            >
              {currentQuestionIndex < filteredQuestions.length - 1 ? (
                <>Next Question <Icons.ArrowRight /></>
              ) : (
                'Complete!'
              )}
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Notes view
  const NotesView = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notes</h2>
        <button
          onClick={() => setCurrentView('add-note')}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold rounded-lg transition-colors"
        >
          <Icons.Plus /> Add Note
        </button>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Icons.Search />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none transition-colors"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500">
          <Icons.Search />
        </div>
      </div>
      
      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-navy-400">
          {searchQuery ? 'No notes found' : 'No notes yet. Add your first note!'}
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} onDelete={loadData} />
          ))}
        </div>
      )}
    </div>
  );
  
  const NoteCard = ({ note, onDelete }: { note: Note; onDelete: () => void }) => {
    const [expanded, setExpanded] = useState(false);
    
    async function deleteNote() {
      if (!confirm('Delete this note?')) return;
      await supabase.from('notes').delete().eq('id', note.id);
      onDelete();
    }
    
    return (
      <div className="p-4 bg-navy-800/50 rounded-xl border border-navy-700 card-hover">
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="font-semibold cursor-pointer hover:text-gold-400 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {note.title}
          </h3>
          <button onClick={deleteNote} className="text-navy-500 hover:text-red-400 transition-colors">
            <Icons.Trash />
          </button>
        </div>
        
        {note.category && (
          <span className="inline-block px-2 py-0.5 bg-navy-700 rounded text-xs text-navy-300 mb-2">
            {CATEGORY_INFO[note.category as QuestionCategory]?.name || note.category}
          </span>
        )}
        
        <p className={`text-navy-300 ${expanded ? '' : 'line-clamp-2'}`}>{note.content}</p>
        
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {note.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gold-400/10 text-gold-400 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Stats view
  const StatsView = () => (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold">Statistics</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Total Questions" value={stats.total} />
        <StatCard label="Attempted" value={stats.attempted} />
        <StatCard label="Correct" value={stats.correct} />
        <StatCard label="Overall Accuracy" value={`${stats.accuracy}%`} highlight />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Performance by Category</h3>
        <div className="space-y-3">
          {Object.entries(CATEGORY_INFO).map(([cat, info]) => {
            const catStats = stats.byCategory[cat] || { attempted: 0, correct: 0 };
            const accuracy = catStats.attempted > 0 ? Math.round((catStats.correct / catStats.attempted) * 100) : 0;
            const questionCount = questions.filter(q => q.category === cat).length;
            
            if (questionCount === 0) return null;
            
            return (
              <div key={cat} className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium">{info.name}</span>
                    <span className="text-navy-500 text-sm ml-2">({questionCount} questions)</span>
                  </div>
                  <span className={`font-bold ${accuracy >= 70 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {accuracy}%
                  </span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      accuracy >= 70 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <p className="text-xs text-navy-500 mt-1">
                  {catStats.correct} / {catStats.attempted} correct
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  
  // Add Question form
  const AddQuestionView = () => {
    const [formData, setFormData] = useState({
      phase: 'phase1' as ExamPhase,
      category: 'anatomy' as QuestionCategory,
      type: 'mcq' as 'mcq' | 'saq' | 'label' | 'case',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      correct_answer: 'a',
      explanation: '',
      tags: '',
      difficulty: 'moderate' as 'easy' | 'moderate' | 'hard',
    });
    const [submitting, setSubmitting] = useState(false);
    
    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSubmitting(true);
      
      const options = {
        a: formData.option_a,
        b: formData.option_b,
        c: formData.option_c,
        d: formData.option_d,
        ...(formData.option_e && { e: formData.option_e }),
      };
      
      const { error } = await supabase.from('questions').insert({
        phase: formData.phase,
        category: formData.category,
        type: formData.type,
        question_text: formData.question_text,
        options,
        correct_answer: formData.correct_answer,
        explanation: formData.explanation || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
        difficulty: formData.difficulty,
      });
      
      setSubmitting(false);
      
      if (error) {
        alert('Error adding question: ' + error.message);
      } else {
        alert('Question added!');
        loadData();
        setCurrentView('dashboard');
      }
    }
    
    const phaseCategories = formData.phase === 'phase1' 
      ? ['anatomy', 'ait'] 
      : ['pathology', 'radiology', 'film_reading', 'viva_chest', 'viva_msk', 'viva_neuro', 'viva_abdo', 'viva_paeds', 'viva_breast', 'viva_pathology'];
    
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6">Add Question</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1">Phase</label>
              <select
                value={formData.phase}
                onChange={e => {
                  const phase = e.target.value as ExamPhase;
                  setFormData({ 
                    ...formData, 
                    phase,
                    category: (phase === 'phase1' ? 'anatomy' : 'pathology') as QuestionCategory
                  });
                }}
                className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
              >
                <option value="phase1">Phase 1</option>
                <option value="phase2">Phase 2</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-navy-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as QuestionCategory })}
                className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
              >
                {phaseCategories.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_INFO[cat as QuestionCategory].name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-navy-400 mb-1">Question</label>
            <textarea
              required
              rows={3}
              value={formData.question_text}
              onChange={e => setFormData({ ...formData, question_text: e.target.value })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none resize-none"
              placeholder="Enter your question..."
            />
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm text-navy-400">Options</label>
            {['a', 'b', 'c', 'd', 'e'].map(opt => (
              <div key={opt} className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-navy-700 rounded-full font-semibold">
                  {opt.toUpperCase()}
                </span>
                <input
                  type="text"
                  required={opt !== 'e'}
                  value={formData[`option_${opt}` as keyof typeof formData]}
                  onChange={e => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                  className="flex-1 px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
                  placeholder={opt === 'e' ? 'Option E (optional)' : `Option ${opt.toUpperCase()}`}
                />
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-400 mb-1">Correct Answer</label>
              <select
                value={formData.correct_answer}
                onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}
                className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
              >
                {['a', 'b', 'c', 'd', 'e'].map(opt => (
                  <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-navy-400 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-navy-400 mb-1">Explanation (optional)</label>
            <textarea
              rows={2}
              value={formData.explanation}
              onChange={e => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none resize-none"
              placeholder="Explain why this answer is correct..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-navy-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
              placeholder="e.g., chest, CT, lung cancer"
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 text-navy-900 font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Saving...' : 'Add Question'}
          </button>
        </form>
      </div>
    );
  };
  
  // Add Note form
  const AddNoteView = () => {
    const [formData, setFormData] = useState({
      title: '',
      content: '',
      category: '' as QuestionCategory | '',
      tags: '',
    });
    const [submitting, setSubmitting] = useState(false);
    
    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSubmitting(true);
      
      const { error } = await supabase.from('notes').insert({
        user_id: 'default',
        title: formData.title,
        content: formData.content,
        category: formData.category || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
      });
      
      setSubmitting(false);
      
      if (error) {
        alert('Error adding note: ' + error.message);
      } else {
        alert('Note added!');
        loadData();
        setCurrentView('notes');
      }
    }
    
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6">Add Note</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-navy-400 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
              placeholder="Note title..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-navy-400 mb-1">Category (optional)</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as QuestionCategory })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
            >
              <option value="">No category</option>
              {Object.entries(CATEGORY_INFO).map(([cat, info]) => (
                <option key={cat} value={cat}>{info.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-navy-400 mb-1">Content</label>
            <textarea
              required
              rows={8}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none resize-none"
              placeholder="Your notes..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-navy-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none"
              placeholder="e.g., important, review, CT"
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 text-navy-900 font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Saving...' : 'Add Note'}
          </button>
        </form>
      </div>
    );
  };
  
  // Main render
  return (
    <div className="flex min-h-screen">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Navigation />
      
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-navy-950/80 backdrop-blur-lg border-b border-navy-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-navy-800 rounded-lg transition-colors"
            >
              <Icons.Menu />
            </button>
            
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <span className="px-3 py-1 bg-gold-400/10 text-gold-400 rounded-full text-sm font-medium">
                  {CATEGORY_INFO[selectedCategory].name}
                </span>
              )}
            </div>
          </div>
        </header>
        
        {/* Content */}
        <div className="p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'practice' && <PracticeView />}
              {currentView === 'notes' && <NotesView />}
              {currentView === 'stats' && <StatsView />}
              {currentView === 'add-question' && <AddQuestionView />}
              {currentView === 'add-note' && <AddNoteView />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
