"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';
import { Bold, Italic, List, ListOrdered, Strikethrough } from 'lucide-react';

// Toolbar component for editor controls
const Toolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  // This component is updated to correctly call Tiptap commands
  const ToggleButton = ({ editor, name, icon: Icon, params }) => {
    // Correctly format command names (e.g., "BulletList" -> "toggleBulletList")
    const commandName = `toggle${name}`;
    
    return (
      <button
        onClick={(e) => {
            e.preventDefault();
            editor.chain().focus()[commandName](params).run()
        }}
        disabled={!editor.can()[commandName](params)}
        className={`p-2 rounded-md ${editor.isActive(name.charAt(0).toLowerCase() + name.slice(1), params) ? 'bg-muted' : 'hover:bg-muted'}`}
        type="button"
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1 border-b p-2">
      <ToggleButton editor={editor} name="Bold" icon={Bold} />
      <ToggleButton editor={editor} name="Italic" icon={Italic} />
      <ToggleButton editor={editor} name="Strike" icon={Strikethrough} />
      {/* Uncommented and corrected these buttons */}
      <ToggleButton editor={editor} name="BulletList" icon={List} />
      <ToggleButton editor={editor} name="OrderedList" icon={ListOrdered} />
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