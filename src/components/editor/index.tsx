import { useEffect, useState, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot } from 'lexical';
import { ToolbarPlugin } from './ToolbarPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TextNode } from 'lexical';
import { MentionNode } from './mention-node';
import { ImageNode } from './img-node';
import AutoLinkMatchers from './autolink-plugin';
import HtmlSerializer from './html-serializer';
import InitialContentPlugin from './initial-content-plugin';
import WordCountPlugin from './word-count';

import "./style.scss";
import { Flex } from 'antd';

const theme = {
  paragraph: 'editor-paragraph',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-linethrough',
    fontFamily: 'editor-text-font-family',
    lineHeight: 'editor-text-line-height',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    checklist: 'editor-list-checklist',
  },
};

interface EditorProps {
  message: string;
  onChange: (html: string) => void;
  type: string;
}

export default function Editor({ message, onChange, type }: EditorProps) {
  const [editorActive, setEditorActive] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  // Keep track of the initial load to prevent resetting content during editing
  const initialLoadRef = useRef(true);
  // Store initial message to compare if it changes from parent
  const initialMessageRef = useRef(message);

  const initialConfig = {
    namespace: 'EmailBodyEditor',
    theme,
    onError: (error: Error) => console.error(error),
    nodes: [
      HeadingNode,
      ListNode,
      AutoLinkNode,
      ListItemNode,
      TextNode,
      QuoteNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      LinkNode,
      MentionNode,
      ImageNode,
    ],
  };

  const handleEditorChange = (editorState: any) => {
    editorState.read(() => {
      const root = $getRoot();
      const content = root.getTextContent();
      const words = content.split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    });
  };

  const handleHtmlChange = (html: string) => {
    if (onChange) onChange(html);
  };

  const countWordsInHtml = (html: string) => {
    if (!html) return 0;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  useEffect(() => {
    if (!editorActive) {
      const count = countWordsInHtml(message);
      setWordCount(count);
    }
  }, [editorActive, message]);

  // Check if message was changed externally (not from this editor's onChange)
  useEffect(() => {
    // Skip the first render and during active editing
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Only update the editor if the message prop changes from an external source
    // and the editor is not currently focused/active
    if (!editorActive && message !== initialMessageRef.current) {
      initialMessageRef.current = message;
    }
  }, [message, editorActive]);

  return (
    <div className="email-body-editor">
      <LexicalComposer initialConfig={initialConfig}>
        <div className='editor-container'>
          {type == 'email' && (
            <ToolbarPlugin type={type} />
          )}
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="editor-input"
                  onFocus={() => setEditorActive(true)}
                  onBlur={() => setEditorActive(false)}
                />
              }
              placeholder={<div className="editor-placeholder">Enter content here...</div>}
              ErrorBoundary={({ children }) => (
                <div className="editor-error">
                  {children}
                </div>
              )}
            />
            <OnChangePlugin onChange={handleEditorChange} />
            <HtmlSerializer onChange={handleHtmlChange} />
            <HistoryPlugin />
            {type === 'email' && (
              <>
                <ListPlugin />
                <LinkPlugin />
                <AutoLinkMatchers />
                <CheckListPlugin />
              </>
            )}
            {/* Only load initial content once when the component mounts */}
            {initialLoadRef.current && <InitialContentPlugin initialContent={initialMessageRef.current} />}
          </div>
          <Flex justify="space-between" align='center' className="bg-[#FCFCFC] border-t py-2 px-5 text-[#1A1A1AB2]">
            <WordCountPlugin wordCount={wordCount} />
            {type == 'sms' && (
              <ToolbarPlugin type={type} />
            )}
          </Flex>
        </div>
      </LexicalComposer>
    </div>
  );
}