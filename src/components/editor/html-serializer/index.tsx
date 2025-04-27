import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';

interface HtmlSerializerProps {
  onChange: (html: string) => void;
}

export default function HtmlSerializer({ onChange }: HtmlSerializerProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const timeoutId = setTimeout(() => {
        editorState.read(() => {
          try {
            const htmlString = $generateHtmlFromNodes(editor);
            onChange(htmlString);
          } catch (error) {
            console.error('Error serializing HTML:', error);
          }
        });
      }, 250);

      return () => clearTimeout(timeoutId);
    });
  }, [editor, onChange]);

  return null;
}