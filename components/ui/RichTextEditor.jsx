"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// REMOVED: Underline extension is no longer needed
import React from 'react';
// REMOVED: UnderlineIcon is no longer needed
import { Bold, Italic, List, ListOrdered, Strikethrough } from 'lucide-react'; 

// Toolbar component for editor controls
const Toolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const ToggleButton = ({ editor, name, icon: Icon, params }) => (
    <button
      onClick={() => editor.chain().focus()[`toggle${name}`](params).run()}
      disabled={!editor.can().chain().focus()[`toggle${name}`](params).run()}
      className={`p-2 rounded-md ${editor.isActive(name.toLowerCase(), params) ? 'bg-muted' : 'hover:bg-muted'}`}
      type="button"
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex items-center gap-1 border-b p-2">
      <ToggleButton editor={editor} name="Bold" icon={Bold} />
      <ToggleButton editor={editor} name="Italic" icon={Italic} />
      <ToggleButton editor={editor} name="Strike" icon={Strikethrough} />
      {/* <ToggleButton editor={editor} name="BulletList" icon={List} />
      <ToggleButton editor={editor} name="OrderedList" icon={ListOrdered} /> */}
    </div>
  );
};

// The main editor component
export const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
     
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none p-4 min-h-[120px] max-w-full',
      },
    },
    immediatelyRender: false,
  });

  return (
    <div className="rounded-md border border-input bg-background">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};