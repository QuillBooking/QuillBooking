import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';

interface HtmlSerializerProps {
  onChange: (html: string) => void;
}

export default function HtmlSerializer({ onChange }: HtmlSerializerProps) {
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHtmlRef = useRef<string>('');
  
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      // Clear any existing timeout to prevent multiple rapid updates
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Debounce the serialization to avoid performance issues
      timeoutRef.current = setTimeout(() => {
        editorState.read(() => {
          try {
            const htmlString = $generateHtmlFromNodes(editor);
            
            // Only trigger onChange if the HTML actually changed
            if (htmlString !== lastHtmlRef.current) {
              lastHtmlRef.current = htmlString;
              onChange(htmlString);
            }
          } catch (error) {
            console.error('Error serializing HTML:', error);
            // Optionally provide a fallback empty HTML if serialization fails
            onChange('<p></p>');
          }
        });
      }, 250);
    });
  }, [editor, onChange]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}