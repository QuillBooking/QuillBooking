// // @ts-nocheck

// /**
//  * WordPress dependencies
//  */
// import { useEffect, useState } from '@wordpress/element';

// const EmailEditor = ({ message, onChange }: { message: string; onChange: (content: string) => void }) => {
//     const [restoreTextMode, setRestoreTextMode] = useState<boolean>(false);
//     // Random ID to avoid conflicts
//     const editorId = `email-editor-${Math.floor(Math.random() * 100000)}`;

//     useEffect(() => {
//         if (window.tinymce.get(editorId)) {
//             setRestoreTextMode(window.tinymce.get(editorId).isHidden());
//             window.wp.oldEditor.remove(editorId);
//         }

//         window.wp.oldEditor.initialize(editorId, {
//             tinymce: {
//                 toolbar1:
//                     "formatselect | styleselect | bold italic strikethrough | forecolor backcolor | link | alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | insert ast_placeholders | fontsizeselect",
//                 toolbar2:
//                     'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
//                 height: 300, // Set initial height
//                 setup: function (editor) {
//                     editor.on('init', function () {
//                         editor.getContainer().style.minHeight = '300px'; // Set min height
//                     });
//                 },
//                 urlconverter_callback: (url, node, on_save) => {
//                     // Check for merge tag format and strip protocol if necessary
//                     if (url.startsWith('http://{{') || url.startsWith('https://{{')) {
//                         url = url.replace(/^https?:\/\//, ''); // Remove the http or https prefix
//                     }

//                     // Return the cleaned or original URL
//                     return url;
//                 },
//             },
//             quicktags: true,
//             mediaButtons: true,
//         });

//         const editor = window.tinymce.get(editorId);
//         if (editor?.initialized) {
//             onInit();
//         } else if (editor) {
//             editor.on('init', onInit);
//         }
//     }, []);

//     const onInit = () => {
//         const editor = window.tinymce.get(editorId);

//         if (restoreTextMode) {
//             window.switchEditors.go(editorId, 'html');
//         }

//         editor.on('NodeChange', debounce(() => {
//             const content = editor.getContent({ format: 'html' }); // Fetch as HTML
//             onChange(content); // Pass it back
//         }, 250));
//     }

//     // Debounce function with proper typing
//     const debounce = (fn: Function, delay: number) => {
//         let timer: NodeJS.Timeout | null = null;
//         return function () {
//             const context = this;
//             const args = arguments;
//             if (timer) {
//                 clearTimeout(timer);
//             }
//             timer = setTimeout(() => {
//                 fn.apply(context, args);
//             }, delay);
//         };
//     }

//     return (
//         <textarea
//         title='editor'
//             className='wp-editor-area'
//             id={editorId}
//             value={message}
//             onChange={({ target: { message } }) => {
//                 onChange(message);
//             }}
//         />
//     );
// }

// export default EmailEditor;

import { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LinkNode } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { ToolbarPlugin } from './ToolbarPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $generateNodesFromDOM, $generateHtmlFromNodes } from '@lexical/html';

import "./style.scss";

// Theme and styling for the editor
const theme = {
    // Theme properties to match your Figma design
    paragraph: 'editor-paragraph',
    text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
    },
    list: {
        ul: 'editor-list-ul',
        ol: 'editor-list-ol',
    },
};

function InitialContentPlugin({ initialContent }) {
    const [editor] = useLexicalComposerContext();
  
    useEffect(() => {
      if (!initialContent) return;
  
      editor.update(() => {
        try {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialContent, 'text/html');
          
          // Check if parsing produced any valid content
          const hasContent = dom.body && dom.body.childNodes.length > 0;
          
          if (!hasContent) {
            // Handle empty/whitespace content
            const root = $getRoot();
            root.clear();
            root.append($createParagraphNode());
            return;
          }
  
          // Generate nodes from the parsed DOM
          const nodes = $generateNodesFromDOM(editor, dom);
  
          const root = $getRoot();
          root.clear();
  
          if (nodes.length === 0) {
            // Fallback for when no nodes are generated
            const textNode = $createTextNode(dom.body.textContent || '');
            const paragraph = $createParagraphNode();
            paragraph.append(textNode);
            root.append(paragraph);
            return;
          }
  
          // Process nodes to ensure they're valid for insertion
          const validNodes = nodes.map(node => {
            // Wrap text nodes in paragraphs
            if (node.getType() === 'text') {
              const paragraph = $createParagraphNode();
              paragraph.append(node);
              return paragraph;
            }
            return node;
          });
  
          // Insert all valid nodes
          validNodes.forEach(node => root.append(node));
  
          // Ensure we always have at least one paragraph
          if (root.getChildrenSize() === 0) {
            root.append($createParagraphNode());
          }
  
        } catch (error) {
          console.error('Error initializing content:', error);
          // Fallback to empty editor state
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        }
      });
    }, [editor, initialContent]);
  
    return null;
  }

  function HtmlSerializerPlugin({ onChange }) {
    const [editor] = useLexicalComposerContext();
  
    useEffect(() => {
      return editor.registerUpdateListener(({ editorState }) => {
        // Using a timeout to avoid excessive serialization during typing
        const timeoutId = setTimeout(() => {
          editorState.read(async () => {
            const htmlString = $generateHtmlFromNodes(editor);
            onChange(htmlString);
          });
        }, 250);
  
        return () => clearTimeout(timeoutId);
      });
    }, [editor, onChange]);
  
    return null;
  }

export default function EmailEditor({ message, onChange }) {
    const [editorActive, setEditorActive] = useState(false);
    const [htmlContent, setHtmlContent] = useState(message || '');

    const initialConfig = {
        namespace: 'EmailBodyEditor',
        theme,
        onError: (error) => console.error(error),
        nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            LinkNode,
        ],
    };

    const handleEditorChange = (editorState) => {
        editorState.read(() => {
            const root = $getRoot();
            const content = root.getTextContent();
            if (onChange) onChange(content);
        });
    };

    const handleHtmlChange = (html) => {
        setHtmlContent(html);
        // You can also pass this to parent component if needed
        // if (onChange) onChange(html);
    };

    return (
        <div className="email-body-editor">
            {editorActive ? (
                <LexicalComposer initialConfig={initialConfig}>
                    <div className="editor-container">
                        <ToolbarPlugin />
                        <div className="editor-inner">
                            <RichTextPlugin
                                contentEditable={
                                    <ContentEditable
                                        className="editor-input"
                                        onFocus={() => setEditorActive(true)}
                                    />
                                }
                                placeholder={
                                    <div className="editor-placeholder">Type your message here...</div>
                                }
                            />
                            <OnChangePlugin onChange={handleEditorChange} />
                            <HtmlSerializerPlugin onChange={handleHtmlChange} />
                            <HistoryPlugin />
                            <ListPlugin />
                            <LinkPlugin />
                            <InitialContentPlugin initialContent={message} />
                        </div>
                    </div>
                </LexicalComposer>
            ) : (
                <div
                    className="rendered-html-preview"
                    onClick={() => setEditorActive(true)}
                    dangerouslySetInnerHTML={{ __html: message }}
                    style={{
                        cursor: 'text',
                        padding: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontFamily: 'inherit',
                    }}
                />
            )}
        </div>
    );
}