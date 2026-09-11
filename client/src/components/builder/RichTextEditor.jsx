import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const RichTextEditor = ({ content, onChange, placeholder = 'Type here...' }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || `<p>${placeholder}</p>`,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none',
      },
    },
  });

  return (
    <div className="relative group/editor">
      {editor && (
        <div className="absolute -top-8 left-0 hidden group-hover/editor:flex space-x-1 bg-gray-800 text-white rounded px-2 py-1 z-20 shadow">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive('bold') ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 text-xs italic rounded ${editor.isActive('italic') ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 text-xs rounded ${editor.isActive('bulletList') ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
          >
            • List
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
