'use client';
import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { createClient } from '@/lib/supabase';
import { Question, Note, UserProgress, QuestionCategory, Subspecialty, CATEGORY_INFO, SUBSPECIALTY_INFO } from '@/types';

const Icons = {
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  X: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Book: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Notes: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Play: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Save: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Image: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
};

const NavButton = memo(({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${active ? 'bg-gold-400/10 text-gold-400 border border-gold-400/30' : 'text-navy-300 hover:bg-navy-800 hover:text-white'}`}>{icon}<span className="font-medium">{label}</span></button>
));
NavButton.displayName = 'NavButton';

const StatCard = memo(({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
  <div className={`p-4 rounded-xl border ${highlight ? 'bg-gold-400/10 border-gold-400/30' : 'bg-navy-800/50 border-navy-700'}`}>
    <p className="text-sm text-navy-400">{label}</p><p className={`text-2xl font-bold mt-1 ${highlight ? 'text-gold-400' : 'text-white'}`}>{value}</p>
  </div>
));
StatCard.displayName = 'StatCard';

const Lightbox = memo(({ src, onClose }: { src: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"><Icons.X /></button>
    <img src={src} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
  </div>
));
Lightbox.displayName = 'Lightbox';

const ChipSelect = memo(({ options, selected, onChange, label }: { 
  options: { key: string; label: string }[]; 
  selected: string[]; 
  onChange: (selected: string[]) => void;
  label: string;
}) => {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };
  const selectAll = () => onChange(options.map(o => o.key));
  const selectNone = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-navy-300">{label}</span>
        <div className="flex gap-2 text-xs">
          <button onClick={selectAll} className="text-gold-400 hover:text-gold-300">All</button>
          <button onClick={selectNone} className="text-navy-400 hover:text-navy-300">None</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => toggle(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              selected.includes(opt.key)
                ? 'bg-gold-400 text-navy-900 font-medium'
                : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
});
ChipSelect.displayName = 'ChipSelect';

type View = 'dashboard' | 'quiz-setup' | 'practice' | 'notes' | 'stats' | 'question-list';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quiz setup
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubspecialties, setSelectedSubspecialties] = useState<string[]>([]);
  
  // Practice state
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [currentNoteImages, setCurrentNoteImages] = useState<string[]>([]);
  const [savingNote, setSavingNote] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, nRes, pRes] = await Promise.all([
        supabase.from('questions').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('updated_at', { ascending: false }),
        supabase.from('user_progress').select('*'),
      ]);
      if (qRes.data) setQuestions(qRes.data);
      if (nRes.data) setNotes(nRes.data);
      if (pRes.data) setProgress(pRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  const currentQuestionNote = useMemo(() => {
    if (!currentQuestion) return null;
    return notes.find(n => n.question_id === currentQuestion.id) || null;
  }, [notes, currentQuestion]);

  useEffect(() => {
    setCurrentNote(currentQuestionNote?.content || '');
    setCurrentNoteImages(currentQuestionNote?.images || []);
  }, [currentQuestionNote]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [notes, searchQuery]);

  const stats = useMemo(() => {
    const attempted = progress.length;
    const correct = progress.filter(p => p.answered_correctly).length;
    const byCategory: Record<string, { attempted: number; correct: number }> = {};
    const bySubspecialty: Record<string, { attempted: number; correct: number }> = {};
    
    progress.forEach(p => {
      const question = questions.find(q => q.id === p.question_id);
      if (question) {
        if (!byCategory[question.category]) byCategory[question.category] = { attempted: 0, correct: 0 };
        byCategory[question.category].attempted++;
        if (p.answered_correctly) byCategory[question.category].correct++;
        
        question.subspecialties?.forEach(sub => {
          if (!bySubspecialty[sub]) bySubspecialty[sub] = { attempted: 0, correct: 0 };
          bySubspecialty[sub].attempted++;
          if (p.answered_correctly) bySubspecialty[sub].correct++;
        });
      }
    });
    return { total: questions.length, attempted, correct, accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0, byCategory, bySubspecialty };
  }, [questions, progress]);

  // Count questions per category and subspecialty
  const questionCounts = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const bySubspecialty: Record<string, number> = {};
    
    questions.forEach(q => {
      byCategory[q.category] = (byCategory[q.category] || 0) + 1;
      q.subspecialties?.forEach(sub => {
        bySubspecialty[sub] = (bySubspecialty[sub] || 0) + 1;
      });
    });
    
    return { byCategory, bySubspecialty };
  }, [questions]);

  // Available questions based on selection
  const availableQuestions = useMemo(() => {
    return questions.filter(q => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(q.category);
      const subspecialtyMatch = selectedSubspecialties.length === 0 || 
        q.subspecialties?.some(sub => selectedSubspecialties.includes(sub));
      return categoryMatch && subspecialtyMatch;
    });
  }, [questions, selectedCategories, selectedSubspecialties]);

  const handleAnswer = useCallback(async (answer: string) => {
    if (showExplanation || !currentQuestion) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);
    try {
      await supabase.from('user_progress').upsert({
        user_id: 'default', question_id: currentQuestion.id, answered_correctly: answer === currentQuestion.correct_answer,
        user_answer: answer, attempts: 1, last_attempted: new Date().toISOString(),
      });
      const { data } = await supabase.from('user_progress').select('*');
      if (data) setProgress(data);
    } catch (e) { console.error(e); }
  }, [showExplanation, currentQuestion, supabase]);

  const goToQuestion = useCallback((i: number) => {
    if (i >= 0 && i < quizQuestions.length) {
      setCurrentQuestionIndex(i);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }, [quizQuestions.length]);

  const startQuiz = useCallback(() => {
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowNotePanel(false);
    setCurrentView('practice');
    setSidebarOpen(false);
  }, [availableQuestions]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('note-images').upload(name, file);
    if (error) return null;
    return supabase.storage.from('note-images').getPublicUrl(name).data.publicUrl;
  }, [supabase]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadingImage(true);
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(files[i]);
      if (url) urls.push(url);
    }
    setCurrentNoteImages(prev => [...prev, ...urls]);
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadImage]);

  const saveNote = useCallback(async () => {
    if (!currentQuestion || (!currentNote.trim() && currentNoteImages.length === 0)) return;
    setSavingNote(true);
    try {
      if (currentQuestionNote) {
        await supabase.from('notes').update({ content: currentNote, images: currentNoteImages, updated_at: new Date().toISOString() }).eq('id', currentQuestionNote.id);
      } else {
        await supabase.from('notes').insert({ user_id: 'default', question_id: currentQuestion.id, category: currentQuestion.category, title: `Note: ${currentQuestion.question_text.substring(0, 50)}...`, content: currentNote, images: currentNoteImages });
      }
      const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
      if (data) setNotes(data);
    } catch (e) { console.error(e); }
    setSavingNote(false);
  }, [currentQuestion, currentNote, currentNoteImages, currentQuestionNote, supabase]);

  const deleteCurrentNote = useCallback(async () => {
    if (!currentQuestionNote || !confirm('Delete?')) return;
    await supabase.from('notes').delete().eq('id', currentQuestionNote.id);
    setCurrentNote('');
    setCurrentNoteImages([]);
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (data) setNotes(data);
  }, [currentQuestionNote, supabase]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentNote(e.target.value), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
  const removeNoteImage = useCallback((index: number) => setCurrentNoteImages(prev => prev.filter((_, i) => i !== index)), []);
  const closeLightbox = useCallback(() => setLightboxImage(null), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const toggleNotePanel = useCallback(() => setShowNotePanel(prev => !prev), []);
  const closeNotePanel = useCallback(() => setShowNotePanel(false), []);
  const openFileInput = useCallback(() => fileInputRef.current?.click(), []);

  const goToDashboard = useCallback(() => { setCurrentView('dashboard'); setSidebarOpen(false); }, []);
  const goToQuizSetup = useCallback(() => { setCurrentView('quiz-setup'); setSidebarOpen(false); }, []);
  const goToNotes = useCallback(() => { setCurrentView('notes'); setSidebarOpen(false); }, []);
  const goToStats = useCallback(() => { setCurrentView('stats'); setSidebarOpen(false); }, []);
  const goToQuestionList = useCallback(() => setCurrentView('question-list'), []);
  const goToPractice = useCallback(() => setCurrentView('practice'), []);

  const categoryOptions = useMemo(() => 
    Object.entries(CATEGORY_INFO).map(([key, info]) => ({
      key,
      label: `${info.name} (${questionCounts.byCategory[key] || 0})`
    })), [questionCounts.byCategory]);

  const subspecialtyOptions = useMemo(() => 
    Object.entries(SUBSPECIALTY_INFO).map(([key, info]) => ({
      key,
      label: `${info.name} (${questionCounts.bySubspecialty[key] || 0})`
    })).filter(opt => questionCounts.bySubspecialty[opt.key] > 0), [questionCounts.bySubspecialty]);

  const renderProgressBar = useMemo(() => (
    <div className="flex gap-1">
      {quizQuestions.map((fq, i) => {
        const p = progress.find(pr => pr.question_id === fq.id);
        let bg = 'bg-navy-700';
        if (p) bg = p.answered_correctly ? 'bg-green-500' : 'bg-red-500';
        if (i === currentQuestionIndex) bg = 'bg-gold-400';
        return <button key={fq.id} onClick={() => goToQuestion(i)} className={`flex-1 h-2 rounded-full hover:opacity-80 ${bg}`} />;
      })}
    </div>
  ), [quizQuestions, progress, currentQuestionIndex, goToQuestion]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {lightboxImage && <Lightbox src={lightboxImage} onClose={closeLightbox} />}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />}
      
      <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 border-r border-navy-700 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-navy-700">
            <h1 className="text-xl font-bold text-gold-400">RANZCR MCQ</h1>
            <p className="text-sm text-navy-400 mt-1">Exam Practice</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavButton icon={<Icons.Home />} label="Dashboard" active={currentView === 'dashboard'} onClick={goToDashboard} />
            <NavButton icon={<Icons.Play />} label="Start Quiz" active={currentView === 'quiz-setup' || currentView === 'practice'} onClick={goToQuizSetup} />
            <NavButton icon={<Icons.Notes />} label="Notes" active={currentView === 'notes'} onClick={goToNotes} />
            <NavButton icon={<Icons.Chart />} label="Stats" active={currentView === 'stats'} onClick={goToStats} />
          </div>
          <div className="p-4 border-t border-navy-700 text-xs text-navy-500">{questions.length} questions · {notes.length} notes</div>
        </div>
      </nav>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-navy-950/80 backdrop-blur-lg border-b border-navy-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={openSidebar} className="lg:hidden p-2 hover:bg-navy-800 rounded-lg"><Icons.Menu /></button>
            {currentView === 'practice' && quizQuestions.length > 0 && (
              <span className="px-3 py-1 bg-gold-400/10 text-gold-400 rounded-full text-sm">
                {CATEGORY_INFO[currentQuestion?.category]?.name}
                {currentQuestion?.subspecialties?.length > 0 && ` · ${SUBSPECIALTY_INFO[currentQuestion.subspecialties[0]]?.name}`}
              </span>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Dashboard */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold mb-2">Welcome back</h2><p className="text-navy-400">Continue your RANZCR exam preparation</p></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Questions" value={stats.total} />
                <StatCard label="Attempted" value={stats.attempted} />
                <StatCard label="Correct" value={stats.correct} />
                <StatCard label="Accuracy" value={`${stats.accuracy}%`} highlight />
              </div>
              
              <div className="p-6 bg-navy-800/50 rounded-xl border border-navy-700">
                <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                    const count = questionCounts.byCategory[key] || 0;
                    return (
                      <button
                        key={key}
                        onClick={() => { setSelectedCategories([key]); setSelectedSubspecialties([]); goToQuizSetup(); }}
                        disabled={count === 0}
                        className="p-4 bg-navy-800 hover:bg-navy-700 disabled:opacity-50 disabled:hover:bg-navy-800 rounded-lg text-left transition-colors"
                      >
                        <div className="font-medium">{info.name}</div>
                        <div className="text-sm text-navy-400">{count} questions</div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={goToQuizSetup}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold rounded-lg transition-colors"
                >
                  <Icons.Play /> Custom Quiz
                </button>
              </div>
            </div>
          )}

          {/* Quiz Setup */}
          {currentView === 'quiz-setup' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div><h2 className="text-2xl font-bold mb-2">Start a Quiz</h2><p className="text-navy-400">Select categories and subspecialties to practice</p></div>
              
              <div className="p-6 bg-navy-800/50 rounded-xl border border-navy-700 space-y-6">
                <ChipSelect
                  label="Categories"
                  options={categoryOptions}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                />
                
                {subspecialtyOptions.length > 0 && (
                  <ChipSelect
                    label="Subspecialties (optional)"
                    options={subspecialtyOptions}
                    selected={selectedSubspecialties}
                    onChange={setSelectedSubspecialties}
                  />
                )}
                
                <div className="pt-4 border-t border-navy-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-navy-300">Available questions:</span>
                    <span className="text-2xl font-bold text-gold-400">{availableQuestions.length}</span>
                  </div>
                  
                  <button
                    onClick={startQuiz}
                    disabled={availableQuestions.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-navy-500 text-navy-900 font-semibold rounded-lg transition-colors"
                  >
                    <Icons.Play /> Start Quiz ({availableQuestions.length} questions)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Practice */}
          {currentView === 'practice' && (
            <>
              {quizQuestions.length === 0 ? (
                <div className="text-center py-12"><p className="text-navy-400 mb-4">No questions selected.</p><button onClick={goToQuizSetup} className="px-4 py-2 bg-gold-500 text-navy-900 font-semibold rounded-lg">Setup Quiz</button></div>
              ) : (
                <div className="flex gap-4">
                  <div className={`flex-1 ${showNotePanel ? 'max-w-2xl' : 'max-w-3xl mx-auto'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <button onClick={goToQuestionList} className="p-2 hover:bg-navy-800 rounded-lg"><Icons.List /></button>
                        <div className="flex flex-wrap gap-1">
                          {currentQuestion?.subspecialties?.map(sub => (
                            <span key={sub} className="px-2 py-0.5 bg-navy-700 rounded text-xs text-navy-300">{SUBSPECIALTY_INFO[sub]?.name}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={toggleNotePanel} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${showNotePanel || currentQuestionNote ? 'bg-gold-400/20 text-gold-400' : 'bg-navy-800 text-navy-300'}`}>
                        <Icons.Notes /><span className="text-sm hidden sm:inline">{currentQuestionNote ? `Note` : 'Add Note'}</span>
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-navy-400 mb-2"><span>Q {currentQuestionIndex + 1}/{quizQuestions.length}</span><span>{CATEGORY_INFO[currentQuestion?.category]?.name}</span></div>
                      {renderProgressBar}
                    </div>
                    
                    <div className="p-6 bg-navy-800/50 rounded-xl border border-navy-700 mb-6">
                      {currentQuestion?.image_url && <img src={currentQuestion.image_url} alt="" className="w-full max-h-64 object-contain rounded-lg mb-4 bg-navy-900 cursor-pointer" onClick={() => setLightboxImage(currentQuestion.image_url!)} />}
                      <p className="text-lg">{currentQuestion?.question_text}</p>
                      {currentQuestion?.tags && currentQuestion.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{currentQuestion.tags.map(t => <span key={t} className="px-2 py-0.5 bg-navy-700 rounded text-xs text-navy-300">{t}</span>)}</div>}
                    </div>
                    
                    {currentQuestion?.options && (
                      <div className="space-y-3 mb-6">
                        {Object.entries(currentQuestion.options).map(([k, v]) => (
                          <button key={k} onClick={() => handleAnswer(k)} disabled={showExplanation}
                            className={`option-button ${selectedAnswer === k ? 'selected' : ''} ${showExplanation && k === currentQuestion.correct_answer ? 'correct' : ''} ${showExplanation && selectedAnswer === k && k !== currentQuestion.correct_answer ? 'incorrect' : ''}`}>
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-navy-700 mr-3 font-semibold">{k.toUpperCase()}</span>
                            <span>{v}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {showExplanation && (
                      <div className="mb-6">
                        <div className={`p-4 rounded-xl ${selectedAnswer === currentQuestion?.correct_answer ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                          <p className="font-semibold mb-2">{selectedAnswer === currentQuestion?.correct_answer ? '✓ Correct!' : `✗ Incorrect - ${currentQuestion?.correct_answer?.toUpperCase()}`}</p>
                          {currentQuestion?.explanation && <p className="text-navy-300">{currentQuestion.explanation}</p>}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between gap-4">
                      <button onClick={() => goToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 disabled:opacity-50 rounded-lg"><Icons.ChevronLeft /></button>
                      <span className="text-navy-500">{currentQuestionIndex + 1}/{quizQuestions.length}</span>
                      <button onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex >= quizQuestions.length - 1} className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 text-navy-900 font-semibold rounded-lg"><Icons.ChevronRight /></button>
                    </div>
                  </div>
                  
                  {showNotePanel && (
                    <div className="w-80 flex-shrink-0 hidden lg:block">
                      <div className="sticky top-24 p-4 bg-navy-800/50 rounded-xl border border-navy-700">
                        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gold-400">Notes</h3><button onClick={closeNotePanel} className="p-1 hover:bg-navy-700 rounded"><Icons.X /></button></div>
                        <textarea value={currentNote} onChange={handleNoteChange} placeholder="Add notes..." className="w-full h-40 p-3 bg-navy-900 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none resize-none text-sm" />
                        <div className="mt-3">
                          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                          <button onClick={openFileInput} disabled={uploadingImage} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-navy-700 hover:bg-navy-600 rounded-lg disabled:opacity-50">{uploadingImage ? 'Uploading...' : <><Icons.Image /> Add Images</>}</button>
                          {currentNoteImages.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{currentNoteImages.map((img, i) => <div key={i} className="relative group"><img src={img} alt="" className="w-16 h-16 object-cover rounded cursor-pointer" onClick={() => setLightboxImage(img)} /><button onClick={() => removeNoteImage(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100">×</button></div>)}</div>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={saveNote} disabled={savingNote || (!currentNote.trim() && currentNoteImages.length === 0)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-navy-500 text-navy-900 font-semibold rounded-lg text-sm"><Icons.Save />{savingNote ? 'Saving...' : 'Save'}</button>
                          {currentQuestionNote && <button onClick={deleteCurrentNote} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"><Icons.Trash /></button>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {showNotePanel && quizQuestions.length > 0 && (
                <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 p-4 bg-navy-900 border-t border-navy-700 rounded-t-2xl max-h-[70vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gold-400">Notes</h3><button onClick={closeNotePanel} className="p-1 hover:bg-navy-700 rounded"><Icons.X /></button></div>
                  <textarea value={currentNote} onChange={handleNoteChange} placeholder="Add notes..." className="w-full h-24 p-3 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none resize-none text-sm" />
                  <div className="mt-3">
                    <button onClick={openFileInput} disabled={uploadingImage} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-navy-700 hover:bg-navy-600 rounded-lg disabled:opacity-50">{uploadingImage ? 'Uploading...' : <><Icons.Image /> Add Images</>}</button>
                    {currentNoteImages.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{currentNoteImages.map((img, i) => <div key={i} className="relative group"><img src={img} alt="" className="w-16 h-16 object-cover rounded cursor-pointer" onClick={() => setLightboxImage(img)} /><button onClick={() => removeNoteImage(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button></div>)}</div>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={saveNote} disabled={savingNote || (!currentNote.trim() && currentNoteImages.length === 0)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-navy-500 text-navy-900 font-semibold rounded-lg text-sm"><Icons.Save />{savingNote ? 'Saving...' : 'Save'}</button>
                    {currentQuestionNote && <button onClick={deleteCurrentNote} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"><Icons.Trash /></button>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Question List */}
          {currentView === 'question-list' && (
            <div>
              <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">Questions</h2><button onClick={goToPractice} className="px-4 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg">Back</button></div>
              <div className="grid gap-3">
                {quizQuestions.map((q, i) => {
                  const p = progress.find(pr => pr.question_id === q.id);
                  const n = notes.find(nt => nt.question_id === q.id);
                  return (
                    <button key={q.id} onClick={() => { goToQuestion(i); goToPractice(); }} className={`w-full text-left p-4 rounded-xl border hover:border-navy-500 ${i === currentQuestionIndex ? 'bg-gold-400/10 border-gold-400/30' : 'bg-navy-800/50 border-navy-700'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${p ? p.answered_correctly ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400' : 'bg-navy-700 text-navy-400'}`}>{i + 1}</span>
                        <div className="flex-1"><p className="line-clamp-2">{q.question_text}</p>{n && <span className="mt-2 inline-block px-2 py-0.5 bg-gold-400/20 text-gold-400 rounded text-xs">Note</span>}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {currentView === 'notes' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">All Notes</h2>
              <div className="relative">
                <input type="text" placeholder="Search..." value={searchQuery} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-3 bg-navy-800 border border-navy-700 rounded-lg focus:border-gold-400 focus:outline-none" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500"><Icons.Search /></div>
              </div>
              {filteredNotes.length === 0 ? <p className="text-center py-12 text-navy-400">No notes yet.</p> : (
                <div className="space-y-3">
                  {filteredNotes.map(n => (
                    <div key={n.id} className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{n.title}</h3>
                        <button onClick={async () => { if (confirm('Delete?')) { await supabase.from('notes').delete().eq('id', n.id); loadData(); }}} className="text-navy-500 hover:text-red-400"><Icons.Trash /></button>
                      </div>
                      <p className="text-navy-300">{n.content}</p>
                      {n.images && n.images.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{n.images.map((img, i) => <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded cursor-pointer" onClick={() => setLightboxImage(img)} />)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {currentView === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Statistics</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Attempted" value={stats.attempted} />
                <StatCard label="Correct" value={stats.correct} />
                <StatCard label="Accuracy" value={`${stats.accuracy}%`} highlight />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">By Category</h3>
                <div className="space-y-3">
                  {Object.entries(CATEGORY_INFO).map(([cat, info]) => {
                    const cs = stats.byCategory[cat] || { attempted: 0, correct: 0 };
                    const acc = cs.attempted > 0 ? Math.round((cs.correct / cs.attempted) * 100) : 0;
                    const qc = questionCounts.byCategory[cat] || 0;
                    if (qc === 0) return null;
                    return (
                      <div key={cat} className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{info.name} ({qc})</span>
                          <span className={`font-bold ${acc >= 70 ? 'text-green-400' : acc >= 50 ? 'text-yellow-400' : cs.attempted ? 'text-red-400' : 'text-navy-500'}`}>{cs.attempted ? `${acc}%` : '-'}</span>
                        </div>
                        <div className="h-2 bg-navy-700 rounded-full"><div className={`h-full rounded-full ${acc >= 70 ? 'bg-green-500' : acc >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${acc}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Object.keys(stats.bySubspecialty).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">By Subspecialty</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(SUBSPECIALTY_INFO).map(([sub, info]) => {
                      const ss = stats.bySubspecialty[sub];
                      if (!ss) return null;
                      const acc = ss.attempted > 0 ? Math.round((ss.correct / ss.attempted) * 100) : 0;
                      return (
                        <div key={sub} className="p-3 bg-navy-800/50 rounded-lg border border-navy-700">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{info.name}</span>
                            <span className={`text-sm font-bold ${acc >= 70 ? 'text-green-400' : acc >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{acc}%</span>
                          </div>
                          <div className="text-xs text-navy-500 mt-1">{ss.correct}/{ss.attempted} correct</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
