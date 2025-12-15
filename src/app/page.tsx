'use client';
import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import AuthForm from './auth-form';
import { Question, Note, UserProgress, QuestionCategory, Subspecialty, CATEGORY_INFO, SUBSPECIALTY_INFO } from '@/types';
import { 
  calculateNextReview, 
  filterDueForReview, 
  filterPreviouslyWrong, 
  sortByReviewPriority,
  getMasteryLabel,
  getNextReviewLabel,
  SpacedRepetitionData,
  isDueForReview
} from '@/lib/spaced-repetition';

// Dynamic import for RichTextEditor (client-side only to avoid SSR issues with Tiptap)
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
});

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
  Logout: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  Brain: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
  Trophy: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A.75.75 0 0015.75 12H8.25a.75.75 0 00-.75.75v4.5m9-4.5a3 3 0 00-3-3H9.75a3 3 0 00-3 3m10.5-6V6a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25v.75m10.5 0h1.5a1.5 1.5 0 011.5 1.5v1.5m-13.5-3h-1.5a1.5 1.5 0 00-1.5 1.5v1.5" /></svg>,
  Filter: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  XCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Refresh: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  FileText: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
};

const NavButton = memo(({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
    {icon}<span>{label}</span>
  </button>
));
NavButton.displayName = 'NavButton';

const StatCard = memo(({ label, value, gradient }: { label: string; value: string | number; gradient: string }) => (
  <div className={`p-4 sm:p-5 rounded-2xl ${gradient}`}>
    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
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

// Settings Panel Component
const SettingsPanel = memo(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { theme, setTheme, textSize, setTextSize } = useSettings();
  
  return (
    <>
      {/* Overlay */}
      <div 
        className={`settings-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`settings-panel ${open ? 'open' : ''}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Settings</h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Icons.X />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Theme Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icons.Moon />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Appearance</span>
              </div>
              <div className="theme-group">
                <button 
                  onClick={() => setTheme('light')}
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                >
                  <Icons.Sun />
                  <span>Light</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                >
                  <Icons.Moon />
                  <span>Dark</span>
                </button>
                <button 
                  onClick={() => setTheme('system')}
                  className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                >
                  <Icons.Monitor />
                  <span>Auto</span>
                </button>
              </div>
            </div>
            
            {/* Text Size */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icons.TextSize />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Text Size</span>
              </div>
              <div className="text-size-group">
                <button 
                  onClick={() => setTextSize('small')}
                  className={`text-size-btn ${textSize === 'small' ? 'active' : ''}`}
                >
                  <span className="text-xs">A</span>
                  <span className="text-xs ml-1">Small</span>
                </button>
                <button 
                  onClick={() => setTextSize('medium')}
                  className={`text-size-btn ${textSize === 'medium' ? 'active' : ''}`}
                >
                  <span className="text-sm">A</span>
                  <span className="text-xs ml-1">Medium</span>
                </button>
                <button 
                  onClick={() => setTextSize('large')}
                  className={`text-size-btn ${textSize === 'large' ? 'active' : ''}`}
                >
                  <span className="text-base">A</span>
                  <span className="text-xs ml-1">Large</span>
                </button>
              </div>
              
              {/* Preview */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                <p className="question-text">This is how question text will appear at this size setting.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
SettingsPanel.displayName = 'SettingsPanel';

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
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex gap-3 text-xs font-medium">
          <button onClick={() => onChange(options.map(o => o.key))} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Select all</button>
          <button onClick={() => onChange([])} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">Clear</button>
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

// Improved Note Editor with paste support, resizable images, and subtle styling
// WYSIWYG Note Editor using Tiptap
const NoteEditor = memo(({ 
  content, 
  onChange, 
  onSave,
  onDelete,
  onCancel,
  saving,
  hasExistingNote,
  onImageUpload,
  title,
  showHeader = true,
  className = ''
}: {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  saving: boolean;
  hasExistingNote: boolean;
  onImageUpload: (file: File) => Promise<string | null>;
  title?: string;
  showHeader?: boolean;
  className?: string;
}) => {
  return (
    <div className={`note-box ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Icons.Notes />
            <span className="font-medium">{title || 'My Notes'}</span>
          </div>
          <div className="flex items-center gap-1">
            {onCancel && (
              <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-2">Cancel</button>
            )}
            {hasExistingNote && onDelete && (
              <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Delete note">
                <Icons.Trash />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Rich Text Editor */}
      <RichTextEditor
        content={content}
        onChange={onChange}
        onImageUpload={onImageUpload}
        placeholder="Start typing your notes... Paste formatted text or images with Ctrl+V"
        minHeight="150px"
      />
      
      {/* Action Buttons */}
      <div className="flex justify-end mt-3 gap-2">
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">
            Cancel
          </button>
        )}
        <button 
          onClick={onSave} 
          disabled={saving || !content.trim() || content === '<p></p>'}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
        >
          <Icons.Save /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
});
NoteEditor.displayName = 'NoteEditor';

type View = 'dashboard' | 'quiz-setup' | 'practice' | 'notes' | 'stats' | 'question-list';
type QuizMode = 'all' | 'spaced' | 'wrong-only' | 'unmastered';

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, resolvedTheme } = useSettings();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const [savingNote, setSavingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [noteSortBy, setNoteSortBy] = useState<'date' | 'category' | 'title'>('date');
  const [noteSortOrder, setNoteSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [savingEditNote, setSavingEditNote] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>('all');
  const [quizLimit, setQuizLimit] = useState<number | 'all'>('all');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCategories, setExportCategories] = useState<string[]>([]);
  
  const supabase = useMemo(() => createClient(), []);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const currentQuestionNote = useMemo(() => currentQuestion ? notes.find(n => n.question_id === currentQuestion.id) || null : null, [notes, currentQuestion]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [qRes, nRes, pRes] = await Promise.all([
        supabase.from('questions').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('user_progress').select('*').eq('user_id', user.id),
      ]);
      if (qRes.data) setQuestions(qRes.data);
      if (nRes.data) setNotes(nRes.data);
      if (pRes.data) setProgress(pRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => { if (user) loadData(); }, [loadData, user]);

  useEffect(() => {
    setCurrentNote(currentQuestionNote?.content || '');
  }, [currentQuestionNote]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (noteSortBy === 'date') {
        cmp = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      } else if (noteSortBy === 'category') {
        cmp = (a.category || '').localeCompare(b.category || '');
      } else if (noteSortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      }
      return noteSortOrder === 'asc' ? -cmp : cmp;
    });
    return result;
  }, [notes, searchQuery, noteSortBy, noteSortOrder]);

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

  // Progress map for efficient lookups
  const progressMap = useMemo(() => {
    const map = new Map<string, UserProgress>();
    progress.forEach(p => map.set(p.question_id, p));
    return map;
  }, [progress]);

  // Spaced repetition data map
  const srDataMap = useMemo(() => {
    const map = new Map<string, SpacedRepetitionData>();
    progress.forEach(p => {
      map.set(p.question_id, {
        ease_factor: p.ease_factor ?? 2.5,
        interval: p.interval ?? 1,
        next_review: p.next_review ?? new Date().toISOString(),
        repetitions: p.repetitions ?? 0,
        correct_streak: p.correct_streak ?? 0,
        total_correct: p.total_correct ?? 0,
        mastered: p.mastered ?? false,
      });
    });
    return map;
  }, [progress]);

  // Computed stats for spaced repetition
  const srStats = useMemo(() => {
    const dueCount = questions.filter(q => {
      const sr = srDataMap.get(q.id);
      if (!sr) return true; // Never answered = due
      if (sr.mastered) return false;
      return isDueForReview(sr.next_review);
    }).length;
    
    const masteredCount = progress.filter(p => p.mastered).length;
    const wrongCount = questions.filter(q => {
      const p = progressMap.get(q.id);
      if (!p) return false;
      return !p.answered_correctly || (p.attempts ?? 1) > (p.total_correct ?? 0);
    }).length;
    
    return { dueCount, masteredCount, wrongCount };
  }, [questions, progress, srDataMap, progressMap]);

  const availableQuestions = useMemo(() => {
    let filtered = questions.filter(q => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(q.category);
      const subspecialtyMatch = selectedSubspecialties.length === 0 || q.subspecialties?.some(sub => selectedSubspecialties.includes(sub));
      return categoryMatch && subspecialtyMatch;
    });

    // Apply quiz mode filtering
    switch (quizMode) {
      case 'spaced':
        filtered = filterDueForReview(filtered, srDataMap, false);
        break;
      case 'wrong-only':
        filtered = filterPreviouslyWrong(filtered, progressMap as Map<string, { answered_correctly: boolean; total_correct: number; attempts: number }>);
        break;
      case 'unmastered':
        filtered = filtered.filter(q => {
          const sr = srDataMap.get(q.id);
          return !sr?.mastered;
        });
        break;
    }

    return filtered;
  }, [questions, selectedCategories, selectedSubspecialties, quizMode, srDataMap, progressMap]);

  const handleAnswer = useCallback(async (answer: string) => {
    if (showExplanation || !currentQuestion || !user) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);
    
    const isCorrect = answer === currentQuestion.correct_answer;
    const existingProgress = progressMap.get(currentQuestion.id);
    
    // Calculate spaced repetition data
    const srData = calculateNextReview(
      existingProgress ? {
        ease_factor: existingProgress.ease_factor,
        interval: existingProgress.interval,
        next_review: existingProgress.next_review,
        repetitions: existingProgress.repetitions,
        correct_streak: existingProgress.correct_streak,
        total_correct: existingProgress.total_correct,
        mastered: existingProgress.mastered,
      } : {},
      isCorrect
    );
    
    try {
      await supabase.from('user_progress').upsert(
        {
          user_id: user.id,
          question_id: currentQuestion.id,
          answered_correctly: isCorrect,
          user_answer: answer,
          attempts: (existingProgress?.attempts ?? 0) + 1,
          last_attempted: new Date().toISOString(),
          // Spaced repetition fields
          ease_factor: srData.ease_factor,
          interval: srData.interval,
          next_review: srData.next_review,
          repetitions: srData.repetitions,
          // Mastery fields
          correct_streak: srData.correct_streak,
          total_correct: srData.total_correct,
          mastered: srData.mastered,
        },
        { onConflict: 'user_id,question_id' }
      );
      const { data } = await supabase.from('user_progress').select('*').eq('user_id', user.id);
      if (data) setProgress(data);
    } catch (e) { console.error(e); }
  }, [showExplanation, currentQuestion, supabase, user, progressMap]);

  const goToQuestion = useCallback((i: number) => {
    if (i >= 0 && i < quizQuestions.length) { setCurrentQuestionIndex(i); setSelectedAnswer(null); setShowExplanation(false); }
  }, [quizQuestions.length]);

  const startQuiz = useCallback(() => {
    let quizQs = [...availableQuestions];
    
    // Sort by spaced repetition priority if in spaced mode
    if (quizMode === 'spaced') {
      quizQs = sortByReviewPriority(quizQs, srDataMap);
    } else {
      // Shuffle for other modes
      quizQs.sort(() => Math.random() - 0.5);
    }
    
    // Apply limit
    if (quizLimit !== 'all' && quizLimit > 0) {
      quizQs = quizQs.slice(0, quizLimit);
    }
    
    setQuizQuestions(quizQs);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowNotePanel(false);
    setQuizCompleted(false);
    setCurrentView('practice');
    setSidebarOpen(false);
  }, [availableQuestions, quizMode, srDataMap, quizLimit]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('note-images').upload(name, file);
    if (error) return null;
    return supabase.storage.from('note-images').getPublicUrl(name).data.publicUrl;
  }, [supabase]);

  const saveNote = useCallback(async () => {
    if (!currentQuestion || !user || !currentNote.trim() || currentNote === '<p></p>') return;
    setSavingNote(true);
    try {
      if (currentQuestionNote) {
        await supabase.from('notes').update({ content: currentNote, updated_at: new Date().toISOString() }).eq('id', currentQuestionNote.id);
      } else {
        await supabase.from('notes').insert({ user_id: user.id, question_id: currentQuestion.id, category: currentQuestion.category, title: `Note: ${currentQuestion.question_text.substring(0, 50)}...`, content: currentNote });
      }
      const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
      if (data) setNotes(data);
    } catch (e) { console.error(e); }
    setSavingNote(false);
  }, [currentQuestion, currentNote, currentQuestionNote, supabase, user]);

  const deleteCurrentNote = useCallback(async () => {
    if (!currentQuestionNote || !user || !confirm('Delete this note?')) return;
    await supabase.from('notes').delete().eq('id', currentQuestionNote.id);
    setCurrentNote('');
    const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) setNotes(data);
  }, [currentQuestionNote, supabase, user]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);

  // Note editing in overview
  const startEditingNote = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  }, []);

  const cancelEditingNote = useCallback(() => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  }, []);

  const saveEditingNote = useCallback(async () => {
    if (!editingNoteId || !user) return;
    setSavingEditNote(true);
    try {
      await supabase.from('notes').update({ 
        content: editingNoteContent, 
        updated_at: new Date().toISOString() 
      }).eq('id', editingNoteId);
      const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
      if (data) setNotes(data);
      setEditingNoteId(null);
      setEditingNoteContent('');
    } catch (e) { console.error(e); }
    setSavingEditNote(false);
  }, [editingNoteId, editingNoteContent, supabase, user]);

  const categoryOptions = useMemo(() => Object.entries(CATEGORY_INFO).map(([key, info]) => ({ key, label: info.name, count: questionCounts.byCategory[key] || 0 })), [questionCounts.byCategory]);
  const subspecialtyOptions = useMemo(() => Object.entries(SUBSPECIALTY_INFO).map(([key, info]) => ({ key, label: info.name, count: questionCounts.bySubspecialty[key] || 0 })).filter(opt => (questionCounts.bySubspecialty[opt.key] || 0) > 0), [questionCounts.bySubspecialty]);

  // Toggle note expansion
  const toggleNoteExpanded = useCallback((noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  // Expand/collapse all notes
  const expandAllNotes = useCallback(() => {
    setExpandedNotes(new Set(filteredNotes.map(n => n.id)));
  }, [filteredNotes]);

  const collapseAllNotes = useCallback(() => {
    setExpandedNotes(new Set());
  }, []);

  // Get question for a note
  const getQuestionForNote = useCallback((note: Note) => {
    if (!note.question_id) return null;
    return questions.find(q => q.id === note.question_id) || null;
  }, [questions]);

  // Notes by category for export
  const notesByCategory = useMemo(() => {
    const grouped: Record<string, Note[]> = {};
    notes.forEach(n => {
      const cat = n.category || 'uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(n);
    });
    return grouped;
  }, [notes]);

  // Export notes to PDF
  const exportNotesToPdf = useCallback(async () => {
    const selectedNotes = notes.filter(n => {
      if (exportCategories.length === 0) return true;
      return exportCategories.includes(n.category || 'uncategorized');
    });

    if (selectedNotes.length === 0) {
      alert('No notes to export');
      return;
    }

    // Create HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Study Notes Export</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #3b82f6; margin-top: 30px; }
          .note { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid; }
          .note-title { font-weight: 600; color: #1e293b; margin-bottom: 10px; }
          .question { background: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 15px; font-style: italic; }
          .question-label { font-size: 12px; color: #3b82f6; font-weight: 600; margin-bottom: 5px; }
          .content { color: #475569; line-height: 1.6; }
          .category-badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 4px 10px; border-radius: 4px; font-size: 12px; margin-bottom: 10px; }
          .date { color: #94a3b8; font-size: 12px; }
          img { max-width: 100%; height: auto; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>📚 Study Notes</h1>
        <p style="color: #64748b;">Exported on ${new Date().toLocaleDateString()} • ${selectedNotes.length} notes</p>
    `;

    // Group by category
    const grouped: Record<string, Note[]> = {};
    selectedNotes.forEach(n => {
      const cat = n.category || 'uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(n);
    });

    Object.entries(grouped).forEach(([cat, catNotes]) => {
      const catName = CATEGORY_INFO[cat as keyof typeof CATEGORY_INFO]?.name || 'Uncategorized';
      htmlContent += `<h2>${catName}</h2>`;
      
      catNotes.forEach(note => {
        const question = getQuestionForNote(note);
        htmlContent += `
          <div class="note">
            <div class="note-title">${note.title}</div>
            ${question ? `
              <div class="question">
                <div class="question-label">Related Question:</div>
                ${question.question_text}
              </div>
            ` : ''}
            <div class="content">${note.content}</div>
            <div class="date">${new Date(note.updated_at).toLocaleDateString()}</div>
          </div>
        `;
      });
    });

    htmlContent += '</body></html>';

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    setShowExportModal(false);
  }, [notes, exportCategories, getQuestionForNote]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show auth form
  if (!user) {
    return <AuthForm />;
  }

  // Data loading state
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
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)} />}
      
      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* Sidebar */}
      <nav className={`sidebar fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
              <div>
                <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Diagnostic</h1>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Excellence</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-1">
            <NavButton icon={<Icons.Home />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Play />} label="Start Quiz" active={currentView === 'quiz-setup' || currentView === 'practice'} onClick={() => { setCurrentView('quiz-setup'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Notes />} label="My Notes" active={currentView === 'notes'} onClick={() => { setCurrentView('notes'); setSidebarOpen(false); }} />
            <NavButton icon={<Icons.Chart />} label="Statistics" active={currentView === 'stats'} onClick={() => { setCurrentView('stats'); setSidebarOpen(false); }} />
          </div>
          <div className="p-4 mx-4 mb-2 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Questions</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{questions.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500 dark:text-gray-400">Mastered</span>
              <span className="font-bold text-green-600 dark:text-green-400">{srStats.masteredCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500 dark:text-gray-400">Due for Review</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{srStats.dueCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500 dark:text-gray-400">Notes Created</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{notes.length}</span>
            </div>
          </div>
          {/* User info and logout */}
          <div className="p-4 mx-4 mb-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Icons.User />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{user?.user_metadata?.name || 'User'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()} 
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Icons.Logout /> Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="app-header">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-400">
              <Icons.Menu />
            </button>
            <div className="flex-1" />
            {currentView === 'practice' && currentQuestion && (
              <span className="category-badge">
                {CATEGORY_INFO[currentQuestion.category]?.name}
              </span>
            )}
            {/* Settings Button */}
            <button 
              onClick={() => setSettingsOpen(true)} 
              className="btn-icon"
              title="Settings"
            >
              <Icons.Settings />
            </button>
          </div>
        </header>

        <div className="main-content">
          {/* Dashboard */}
          {currentView === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome back! 👋</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Continue your exam preparation</p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Total Questions" value={stats.total} gradient="stat-gradient-blue" />
                <StatCard label="Mastered" value={srStats.masteredCount} gradient="stat-gradient-green" />
                <StatCard label="Due for Review" value={srStats.dueCount} gradient="stat-gradient-purple" />
                <StatCard label="Accuracy" value={`${stats.accuracy}%`} gradient="stat-gradient-amber" />
              </div>
              
              {/* Quick Action Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {srStats.dueCount > 0 && (
                  <button 
                    onClick={() => { setQuizMode('spaced'); setSelectedCategories([]); setSelectedSubspecialties([]); setCurrentView('quiz-setup'); }}
                    className="elevated-card p-5 text-left hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Icons.Clock />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Spaced Review</h4>
                        <p className="text-sm text-purple-600 font-medium">{srStats.dueCount} questions due</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Review questions at optimal intervals for long-term retention</p>
                  </button>
                )}
                
                {srStats.wrongCount > 0 && (
                  <button 
                    onClick={() => { setQuizMode('wrong-only'); setSelectedCategories([]); setSelectedSubspecialties([]); setCurrentView('quiz-setup'); }}
                    className="elevated-card p-5 text-left hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <Icons.XCircle />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Review Mistakes</h4>
                        <p className="text-sm text-red-600 font-medium">{srStats.wrongCount} to review</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Focus on questions you previously got wrong</p>
                  </button>
                )}
                
                <button 
                  onClick={() => { setQuizMode('all'); setSelectedCategories([]); setSelectedSubspecialties([]); setCurrentView('quiz-setup'); }}
                  className="elevated-card p-5 text-left hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icons.Play />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">Practice All</h4>
                      <p className="text-sm text-blue-600 font-medium">{questions.length} questions</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Practice all questions in random order</p>
                </button>
              </div>
              
              {/* Mastery Progress */}
              <div className="elevated-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Mastery Progress</h3>
                  <span className="text-sm text-gray-500">
                    {Math.round((srStats.masteredCount / Math.max(questions.length, 1)) * 100)}% complete
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${(srStats.masteredCount / Math.max(questions.length, 1)) * 100}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">Mastered: {srStats.masteredCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-gray-600">In Progress: {stats.attempted - srStats.masteredCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                    <span className="text-gray-600">Not Started: {questions.length - stats.attempted}</span>
                  </div>
                </div>
              </div>
              
              <div className="elevated-card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">By Category</h3>
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
                <p className="text-gray-500 mt-1">Select topics and study mode</p>
              </div>
              
              {/* Study Mode Selection */}
              <div className="elevated-card p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icons.Brain />
                  <span className="text-sm font-semibold text-gray-700">Study Mode</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setQuizMode('all')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      quizMode === 'all' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icons.List />
                      <span className="font-semibold text-gray-800">All Questions</span>
                    </div>
                    <p className="text-xs text-gray-500">Random order, all questions</p>
                    <p className="text-sm font-bold text-gray-600 mt-2">{questions.length} total</p>
                  </button>
                  
                  <button
                    onClick={() => setQuizMode('spaced')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      quizMode === 'spaced' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icons.Clock />
                      <span className="font-semibold text-gray-800">Spaced Review</span>
                    </div>
                    <p className="text-xs text-gray-500">Due for review (SM-2)</p>
                    <p className="text-sm font-bold text-purple-600 mt-2">{srStats.dueCount} due</p>
                  </button>
                  
                  <button
                    onClick={() => setQuizMode('wrong-only')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      quizMode === 'wrong-only' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icons.XCircle />
                      <span className="font-semibold text-gray-800">Previously Wrong</span>
                    </div>
                    <p className="text-xs text-gray-500">Questions you got wrong</p>
                    <p className="text-sm font-bold text-red-600 mt-2">{srStats.wrongCount} to review</p>
                  </button>
                  
                  <button
                    onClick={() => setQuizMode('unmastered')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      quizMode === 'unmastered' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icons.Trophy />
                      <span className="font-semibold text-gray-800">Not Mastered</span>
                    </div>
                    <p className="text-xs text-gray-500">Exclude mastered questions</p>
                    <p className="text-sm font-bold text-amber-600 mt-2">{questions.length - srStats.masteredCount} remaining</p>
                  </button>
                </div>
                
                {/* Mastery Info Box */}
                <div className="p-3 bg-gray-50 rounded-xl mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">🏆 Mastered questions</span>
                    <span className="font-bold text-green-600">{srStats.masteredCount} / {questions.length}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    A question is mastered when answered correctly 3 times with at least 2 correct in a row
                  </p>
                </div>
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
                  
                  {/* Quiz Length Selector */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Number of questions</label>
                    <div className="flex flex-wrap gap-2">
                      {[10, 20, 30, 50, 'all'].map((num) => (
                        <button
                          key={num}
                          onClick={() => setQuizLimit(num as number | 'all')}
                          disabled={typeof num === 'number' && num > availableQuestions.length}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            quizLimit === num
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100'
                          }`}
                        >
                          {num === 'all' ? `All (${availableQuestions.length})` : num}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button onClick={startQuiz} disabled={availableQuestions.length === 0} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Icons.Play /> Start Quiz {quizLimit !== 'all' && quizLimit <= availableQuestions.length ? `(${quizLimit} questions)` : ''}
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
                  <div className="max-w-3xl mx-auto">
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
                        
                        {/* Mastery & Spaced Repetition Info */}
                        {currentQuestion && (() => {
                          const sr = srDataMap.get(currentQuestion.id);
                          const mastery = getMasteryLabel(
                            sr?.total_correct ?? 0,
                            sr?.correct_streak ?? 0,
                            sr?.mastered ?? false
                          );
                          const nextReview = getNextReviewLabel(sr?.next_review);
                          
                          return (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl flex flex-wrap items-center gap-3 text-sm">
                              {/* Mastery Status */}
                              <div className="flex items-center gap-2">
                                <Icons.Trophy />
                                <span className={`font-medium ${
                                  mastery.color === 'green' ? 'text-green-600' :
                                  mastery.color === 'blue' ? 'text-blue-600' :
                                  mastery.color === 'amber' ? 'text-amber-600' :
                                  'text-gray-500'
                                }`}>
                                  {mastery.label}
                                </span>
                                {!sr?.mastered && (
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        mastery.color === 'blue' ? 'bg-blue-500' :
                                        mastery.color === 'amber' ? 'bg-amber-500' :
                                        'bg-gray-400'
                                      }`}
                                      style={{ width: `${mastery.progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                              
                              {/* Next Review */}
                              <div className="flex items-center gap-2 text-gray-500">
                                <Icons.Clock />
                                <span>Next review: {nextReview}</span>
                              </div>
                              
                              {/* Streak indicator */}
                              {(sr?.correct_streak ?? 0) > 0 && (
                                <div className="flex items-center gap-1 text-orange-500">
                                  <span>🔥</span>
                                  <span className="font-medium">{sr?.correct_streak} streak</span>
                                </div>
                              )}
                              
                              {sr?.mastered && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  ✓ Mastered
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Navigation */}
                    <div className="nav-button-group">
                      <button onClick={() => goToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} 
                        className="btn-secondary flex items-center gap-1 sm:gap-2">
                        <Icons.ChevronLeft /> <span className="hidden sm:inline">Previous</span>
                      </button>
                      <span className="text-sm text-gray-400 font-medium">{currentQuestionIndex + 1} / {quizQuestions.length}</span>
                      {currentQuestionIndex >= quizQuestions.length - 1 ? (
                        <button 
                          onClick={() => setQuizCompleted(true)} 
                          disabled={!showExplanation}
                          className="btn-primary flex items-center gap-1 sm:gap-2 !bg-green-600 hover:!bg-green-700"
                        >
                          <Icons.Check /> <span className="hidden sm:inline">Finish</span>
                        </button>
                      ) : (
                        <button onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex >= quizQuestions.length - 1} 
                          className="btn-primary flex items-center gap-1 sm:gap-2">
                          <span className="hidden sm:inline">Next</span> <Icons.ChevronRight />
                        </button>
                      )}
                    </div>
                    
                    {/* Inline Notes Section */}
                    {showNotePanel && (
                      <NoteEditor
                        content={currentNote}
                        onChange={setCurrentNote}
                        onSave={saveNote}
                        onDelete={deleteCurrentNote}
                        saving={savingNote}
                        hasExistingNote={!!currentQuestionNote}
                        onImageUpload={uploadImage}
                        className="mt-4"
                      />
                    )}
                    
                    {/* Show existing note preview when collapsed */}
                    {!showNotePanel && currentQuestionNote && (
                      <div className="note-box-preview mt-4" onClick={() => setShowNotePanel(true)}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Notes />
                          <span className="font-medium text-gray-700">My Notes</span>
                          <span className="text-xs text-gray-400">(tap to edit)</span>
                        </div>
                        <div 
                          className="text-gray-600 text-sm line-clamp-3 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: currentQuestionNote.content }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Quiz Results */}
              {quizCompleted && (() => {
                const quizScore = quizQuestions.reduce((acc, q) => {
                  const p = progress.find(pr => pr.question_id === q.id);
                  return acc + (p?.answered_correctly ? 1 : 0);
                }, 0);
                const percentage = Math.round((quizScore / quizQuestions.length) * 100);
                const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
                const gradeColor = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600';
                const gradeBg = percentage >= 70 ? 'bg-green-50' : percentage >= 50 ? 'bg-amber-50' : 'bg-red-50';
                
                return (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="elevated-card max-w-md w-full p-6 sm:p-8 text-center animate-slideUp">
                      <div className={`w-24 h-24 ${gradeBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        <span className={`text-5xl font-bold ${gradeColor}`}>{grade}</span>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
                      <p className="text-gray-500 mb-6">Here's how you did</p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-2xl font-bold text-gray-800">{quizScore}</p>
                          <p className="text-xs text-gray-500">Correct</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-2xl font-bold text-gray-800">{quizQuestions.length - quizScore}</p>
                          <p className="text-xs text-gray-500">Wrong</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className={`text-2xl font-bold ${gradeColor}`}>{percentage}%</p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      
                      {/* Mastery gained this session */}
                      {(() => {
                        const newlyMastered = quizQuestions.filter(q => {
                          const sr = srDataMap.get(q.id);
                          return sr?.mastered;
                        }).length;
                        if (newlyMastered > 0) {
                          return (
                            <div className="mb-6 p-3 bg-green-50 rounded-xl">
                              <p className="text-green-700 font-medium">🏆 {newlyMastered} question{newlyMastered > 1 ? 's' : ''} mastered!</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { setQuizCompleted(false); setCurrentView('quiz-setup'); }}
                          className="btn-secondary flex-1"
                        >
                          New Quiz
                        </button>
                        <button 
                          onClick={() => { setQuizCompleted(false); setCurrentView('question-list'); }}
                          className="btn-secondary flex-1"
                        >
                          Review
                        </button>
                        <button 
                          onClick={() => { setQuizCompleted(false); setCurrentView('dashboard'); }}
                          className="btn-primary flex-1"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">My Notes</h2>
                <button 
                  onClick={() => { setExportCategories([]); setShowExportModal(true); }}
                  className="btn-secondary flex items-center gap-2"
                  disabled={notes.length === 0}
                >
                  <Icons.Download /> Export PDF
                </button>
              </div>
              
              {/* Search and Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input type="text" placeholder="Search notes..." value={searchQuery} onChange={handleSearchChange} className="input-field pl-11" />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Search /></div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={noteSortBy} 
                    onChange={(e) => setNoteSortBy(e.target.value as 'date' | 'category' | 'title')}
                    className="input-field py-2 px-3 text-sm"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="category">Sort by Category</option>
                    <option value="title">Sort by Title</option>
                  </select>
                  <button 
                    onClick={() => setNoteSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="btn-secondary px-3"
                    title={noteSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {noteSortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* Expand/Collapse All */}
              {filteredNotes.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={expandAllNotes} className="text-sm text-blue-600 hover:text-blue-700">
                    Expand all
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={collapseAllNotes} className="text-sm text-gray-500 hover:text-gray-700">
                    Collapse all
                  </button>
                </div>
              )}

              {filteredNotes.length === 0 ? (
                <div className="text-center py-16"><p className="text-gray-400">No notes yet</p></div>
              ) : (
                <div className="grid gap-4">
                  {filteredNotes.map(n => {
                    const isExpanded = expandedNotes.has(n.id);
                    const relatedQuestion = getQuestionForNote(n);
                    
                    return (
                      <div key={n.id} className="elevated-card overflow-hidden">
                        {/* Collapsible Header */}
                        <button 
                          onClick={() => toggleNoteExpanded(n.id)}
                          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{n.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {n.category && (
                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                  {CATEGORY_INFO[n.category as keyof typeof CATEGORY_INFO]?.name || n.category}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">{new Date(n.updated_at).toLocaleDateString()}</span>
                              {relatedQuestion && (
                                <span className="text-xs text-purple-500">• Has question</span>
                              )}
                            </div>
                          </div>
                          <div className={`ml-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <Icons.ChevronDown />
                          </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-100">
                            {editingNoteId === n.id ? (
                              /* Edit Mode */
                              <div className="p-4 sm:p-5">
                                <NoteEditor
                                  content={editingNoteContent}
                                  onChange={setEditingNoteContent}
                                  onSave={saveEditingNote}
                                  onCancel={cancelEditingNote}
                                  saving={savingEditNote}
                                  hasExistingNote={true}
                                  onImageUpload={uploadImage}
                                  showHeader={false}
                                />
                              </div>
                            ) : (
                              /* View Mode */
                              <div className="p-4 sm:p-5">
                                {/* Related Question */}
                                {relatedQuestion && (
                                  <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Icons.FileText />
                                      <span className="text-sm font-medium text-blue-700">Related Question</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{relatedQuestion.question_text}</p>
                                    {relatedQuestion.options && (
                                      <div className="mt-3 space-y-1">
                                        {Object.entries(relatedQuestion.options).map(([key, value]) => (
                                          <div 
                                            key={key} 
                                            className={`text-xs px-3 py-1.5 rounded ${
                                              key === relatedQuestion.correct_answer 
                                                ? 'bg-green-100 text-green-700 font-medium' 
                                                : 'text-gray-600'
                                            }`}
                                          >
                                            <span className="font-medium">{key.toUpperCase()}.</span> {value}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {relatedQuestion.explanation && (
                                      <div className="mt-3 pt-3 border-t border-blue-200">
                                        <p className="text-xs text-gray-600 italic">{relatedQuestion.explanation}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Note Content */}
                                <div 
                                  className="text-gray-600 text-sm prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: n.content }}
                                />

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                  <button onClick={() => startEditingNote(n)} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1">
                                    <Icons.Edit /> Edit
                                  </button>
                                  <button 
                                    onClick={async () => { if (confirm('Delete this note?')) { await supabase.from('notes').delete().eq('id', n.id); loadData(); }}} 
                                    className="btn-secondary text-sm py-2 px-3 flex items-center gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Icons.Trash /> Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Export Modal */}
              {showExportModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
                  <div className="elevated-card max-w-md w-full p-6 animate-slideUp">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Export Notes to PDF</h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      Select categories to export, or leave empty to export all notes.
                    </p>

                    <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                      {Object.entries(notesByCategory).map(([cat, catNotes]) => {
                        const catName = CATEGORY_INFO[cat as keyof typeof CATEGORY_INFO]?.name || 'Uncategorized';
                        const isSelected = exportCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              if (isSelected) {
                                setExportCategories(prev => prev.filter(c => c !== cat));
                              } else {
                                setExportCategories(prev => [...prev, cat]);
                              }
                            }}
                            className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-all ${
                              isSelected 
                                ? 'bg-blue-50 border-2 border-blue-500' 
                                : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                            }`}
                          >
                            <span className="font-medium text-gray-700">{catName}</span>
                            <span className="text-sm text-gray-500">{catNotes.length} notes</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowExportModal(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={exportNotesToPdf}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Icons.Download /> Export {exportCategories.length > 0 ? `(${exportCategories.length})` : 'All'}
                      </button>
                    </div>
                  </div>
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
                <StatCard label="Mastered" value={srStats.masteredCount} gradient="stat-gradient-green" />
                <StatCard label="Due for Review" value={srStats.dueCount} gradient="stat-gradient-purple" />
                <StatCard label="Accuracy" value={`${stats.accuracy}%`} gradient="stat-gradient-amber" />
              </div>
              
              {/* Mastery Overview */}
              <div className="elevated-card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Mastery Overview</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-3xl font-bold text-green-600">{srStats.masteredCount}</p>
                    <p className="text-sm text-gray-600">Mastered</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-xl">
                    <p className="text-3xl font-bold text-amber-600">{stats.attempted - srStats.masteredCount}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-3xl font-bold text-gray-600">{questions.length - stats.attempted}</p>
                    <p className="text-sm text-gray-600">Not Started</p>
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(srStats.masteredCount / Math.max(questions.length, 1)) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${((stats.attempted - srStats.masteredCount) / Math.max(questions.length, 1)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Mastery requires 3 correct answers with at least 2 consecutive correct answers (double streak)
                </p>
              </div>
              
              {/* Spaced Repetition Stats */}
              <div className="elevated-card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Spaced Repetition</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.Clock />
                      <span className="font-medium text-gray-700">Due for Review</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{srStats.dueCount}</p>
                    <p className="text-sm text-gray-500 mt-1">Questions ready for optimal review</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.XCircle />
                      <span className="font-medium text-gray-700">Previously Wrong</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{srStats.wrongCount}</p>
                    <p className="text-sm text-gray-500 mt-1">Questions to reinforce</p>
                  </div>
                </div>
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
