/**
 *  External dependencies
 */
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';

interface HtmlSerializerProps {
  onChange: (html: string) => void;
  onWordCountChange?: (count: number) => void;
}

export default function HtmlSerializer({ onChange, onWordCountChange }: HtmlSerializerProps) {
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
            
            // Count words from the HTML consistently
            if (onWordCountChange) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = htmlString;
              const text = tempDiv.textContent || tempDiv.innerText || '';
              const words = text.split(/\s+/).filter(word => word.length > 0);
              onWordCountChange(words.length);
            }
            
            // Only trigger onChange if the HTML actually changed
            if (htmlString !== lastHtmlRef.current) {
              lastHtmlRef.current = htmlString;
              onChange(htmlString);
            }
          } catch (error) {
            console.error('Error serializing HTML:', error);
            // Optionally provide a fallback empty HTML if serialization fails
            onChange('<p></p>');
            if (onWordCountChange) {
              onWordCountChange(0);
            }
          }
        });
      }, 250);
    });
  }, [editor, onChange, onWordCountChange]);

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