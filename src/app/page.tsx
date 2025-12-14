'use client';
import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { createClient } from '@/lib/supabase';
import { Question, Note, UserProgress, QuestionCategory, Subspecialty, CATEGORY_INFO, SUBSPECIALTY_INFO } from '@/types';

const Icons = {
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
  X: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  Play: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>,
  Notes: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>,
  Save: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h6.364a2.25 2.25 0 012.25 2.25v.894c0 .777.63 1.406 1.407 1.406h.638c.777 0 1.407-.63 1.407-1.406v-.894a2.25 2.25 0 012.25-2.25h6.364M12 3v8.25m0 0l-3-3m3 3l3-3" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  Image: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  Sparkles: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  Bold: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg>,
  Italic: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m2 0l-6 16m-2 0h4" /></svg>,
  BulletList: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  Highlight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.39m3.421 3.415a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.764m3.42 3.415a6.776 6.776 0 00-3.42-3.415" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
  ChevronUp: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>,
};

const NavButton = memo(({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
    {icon}<span>{label}</span>
  </button>
));
NavButton.displayName = 'NavButton';

const StatCard = memo(({ label, value, gradient }: { label: string; value: string | number; gradient: string }) => (
  <div className={`p-4 sm:p-5 rounded-2xl ${gradient}`}>
    <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
    <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
));
StatCard.displayName = 'StatCard';

const Lightbox = memo(({ src, onClose }: { src: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"><Icons.X /></button>
    <img src={src} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
  </div>
));
Lightbox.displayName = 'Lightbox';

const ChipSelect = memo(({ options, selected, onChange, label }: { 
  options: { key: string; label: string; count?: number }[]; 
  selected: string[]; 
  onChange: (selected: string[]) => void;
  label: string;
}) => {
  const toggle = (key: string) => onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <div className="flex gap-3 text-xs font-medium">
          <button onClick={() => onChange(options.map(o => o.key))} className="text-blue-600 hover:text-blue-700">Select all</button>
          <button onClick={() => onChange([])} className="text-gray-400 hover:text-gray-600">Clear</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt.key} onClick={() => toggle(opt.key)}
            className={`chip ${selected.includes(opt.key) ? 'active' : ''}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
});
ChipSelect.displayName = 'ChipSelect';

// Rich text note editor with formatting
const NoteEditor = memo(({ 
  content, 
  onChange, 
  images, 
  onImageAdd, 
  onImageRemove,
  onSave,
  onDelete,
  saving,
  uploading,
  hasExistingNote,
  fileInputRef,
  onImageClick
}: {
  content: string;
  onChange: (content: string) => void;
  images: string[];
  onImageAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: (index: number) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  uploading: boolean;
  hasExistingNote: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageClick: (src: string) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const colors = [
    { name: 'Red', class: 'text-red-600', bg: 'bg-red-500' },
    { name: 'Orange', class: 'text-orange-600', bg: 'bg-orange-500' },
    { name: 'Green', class: 'text-green-600', bg: 'bg-green-500' },
    { name: 'Blue', class: 'text-blue-600', bg: 'bg-blue-500' },
    { name: 'Purple', class: 'text-purple-600', bg: 'bg-purple-500' },
  ];

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const beforeCursor = content.substring(0, start);
    const afterCursor = content.substring(start);
    
    // Check if we're at the start of a line
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const currentLineBeforeCursor = beforeCursor.substring(lineStart);
    
    let newText;
    if (currentLineBeforeCursor.length === 0 || beforeCursor.endsWith('\n')) {
      newText = beforeCursor + '• ' + afterCursor;
    } else {
      newText = beforeCursor + '\n• ' + afterCursor;
    }
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = newText.indexOf('• ', start) + 2;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertColor = (colorClass: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    // Use markdown-like syntax for colors: [color:red]text[/color]
    const colorName = colorClass.split('-')[1];
    const newText = content.substring(0, start) + `[${colorName}]` + selectedText + `[/${colorName}]` + content.substring(end);
    onChange(newText);
    setShowColorPicker(false);
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  // Render content with formatting
  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    
    // Split by color tags and render
    const parts = text.split(/(\[(?:red|orange|green|blue|purple)\].*?\[\/(?:red|orange|green|blue|purple)\])/gs);
    
    return parts.map((part, i) => {
      const colorMatch = part.match(/\[(red|orange|green|blue|purple)\](.*?)\[\/\1\]/s);
      if (colorMatch) {
        const colorMap: Record<string, string> = {
          red: 'text-red-600',
          orange: 'text-orange-600', 
          green: 'text-green-600',
          blue: 'text-blue-600',
          purple: 'text-purple-600'
        };
        return <span key={i} className={`${colorMap[colorMatch[1]]} font-medium`}>{colorMatch[2]}</span>;
      }
      
      // Handle bullet points
      const lines = part.split('\n');
      return lines.map((line, j) => {
        if (line.startsWith('• ')) {
          return <div key={`${i}-${j}`} className="flex gap-2"><span>•</span><span>{line.substring(2)}</span></div>;
        }
        return <span key={`${i}-${j}`}>{line}{j < lines.length - 1 ? '\n' : ''}</span>;
      });
    });
  };

  return (
    <div className="note-box mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icons.Notes />
          <span className="font-semibold text-amber-800">My Notes</span>
        </div>
        <div className="flex items-center gap-1">
          {hasExistingNote && (
            <button onClick={onDelete} className="p-1.5 text-amber-600 hover:bg-amber-200 rounded-lg transition-colors" title="Delete note">
              <Icons.Trash />
            </button>
          )}
        </div>
      </div>
      
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 mb-2 p-2 bg-amber-100 rounded-lg">
        <button onClick={insertBullet} className="p-1.5 hover:bg-amber-200 rounded transition-colors" title="Bullet point">
          <Icons.BulletList />
        </button>
        <button onClick={() => insertFormatting('**', '**')} className="p-1.5 hover:bg-amber-200 rounded transition-colors" title="Bold">
          <Icons.Bold />
        </button>
        <button onClick={() => insertFormatting('_', '_')} className="p-1.5 hover:bg-amber-200 rounded transition-colors" title="Italic">
          <Icons.Italic />
        </button>
        <div className="relative">
          <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-1.5 hover:bg-amber-200 rounded transition-colors flex items-center gap-1" title="Text color">
            <Icons.Highlight />
            <Icons.ChevronDown />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex gap-1 z-10">
              {colors.map(color => (
                <button
                  key={color.name}
                  onClick={() => insertColor(color.class)}
                  className={`w-6 h-6 rounded-full ${color.bg} hover:ring-2 ring-offset-1 ring-gray-400 transition-all`}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 hover:bg-amber-200 rounded transition-colors" title="Add image">
          <Icons.Image />
        </button>
      </div>
      
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => onChange(e.target.value)}
        placeholder="Add your study notes here... Use the toolbar for formatting!"
        className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[100px]"
        style={{ whiteSpace: 'pre-wrap' }}
      />
      
      {/* Images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg cursor-pointer border-2 border-amber-200" onClick={() => onImageClick(img)} />
              <button onClick={() => onImageRemove(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
          ))}
        </div>
      )}
      
      {/* Save Button */}
      <div className="flex justify-end mt-3">
        <button 
          onClick={onSave} 
          disabled={saving || (!content.trim() && images.length === 0)}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2 !bg-amber-600 hover:!bg-amber-700"
        >
          <Icons.Save /> {saving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
      
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onImageAdd} className="hidden" />
    </div>
  );
});
NoteEditor.displayName = 'NoteEditor';

type View = 'dashboard' | 'quiz-setup' | 'practice' | 'notes' | 'stats' | 'question-list';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubspecialties, setSelectedSubspecialties] = useState<string[]>([]);
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
  const currentQuestionNote = useMemo(() => currentQuestion ? notes.find(n => n.question_id === currentQuestion.id) || null : null, [notes, currentQuestion]);

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

  const questionCounts = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const bySubspecialty: Record<string, number> = {};
    questions.forEach(q => {
      byCategory[q.category] = (byCategory[q.category] || 0) + 1;
      q.subspecialties?.forEach(sub => { bySubspecialty[sub] = (bySubspecialty[sub] || 0) + 1; });
    });
    return { byCategory, bySubspecialty };
  }, [questions]);

  const availableQuestions = useMemo(() => questions.filter(q => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(q.category);
    const subspecialtyMatch = selectedSubspecialties.length === 0 || q.subspecialties?.some(sub => selectedSubspecialties.includes(sub));
    return categoryMatch && subspecialtyMatch;
  }), [questions, selectedCategories, selectedSubspecialties]);

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
    if (i >= 0 && i < quizQuestions.length) { setCurrentQuestionIndex(i); setSelectedAnswer(null); setShowExplanation(false); }
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
    for (let i = 0; i < files.length; i++) { const url = await uploadImage(files[i]); if (url) urls.push(url); }
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
    if (!currentQuestionNote || !confirm('Delete this note?')) return;
    await supabase.from('notes').delete().eq('id', currentQuestionNote.id);
    setCurrentNote(''); setCurrentNoteImages([]);
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (data) setNotes(data);
  }, [currentQuestionNote, supabase]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentNote(e.target.value), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
  const removeNoteImage = useCallback((index: number) => setCurrentNoteImages(prev => prev.filter((_, i) => i !== index)), []);

  const categoryOptions = useMemo(() => Object.entries(CATEGORY_INFO).map(([key, info]) => ({ key, label: info.name, count: questionCounts.byCategory[key] || 0 })), [questionCounts.byCategory]);
  const subspecialtyOptions = useMemo(() => Object.entries(SUBSPECIALTY_INFO).map(([key, info]) => ({ key, label: info.name, count: questionCounts.bySubspecialty[key] || 0 })).filter(opt => (questionCounts.bySubspecialty[opt.key] || 0) > 0), [questionCounts.bySubspecialty]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {lightboxImage && <Lightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)} />}
      
      {/* Sidebar */}
      <nav className={`sidebar fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <Icons.Sparkles />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Diagnostic</h1>
                <p className="text-sm font-semibold text-blue-600">Excellence</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-1">
            <NavButton icon={<Icons.Home />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Play />} label="Start Quiz" active={currentView === 'quiz-setup' || currentView === 'practice'} onClick={() => { setCurrentView('quiz-setup'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Notes />} label="My Notes" active={currentView === 'notes'} onClick={() => { setCurrentView('notes'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Chart />} label="Statistics" active={currentView === 'stats'} onClick={() => { setCurrentView('stats'); setSidebarOpen(false); }} />
          </div>
          <div className="p-4 mx-4 mb-4 rounded-xl bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total Questions</span>
              <span className="font-bold text-gray-800">{questions.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500">Notes Created</span>
              <span className="font-bold text-gray-800">{notes.length}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="app-header">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Icons.Menu />
            </button>
            <div className="flex-1" />
            {currentView === 'practice' && currentQuestion && (
              <span className="category-badge">
                {CATEGORY_INFO[currentQuestion.category]?.name}
              </span>
            )}
          </div>
        </header>

        <div className="main-content">
          {/* Dashboard */}
          {currentView === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome back! 👋</h2>
                <p className="text-gray-500 mt-1">Continue your exam preparation</p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Total Questions" value={stats.total} gradient="stat-gradient-blue" />
                <StatCard label="Attempted" value={stats.attempted} gradient="stat-gradient-purple" />
                <StatCard label="Correct" value={stats.correct} gradient="stat-gradient-green" />
                <StatCard label="Accuracy" value={`${stats.accuracy}%`} gradient="stat-gradient-amber" />
              </div>
              
              <div className="elevated-card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Start</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                    const count = questionCounts.byCategory[key] || 0;
                    const catStats = stats.byCategory[key];
                    const accuracy = catStats?.attempted ? Math.round((catStats.correct / catStats.attempted) * 100) : null;
                    return (
                      <button key={key} onClick={() => { setSelectedCategories([key]); setSelectedSubspecialties([]); setCurrentView('quiz-setup'); }} disabled={count === 0}
                        className="p-4 rounded-xl text-left transition-all duration-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 group">
                        <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{info.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{count} questions</div>
                        {accuracy !== null && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${accuracy >= 70 ? 'bg-green-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${accuracy}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-500">{accuracy}%</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setCurrentView('quiz-setup')} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                  <Icons.Sparkles /> Custom Quiz
                </button>
              </div>
            </div>
          )}

          {/* Quiz Setup */}
          {currentView === 'quiz-setup' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Create Quiz</h2>
                <p className="text-gray-500 mt-1">Select topics to practice</p>
              </div>
              
              <div className="elevated-card p-4 sm:p-6 space-y-6">
                <ChipSelect label="Categories" options={categoryOptions.map(o => ({ ...o, label: `${o.label} (${o.count})` }))} selected={selectedCategories} onChange={setSelectedCategories} />
                {subspecialtyOptions.length > 0 && (
                  <ChipSelect label="Subspecialties" options={subspecialtyOptions.map(o => ({ ...o, label: `${o.label} (${o.count})` }))} selected={selectedSubspecialties} onChange={setSelectedSubspecialties} />
                )}
                
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">Available questions</span>
                    <span className="text-3xl font-bold text-blue-600">{availableQuestions.length}</span>
                  </div>
                  <button onClick={startQuiz} disabled={availableQuestions.length === 0} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Icons.Play /> Start Quiz
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Practice - IMPROVED MOBILE LAYOUT */}
          {currentView === 'practice' && (
            <>
              {quizQuestions.length === 0 ? (
                <div className="text-center py-16 animate-fadeIn">
                  <p className="text-gray-500 mb-4">No questions selected</p>
                  <button onClick={() => setCurrentView('quiz-setup')} className="btn-primary">Setup Quiz</button>
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <div className={`max-w-3xl mx-auto ${showNotePanel ? 'lg:mr-0 lg:max-w-2xl' : ''}`}>
                    {/* Progress bar header */}
                    <div className="mb-4 sm:mb-6">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <button onClick={() => setCurrentView('question-list')} className="btn-secondary text-sm px-3 py-2">
                          <Icons.List />
                        </button>
                        <span className="text-sm font-medium text-gray-500">
                          Question {currentQuestionIndex + 1} of {quizQuestions.length}
                        </span>
                        <button onClick={() => setShowNotePanel(!showNotePanel)} 
                          className={`btn-secondary text-sm px-3 py-2 ${showNotePanel || currentQuestionNote ? '!bg-blue-50 !text-blue-600' : ''}`}>
                          <Icons.Notes />
                        </button>
                      </div>
                      <div className="progress-container">
                        {quizQuestions.map((fq, i) => {
                          const p = progress.find(pr => pr.question_id === fq.id);
                          let bg = 'bg-gray-200';
                          if (p) bg = p.answered_correctly ? 'bg-green-500' : 'bg-red-400';
                          if (i === currentQuestionIndex) bg = 'bg-blue-500';
                          return <button key={fq.id} onClick={() => goToQuestion(i)} className={`progress-segment flex-1 ${bg}`} />;
                        })}
                      </div>
                    </div>
                    
                    {/* Question Card */}
                    <div className="quiz-card p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
                      {currentQuestion?.subspecialties && currentQuestion.subspecialties.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                          {currentQuestion.subspecialties.map(sub => (
                            <span key={sub} className="subspecialty-badge">{SUBSPECIALTY_INFO[sub]?.name}</span>
                          ))}
                        </div>
                      )}
                      {currentQuestion?.image_url && (
                        <img src={currentQuestion.image_url} alt="" 
                          className="w-full max-h-64 sm:max-h-72 object-contain rounded-xl mb-4 sm:mb-6 bg-gray-50 cursor-pointer" 
                          onClick={() => setLightboxImage(currentQuestion.image_url!)} />
                      )}
                      <p className="question-text">{currentQuestion?.question_text}</p>
                    </div>
                    
                    {/* Options - IMPROVED */}
                    {currentQuestion?.options && (
                      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        {Object.entries(currentQuestion.options).map(([k, v]) => (
                          <button key={k} onClick={() => handleAnswer(k)} disabled={showExplanation}
                            className={`option-button ${selectedAnswer === k ? 'selected' : ''} ${showExplanation && k === currentQuestion.correct_answer ? 'correct' : ''} ${showExplanation && selectedAnswer === k && k !== currentQuestion.correct_answer ? 'incorrect' : ''}`}>
                            <span className={`option-letter ${showExplanation && k === currentQuestion.correct_answer ? '!bg-green-500 !text-white' : ''} ${showExplanation && selectedAnswer === k && k !== currentQuestion.correct_answer ? '!bg-red-500 !text-white' : ''}`}>
                              {k.toUpperCase()}
                            </span>
                            <span className="option-text">{v}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Explanation */}
                    {showExplanation && (
                      <div className="mb-4 sm:mb-6 animate-slideUp">
                        <div className={`explanation-box ${selectedAnswer === currentQuestion?.correct_answer ? 'correct' : 'incorrect'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {selectedAnswer === currentQuestion?.correct_answer ? (
                              <>
                                <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0"><Icons.Check /></span>
                                <span className="font-semibold text-green-700">Correct!</span>
                              </>
                            ) : (
                              <>
                                <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-sm flex-shrink-0">✗</span>
                                <span className="font-semibold text-red-700">Incorrect — Answer: {currentQuestion?.correct_answer?.toUpperCase()}</span>
                              </>
                            )}
                          </div>
                          {currentQuestion?.explanation && <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{currentQuestion.explanation}</p>}
                        </div>
                      </div>
                    )}
                    
                    {/* Navigation */}
                    <div className="nav-button-group">
                      <button onClick={() => goToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} 
                        className="btn-secondary flex items-center gap-1 sm:gap-2">
                        <Icons.ChevronLeft /> <span className="hidden sm:inline">Previous</span>
                      </button>
                      <span className="text-sm text-gray-400 font-medium">{currentQuestionIndex + 1} / {quizQuestions.length}</span>
                      <button onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex >= quizQuestions.length - 1} 
                        className="btn-primary flex items-center gap-1 sm:gap-2">
                        <span className="hidden sm:inline">Next</span> <Icons.ChevronRight />
                      </button>
                    </div>
                    
                    {/* Inline Notes Section - Yellow Box */}
                    {showNotePanel && (
                      <NoteEditor
                        content={currentNote}
                        onChange={setCurrentNote}
                        images={currentNoteImages}
                        onImageAdd={handleImageUpload}
                        onImageRemove={removeNoteImage}
                        onSave={saveNote}
                        onDelete={deleteCurrentNote}
                        saving={savingNote}
                        uploading={uploadingImage}
                        hasExistingNote={!!currentQuestionNote}
                        fileInputRef={fileInputRef}
                        onImageClick={setLightboxImage}
                      />
                    )}
                    
                    {/* Show existing note preview when collapsed */}
                    {!showNotePanel && currentQuestionNote && (
                      <div className="note-box-preview mt-4" onClick={() => setShowNotePanel(true)}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Notes />
                          <span className="font-semibold text-amber-800">My Notes</span>
                          <span className="text-xs text-amber-600">(tap to edit)</span>
                        </div>
                        <p className="text-amber-900 text-sm line-clamp-3">{currentQuestionNote.content}</p>
                        {currentQuestionNote.images && currentQuestionNote.images.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {currentQuestionNote.images.slice(0, 3).map((img, i) => (
                              <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded-lg border border-amber-200" />
                            ))}
                            {currentQuestionNote.images.length > 3 && (
                              <span className="w-12 h-12 flex items-center justify-center bg-amber-200 rounded-lg text-amber-700 text-sm font-medium">+{currentQuestionNote.images.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Question List */}
          {currentView === 'question-list' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">All Questions</h2>
                <button onClick={() => setCurrentView('practice')} className="btn-secondary">Back to Quiz</button>
              </div>
              <div className="grid gap-3">
                {quizQuestions.map((q, i) => {
                  const p = progress.find(pr => pr.question_id === q.id);
                  const n = notes.find(nt => nt.question_id === q.id);
                  return (
                    <button key={q.id} onClick={() => { goToQuestion(i); setCurrentView('practice'); }}
                      className={`elevated-card w-full text-left p-4 ${i === currentQuestionIndex ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${p ? p.answered_correctly ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 line-clamp-2 text-sm sm:text-base">{q.question_text}</p>
                          {n && <span className="mt-2 inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">Has note</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {currentView === 'notes' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">My Notes</h2>
              <div className="relative">
                <input type="text" placeholder="Search notes..." value={searchQuery} onChange={handleSearchChange} className="input-field pl-11" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Search /></div>
              </div>
              {filteredNotes.length === 0 ? (
                <div className="text-center py-16"><p className="text-gray-400">No notes yet</p></div>
              ) : (
                <div className="grid gap-4">
                  {filteredNotes.map(n => (
                    <div key={n.id} className="elevated-card p-4 sm:p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{n.title}</h3>
                        <button onClick={async () => { if (confirm('Delete this note?')) { await supabase.from('notes').delete().eq('id', n.id); loadData(); }}} className="text-gray-300 hover:text-red-500 transition-colors"><Icons.Trash /></button>
                      </div>
                      <p className="text-gray-600 text-sm">{n.content}</p>
                      {n.images && n.images.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{n.images.map((img, i) => <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded-lg cursor-pointer" onClick={() => setLightboxImage(img)} />)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {currentView === 'stats' && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Statistics</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Total Questions" value={stats.total} gradient="stat-gradient-blue" />
                <StatCard label="Attempted" value={stats.attempted} gradient="stat-gradient-purple" />
                <StatCard label="Correct" value={stats.correct} gradient="stat-gradient-green" />
                <StatCard label="Accuracy" value={`${stats.accuracy}%`} gradient="stat-gradient-amber" />
              </div>
              
              <div className="elevated-card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Performance by Category</h3>
                <div className="space-y-4">
                  {Object.entries(CATEGORY_INFO).map(([cat, info]) => {
                    const cs = stats.byCategory[cat] || { attempted: 0, correct: 0 };
                    const acc = cs.attempted > 0 ? Math.round((cs.correct / cs.attempted) * 100) : 0;
                    const qc = questionCounts.byCategory[cat] || 0;
                    if (qc === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700 text-sm sm:text-base">{info.name}</span>
                          <span className={`font-bold ${acc >= 70 ? 'text-green-600' : acc >= 50 ? 'text-amber-600' : cs.attempted ? 'text-red-600' : 'text-gray-400'}`}>
                            {cs.attempted ? `${acc}%` : '—'}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${acc >= 70 ? 'bg-green-500' : acc >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${acc}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{cs.correct} of {cs.attempted} correct · {qc} questions total</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Object.keys(stats.bySubspecialty).length > 0 && (
                <div className="elevated-card p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Performance by Subspecialty</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(SUBSPECIALTY_INFO).map(([sub, info]) => {
                      const ss = stats.bySubspecialty[sub];
                      if (!ss) return null;
                      const acc = ss.attempted > 0 ? Math.round((ss.correct / ss.attempted) * 100) : 0;
                      return (
                        <div key={sub} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-sm">{info.name}</span>
                            <span className={`font-bold ${acc >= 70 ? 'text-green-600' : acc >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{acc}%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{ss.correct}/{ss.attempted} correct</p>
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
