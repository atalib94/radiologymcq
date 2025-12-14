'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Question, Note, UserProgress, QuestionCategory, ExamPhase, CATEGORY_INFO } from '@/types';

const Icons = {
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  X: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Book: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Notes: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  ArrowRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Save: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
};

type View = 'dashboard' | 'practice' | 'notes' | 'stats' | 'question-list';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<ExamPhase | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const supabase = createClient();
  
  useEffect(() => { loadData(); }, []);
  
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
    } catch (error) { console.error('Error loading data:', error); }
    setLoading(false);
  }
  
  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (selectedPhase) filtered = filtered.filter(q => q.phase === selectedPhase);
    if (selectedCategory) filtered = filtered.filter(q => q.category === selectedCategory);
    return filtered;
  }, [questions, selectedPhase, selectedCategory]);
  
  const currentQuestion = filteredQuestions[currentQuestionIndex];
  
  const currentQuestionNote = useMemo(() => {
    if (!currentQuestion) return null;
    return notes.find(n => n.question_id === currentQuestion.id);
  }, [notes, currentQuestion]);
  
  useEffect(() => {
    setCurrentNote(currentQuestionNote?.content || '');
  }, [currentQuestionNote, currentQuestionIndex]);
  
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
  }, [notes, searchQuery]);
  
  const stats = useMemo(() => {
    const attempted = progress.length;
    const correct = progress.filter(p => p.answered_correctly).length;
    const byCategory: Record<string, { attempted: number; correct: number }> = {};
    progress.forEach(p => {
      const question = questions.find(q => q.id === p.question_id);
      if (question) {
        if (!byCategory[question.category]) byCategory[question.category] = { attempted: 0, correct: 0 };
        byCategory[question.category].attempted++;
        if (p.answered_correctly) byCategory[question.category].correct++;
      }
    });
    return { total: questions.length, attempted, correct, accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0, byCategory };
  }, [questions, progress]);
  
  async function handleAnswer(answer: string) {
    if (showExplanation) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);
    const isCorrect = answer === currentQuestion.correct_answer;
    try {
      await supabase.from('user_progress').upsert({
        user_id: 'default', question_id: currentQuestion.id, answered_correctly: isCorrect,
        user_answer: answer, attempts: 1, last_attempted: new Date().toISOString(),
      });
      const { data } = await supabase.from('user_progress').select('*');
      if (data) setProgress(data);
    } catch (error) { console.error('Error saving progress:', error); }
  }
  
  function goToQuestion(index: number) {
    if (index >= 0 && index < filteredQuestions.length) {
      setCurrentQuestionIndex(index);
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
    setShowNotePanel(false);
    setCurrentView('practice');
    setSidebarOpen(false);
  }
  
  async function saveNote() {
    if (!currentQuestion || !currentNote.trim()) return;
    setSavingNote(true);
    try {
      if (currentQuestionNote) {
        await supabase.from('notes').update({ content: currentNote, updated_at: new Date().toISOString() }).eq('id', currentQuestionNote.id);
      } else {
        await supabase.from('notes').insert({
          user_id: 'default', question_id: currentQuestion.id, category: currentQuestion.category,
          title: `Note: ${currentQuestion.question_text.substring(0, 50)}...`, content: currentNote,
        });
      }
      const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
      if (data) setNotes(data);
    } catch (error) { console.error('Error saving note:', error); }
    setSavingNote(false);
  }
  
  async function deleteCurrentNote() {
    if (!currentQuestionNote || !confirm('Delete this note?')) return;
    await supabase.from('notes').delete().eq('id', currentQuestionNote.id);
    setCurrentNote('');
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (data) setNotes(data);
  }

  const NavButton = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${active ? 'bg-gold-400/10 text-gold-400 border border-gold-400/30' : 'text-navy-300 hover:bg-navy-800 hover:text-white'}`}>
      {icon}<span className="font-medium">{label}</span>
    </button>
  );

  const StatCard = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-gold-400/10 border-gold-400/30' : 'bg-navy-800/50 border-navy-700'}`}>
      <p className="text-sm text-navy-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-gold-400' : 'text-white'}`}>{value}</p>
    </div>
  );

  const PhaseCard = ({ phase, title, description, categories, onStart }: { phase: ExamPhase; title: string; description: string; categories: QuestionCategory[]; onStart: (phase: ExamPhase, category?: QuestionCategory) => void }) => {
    const phaseQuestions = questions.filter(q => q.phase === phase);
    return (
      <div className="p-5 bg-navy-800/50 rounded-xl border border-navy-700">
        <div className="flex justify-between items-start mb-3">
          <div><h4 className="text-lg font-semibold">{title}</h4><p className="text-sm text-navy-400">{description}</p></div>
          <span className="px-2 py-1 bg-navy-700 rounded text-xs">{phaseQuestions.length} Q</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => {
            const catCount = questions.filter(q => q.category === cat).length;
            if (catCount === 0) return null;
            return <button key={cat} onClick={() => onStart(phase, cat)} className="px-2 py-1 text-xs bg-navy-700 hover:bg-navy-600 rounded transition-colors">{CATEGORY_INFO[cat].name} ({catCount})</button>;
          })}
        </div>
        <button onClick={() => onStart(phase)} disabled={phaseQuestions.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-navy-500 text-navy-900 font-semibold rounded-lg transition-colors">
          Start Practice <Icons.ArrowRight />
        </button>
      </div>
    );
  };

  const DashboardView = () => (
    <div className="space-y-6 animate-fadeIn">
      <div><h2 className="text-2xl font-bold mb-2">Welcome back</h2><p className="text-navy-400">Continue your RANZCR exam preparation</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Questions" value={stats.total} />
        <StatCard label="Attempted" value={stats.attempted} />
        <StatCard label="Correct" value={stats.correct} />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} highlight />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Exam Phase</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <PhaseCard phase="phase1" title="Phase 1" description="Anatomy & Applied Imaging Technology" categories={['anatomy', 'ait']} onStart={startPractice} />
          <PhaseCard phase="phase2" title="Phase 2" description="Pathology, Clinical Radiology & Vivas" categories={['pathology', 'radiology', 'film_reading', 'viva_chest', 'viva_msk', 'viva_neuro', 'viva_abdo', 'viva_paeds', 'viva_breast', 'viva_pathology']} onStart={startPractice} />
        </div>
      </div>
      {notes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent Notes</h3>
          <div className="space-y-2">
            {notes.slice(0, 3).map(note => (
              <div key={note.id} className="p-3 bg-navy-800/50 rounded-lg border border-navy-700">
                <h4 className="font-medium">{note.title}</h4>
                <p className="text-sm text-navy-400 line-clamp-1 mt-1">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const PracticeView = () => {
    if (filteredQuestions.length === 0) {
      return (
        <div className="text-center py-12 animate-fadeIn">
          <p className="text-navy-400 mb-4">No questions in this category yet.</p>
          <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold rounded-lg transition-colors">Back to Dashboard</button>
        </div>
      );
    }
    const question = currentQuestion;
    return (
      <div className="animate-fadeIn">
        <div className="flex gap-4">
          <div className={`flex-1 ${showNotePanel ? 'max-w-2xl' : 'max-w-3xl mx-auto'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentView('question-list')} className="p-2 hover:bg-navy-800 rounded-lg transition-colors" title="Question list"><Icons.List /></button>
                <span className="text-navy-400 text-sm">{CATEGORY_INFO[question.category].name}</span>
              </div>
              <button onClick={() => setShowNotePanel(!showNotePanel)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showNotePanel || currentQuestionNote ? 'bg-gold-400/20 text-gold-400' : 'bg-navy-800 text-navy-300 hover:text-white'}`}>
                <Icons.Notes /><span className="text-sm hidden sm:inline">{currentQuestionNote ? 'View Note' : 'Add Note'}</span>
              </button>
            </div>
            <div className="mb-6">
              <div className="flex justify-between text-sm text-navy-400 mb-2">
                <span>Question {currentQuestionIndex + 1} of {filteredQuestions.length}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / filteredQuestions.length) * 100)}%</span>
              </div>
              <div className="flex gap-1">
                {filteredQuestions.map((q, idx) => {
                  const prog = progress.find(p => p.question_id === q.id);
                  let bgColor = 'bg-navy-700';
                  if (prog) bgColor = prog.answered_correctly ? 'bg-green-500' : 'bg-red-500';
                  if (idx === currentQuestionIndex) bgColor = 'bg-gold-400';
                  return <button key={q.id} onClick={() => goToQuestion(idx)} className={`flex-1 h-2 rounded-full transition-all hover:opacity-80 ${bgColor}`} title={`Question ${idx + 1}`} />;
                })}
              </div>
            </div>
            <div className="p-6 bg-navy-800/50 rounded-xl border border-navy-700 mb-6">
              {question.image_url && <img src={question.image_url} alt="Question" className="w-full max-h-64 object-contain rounded-lg mb-4 bg-navy-900" />}
              <p className="text-lg leading-relaxed">{question.question_text}</p>
              {question.tags && question.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{question.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-navy-700 rounded text-xs text-navy-300">{tag}</span>)}</div>}
            </div>
            {question.options && (
              <div className="space-y-3 mb-6">
                {Object.entries(question.options).map(([key, value]) => (
                  <button key={key} onClick={() => handleAnswer(key)} disabled={showExplanation}
                    className={`option-button ${selectedAnswer === key ? 'selected' : ''} ${showExplanation && key === question.correct_answer ? 'correct' : ''} ${showExplanation && selectedAnswer === key && key !== question.correct_answer ? 'incorrect' : ''}`}>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-navy-700 mr-3 font-semibold flex-shrink-0">{key.toUpperCase()}</span>
                    <span>{value}</span>
                  </button>
                ))}
              </div>
            )}
            {showExplanation && (
              <div className="animate-fadeIn mb-6">
                <div className={`p-4 rounded-xl ${selectedAnswer === question.correct_answer ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  <p className="font-semibold mb-2">{selectedAnswer === question.correct_answer ? '✓ Correct!' : `✗ Incorrect - Answer: ${question.correct_answer.toUpperCase()}`}</p>
                  {question.explanation && <p className="text-navy-300">{question.explanation}</p>}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <button onClick={() => goToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 disabled:opacity-50 rounded-lg transition-colors">
                <Icons.ChevronLeft /><span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-navy-500">{currentQuestionIndex + 1} / {filteredQuestions.length}</span>
              <button onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex >= filteredQuestions.length - 1} className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-navy-500 text-navy-900 font-semibold rounded-lg transition-colors">
                <span className="hidden sm:inline">Next</span><Icons.ChevronRight />
              </button>
            </div>
          </div>
          {showNotePanel && (
            <div className="w-80 flex-shrink-0 hidden lg:block">
              <div className="sticky top-24 p-4 bg-navy-800/50 rounded-xl border border-navy-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gold-400">Question Notes</h3>
                  <button onClick={() => setShowNotePanel(false)} className="p-1 hover:bg-navy-700 rounded transition-colors"><Icons.X /></button>
                </div>
                <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="Add your notes..." className="w-full h-64 p-3 bg-navy-900 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none resize-none text-sm" />
                <div className="flex gap-2 mt-3">
                  <button onClick={saveNote} disabled={savingNote || !currentNote.trim()} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-navy-500 text-navy-900 font-semibold rounded-lg transition-colors text-sm">
                    <Icons.Save />{savingNote ? 'Saving...' : 'Save'}
                  </button>
                  {currentQuestionNote && <button onClick={deleteCurrentNote} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"><Icons.Trash /></button>}
                </div>
                {currentQuestionNote && <p className="text-xs text-navy-500 mt-2">Last saved: {new Date(currentQuestionNote.updated_at).toLocaleString()}</p>}
              </div>
            </div>
          )}
        </div>
        {showNotePanel && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 p-4 bg-navy-900 border-t border-navy-700 rounded-t-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gold-400">Question Notes</h3>
              <button onClick={() => setShowNotePanel(false)} className="p-1 hover:bg-navy-700 rounded"><Icons.X /></button>
            </div>
            <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="Add your notes..." className="w-full h-32 p-3 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none resize-none text-sm" />
            <div className="flex gap-2 mt-3">
              <button onClick={saveNote} disabled={savingNote || !currentNote.trim()} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-navy-500 text-navy-900 font-semibold rounded-lg text-sm">
                <Icons.Save />{savingNote ? 'Saving...' : 'Save Note'}
              </button>
              {currentQuestionNote && <button onClick={deleteCurrentNote} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"><Icons.Trash /></button>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const QuestionListView = () => (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Question List</h2>
          <p className="text-navy-400">{selectedCategory ? CATEGORY_INFO[selectedCategory].name : selectedPhase ? `Phase ${selectedPhase === 'phase1' ? '1' : '2'}` : 'All'} · {filteredQuestions.length} questions</p>
        </div>
        <button onClick={() => setCurrentView('practice')} className="px-4 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors">Back to Practice</button>
      </div>
      <div className="grid gap-3">
        {filteredQuestions.map((q, idx) => {
          const prog = progress.find(p => p.question_id === q.id);
          const note = notes.find(n => n.question_id === q.id);
          return (
            <button key={q.id} onClick={() => { setCurrentQuestionIndex(idx); setSelectedAnswer(null); setShowExplanation(false); setCurrentView('practice'); }}
              className={`w-full text-left p-4 rounded-xl border transition-all hover:border-navy-500 ${idx === currentQuestionIndex ? 'bg-gold-400/10 border-gold-400/30' : 'bg-navy-800/50 border-navy-700'}`}>
              <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${prog ? prog.answered_correctly ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400' : 'bg-navy-700 text-navy-400'}`}>{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {q.difficulty && <span className={`px-2 py-0.5 rounded text-xs ${q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' : q.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{q.difficulty}</span>}
                    {note && <span className="px-2 py-0.5 bg-gold-400/20 text-gold-400 rounded text-xs">Has note</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const NotesView = () => (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold">All Notes</h2>
      <div className="relative">
        <input type="text" placeholder="Search notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none" />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500"><Icons.Search /></div>
      </div>
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-navy-400">{searchQuery ? 'No notes found' : 'No notes yet. Add notes while practicing!'}</div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map(note => {
            const linkedQuestion = questions.find(q => q.id === note.question_id);
            return (
              <div key={note.id} className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{note.title}</h3>
                  <button onClick={async () => { if (confirm('Delete?')) { await supabase.from('notes').delete().eq('id', note.id); loadData(); }}} className="text-navy-500 hover:text-red-400"><Icons.Trash /></button>
                </div>
                {note.category && <span className="inline-block px-2 py-0.5 bg-navy-700 rounded text-xs text-navy-300 mb-2">{CATEGORY_INFO[note.category as QuestionCategory]?.name}</span>}
                <p className="text-navy-300 line-clamp-3">{note.content}</p>
                {linkedQuestion && (
                  <button onClick={() => { setSelectedPhase(linkedQuestion.phase); setSelectedCategory(linkedQuestion.category as QuestionCategory); const filtered = questions.filter(q => q.phase === linkedQuestion.phase && q.category === linkedQuestion.category); const idx = filtered.findIndex(q => q.id === linkedQuestion.id); if (idx >= 0) { setCurrentQuestionIndex(idx); setCurrentView('practice'); }}} className="mt-3 text-sm text-gold-400 hover:text-gold-300">→ Go to question</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const StatsView = () => (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold">Statistics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Questions" value={stats.total} />
        <StatCard label="Attempted" value={stats.attempted} />
        <StatCard label="Correct" value={stats.correct} />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} highlight />
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
                  <div><span className="font-medium">{info.name}</span><span className="text-navy-500 text-sm ml-2">({questionCount} questions)</span></div>
                  <span className={`font-bold ${accuracy >= 70 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : catStats.attempted > 0 ? 'text-red-400' : 'text-navy-500'}`}>{catStats.attempted > 0 ? `${accuracy}%` : '-'}</span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${accuracy >= 70 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${accuracy}%` }} />
                </div>
                <p className="text-xs text-navy-500 mt-1">{catStats.correct} / {catStats.attempted} correct</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 border-r border-navy-700 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-navy-700"><h1 className="text-xl font-bold text-gold-400">RANZCR MCQ</h1><p className="text-sm text-navy-400 mt-1">Exam Practice</p></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavButton icon={<Icons.Home />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Book />} label="Practice" active={currentView === 'practice'} onClick={() => startPractice()} />
            <NavButton icon={<Icons.Notes />} label="All Notes" active={currentView === 'notes'} onClick={() => { setCurrentView('notes'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Chart />} label="Statistics" active={currentView === 'stats'} onClick={() => { setCurrentView('stats'); setSidebarOpen(false); }} />
          </div>
          <div className="p-4 border-t border-navy-700 text-xs text-navy-500">{questions.length} questions · {notes.length} notes</div>
        </div>
      </nav>
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-navy-950/80 backdrop-blur-lg border-b border-navy-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-navy-800 rounded-lg"><Icons.Menu /></button>
            {selectedCategory && currentView === 'practice' && <span className="px-3 py-1 bg-gold-400/10 text-gold-400 rounded-full text-sm font-medium">{CATEGORY_INFO[selectedCategory].name}</span>}
          </div>
        </header>
        <div className="p-4 lg:p-8">
          {loading ? <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div> : (
            <>{currentView === 'dashboard' && <DashboardView />}{currentView === 'practice' && <PracticeView />}{currentView === 'question-list' && <QuestionListView />}{currentView === 'notes' && <NotesView />}{currentView === 'stats' && <StatsView />}</>
          )}
        </div>
      </main>
    </div>
  );
}
