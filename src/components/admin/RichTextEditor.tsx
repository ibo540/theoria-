"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react";
import { useEffect, useState } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4",
        style: "color: #ffffff !important;",
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Force text color to be visible after editor mounts
  useEffect(() => {
    if (editor) {
      const setTextColor = () => {
        const editorElement = editor.view.dom;
        if (editorElement) {
          editorElement.style.color = '#ffffff';
          const allElements = editorElement.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            (el as HTMLElement).style.color = '#ffffff';
          });
        }
      };
      
      // Set immediately
      setTextColor();
      
      // Also set after a short delay to ensure it applies
      const timeout = setTimeout(setTextColor, 100);
      
      // Listen for updates
      editor.on('update', setTextColor);
      
      return () => {
        clearTimeout(timeout);
        editor.off('update', setTextColor);
      };
    }
  }, [editor]);

  if (!mounted || !editor) {
    return (
      <div className="border border-slate-600/50 rounded-lg p-4 min-h-[200px] bg-slate-700/30">
        <p className="text-gray-400">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-600/50 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-600/50 bg-slate-700/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-600 transition-colors ${
            editor.isActive("bold") ? "bg-slate-500" : ""
          }`}
          title="Bold"
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive("italic") ? "bg-gray-300" : ""
          }`}
          title="Italic"
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-600 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive("bulletList") ? "bg-gray-300" : ""
          }`}
          title="Bullet List"
          type="button"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive("orderedList") ? "bg-gray-300" : ""
          }`}
          title="Numbered List"
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-600 mx-1" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Undo"
          type="button"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Redo"
          type="button"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="p-4 min-h-[200px] bg-slate-800 rich-text-editor-container">
        <EditorContent editor={editor} />
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .rich-text-editor-container .ProseMirror {
          color: #ffffff !important;
          outline: none;
        }
        .rich-text-editor-container .ProseMirror * {
          color: #ffffff !important;
        }
        .rich-text-editor-container .ProseMirror p {
          color: #ffffff !important;
        }
        .rich-text-editor-container .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af !important;
        }
        .rich-text-editor-container .ProseMirror strong {
          color: #ffffff !important;
        }
        .rich-text-editor-container .ProseMirror em {
          color: #ffffff !important;
        }
        .rich-text-editor-container .ProseMirror ul,
        .rich-text-editor-container .ProseMirror ol {
          color: #ffffff !important;
        }
        .rich-text-editor-container .ProseMirror li {
          color: #ffffff !important;
        }
      `}} />
    </div>
  );
}
