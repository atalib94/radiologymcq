'use client';

import { useEditor, EditorContent, BubbleMenu, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useCallback, useEffect, useRef, useState } from 'react';

// Icons
const Icons = {
  Bold: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg>,
  Italic: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M10 4h4m2 0l-6 16m-2 0h4" /></svg>,
  Underline: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M7 4v7a5 5 0 0010 0V4M5 21h14" /></svg>,
  BulletList: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  OrderedList: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6h.008v.008H3.75V6zm0 5.25h.008v.008H3.75v-.008zm0 5.25h.008v.008H3.75v-.008z" /></svg>,
  Image: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  Heading: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 6V18M4 12H14M14 6V18" /></svg>,
  Undo: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>,
  Redo: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>,
};

// Resizable Image Component
const ResizableImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = imageRef.current?.offsetWidth || 300;
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(100, Math.min(800, startWidthRef.current + diff));
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, updateAttributes]);

  return (
    <NodeViewWrapper className="resizable-image-wrapper" data-drag-handle>
      <div className={`resizable-image-container ${selected ? 'selected' : ''}`} style={{ width: node.attrs.width || 'auto' }}>
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={{ width: '100%', height: 'auto' }}
          draggable={false}
        />
        {/* Resize handles */}
        <div className="resize-handle resize-handle-right" onMouseDown={handleMouseDown}>
          <div className="resize-handle-inner" />
        </div>
        <div className="resize-handle resize-handle-left" onMouseDown={handleMouseDown}>
          <div className="resize-handle-inner" />
        </div>
        {/* Size indicator */}
        {(selected || isResizing) && node.attrs.width && (
          <div className="size-indicator">{Math.round(node.attrs.width)}px</div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// Custom Image Extension with resize support
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width') || element.style.width?.replace('px', '') || null,
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { width: attributes.width, style: `width: ${attributes.width}px` };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string | null>;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  onImageUpload,
  placeholder = 'Start typing your notes...',
  className = '',
  minHeight = '200px'
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!isUpdatingRef.current) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'editor-content',
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync content from props
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      isUpdatingRef.current = true;
      editor.commands.setContent(content);
      isUpdatingRef.current = false;
    }
  }, [content, editor]);

  // Handle image paste
  useEffect(() => {
    if (!editor) return;
    
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const url = await onImageUpload(file);
            if (url) {
              editor.chain().focus().setImage({ src: url } as any).run();
            }
          }
          return;
        }
      }
    };

    const handleDrop = async (event: DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (file.type.startsWith('image/')) {
        event.preventDefault();
        const url = await onImageUpload(file);
        if (url) {
          editor.chain().focus().setImage({ src: url } as any).run();
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('paste', handlePaste as any);
    editorElement.addEventListener('drop', handleDrop as any);
    return () => {
      editorElement.removeEventListener('paste', handlePaste as any);
      editorElement.removeEventListener('drop', handleDrop as any);
    };
  }, [editor, onImageUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      onImageUpload(file).then(url => {
        if (url) {
          editor.chain().focus().setImage({ src: url } as any).run();
        }
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [editor, onImageUpload]);

  if (!editor) return <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />;

  const ToolbarButton = ({ onClick, isActive = false, disabled = false, title, children }: {
    onClick: () => void; isActive?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`p-1.5 rounded transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-gray-200 mx-1" />;

  return (
    <div className={`rich-text-editor border border-gray-200 rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Icons.Undo />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Icons.Redo />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Icons.Bold />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Icons.Italic />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <Icons.Underline />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading">
          <Icons.Heading />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
          <Icons.BulletList />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
          <Icons.OrderedList />
        </ToolbarButton>

        <Divider />

        {/* Highlight colors */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} 
          isActive={editor.isActive('highlight', { color: '#fef08a' })} title="Yellow highlight">
          <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-400" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#bbf7d0' }).run()}
          isActive={editor.isActive('highlight', { color: '#bbf7d0' })} title="Green highlight">
          <div className="w-4 h-4 rounded bg-green-200 border border-green-400" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#fecaca' }).run()}
          isActive={editor.isActive('highlight', { color: '#fecaca' })} title="Red highlight">
          <div className="w-4 h-4 rounded bg-red-200 border border-red-400" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insert Image">
          <Icons.Image />
        </ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        
        <span className="ml-auto text-xs text-gray-400 hidden sm:inline">Drag edges to resize images</span>
      </div>

      {/* Bubble menu for selected text */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}
        className="bg-gray-800 rounded-lg shadow-lg flex items-center gap-0.5 p-1">
        <button onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-white ${editor.isActive('bold') ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>
          <Icons.Bold />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded text-white ${editor.isActive('italic') ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>
          <Icons.Italic />
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded text-white ${editor.isActive('underline') ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>
          <Icons.Underline />
        </button>
        <button onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
          className={`p-1.5 rounded ${editor.isActive('highlight') ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>
          <div className="w-3 h-3 rounded bg-yellow-300" />
        </button>
      </BubbleMenu>

      {/* Editor content */}
      <EditorContent editor={editor} className="p-4" />

      <style jsx global>{`
        .editor-content {
          outline: none;
        }
        .editor-content p {
          margin: 0.5em 0;
        }
        .editor-content h1, .editor-content h2, .editor-content h3 {
          font-weight: 600;
          margin: 1em 0 0.5em;
          line-height: 1.3;
        }
        .editor-content h1 { font-size: 1.5em; }
        .editor-content h2 { font-size: 1.25em; }
        .editor-content h3 { font-size: 1.1em; }
        .editor-content ul, .editor-content ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .editor-content li { margin: 0.25em 0; }
        .editor-content li p { margin: 0; }
        .editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .editor-content mark {
          border-radius: 0.2em;
          padding: 0.1em 0.2em;
          box-decoration-break: clone;
        }
        .editor-content strong { font-weight: 600; }
        .editor-content em { font-style: italic; }
        .editor-content u { text-decoration: underline; }
        .ProseMirror { outline: none; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .tippy-box { background: transparent !important; }
        .tippy-content { padding: 0 !important; }
        
        /* Resizable Image Styles */
        .resizable-image-wrapper {
          display: block;
          margin: 0.75em 0;
        }
        .resizable-image-container {
          position: relative;
          display: inline-block;
          max-width: 100%;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .resizable-image-container.selected {
          box-shadow: 0 0 0 2px #3b82f6;
        }
        .resizable-image-container img {
          display: block;
          border-radius: 8px;
        }
        .resize-handle {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 12px;
          cursor: ew-resize;
          opacity: 0;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .resize-handle-right {
          right: 0;
        }
        .resize-handle-left {
          left: 0;
        }
        .resize-handle-inner {
          width: 4px;
          height: 40px;
          max-height: 50%;
          background: #3b82f6;
          border-radius: 2px;
        }
        .resizable-image-container:hover .resize-handle,
        .resizable-image-container.selected .resize-handle {
          opacity: 1;
        }
        .size-indicator {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
