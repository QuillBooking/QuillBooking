import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import { $wrapNodes } from '@lexical/selection';
import { $patchStyleText } from '@lexical/selection';
import {
  $createParagraphNode,
  $getRoot,
  $createTextNode,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { $createLinkNode, $isLinkNode } from '@lexical/link';

export const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontColor, setFontColor] = useState('#000000');

  // Update format states based on selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
    }
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const onFontSizeChange = useCallback(
    (e) => {
      setFontSize(e.target.value);
      // Apply font size to selected text
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            'font-size': e.target.value,
          });
        }
      });
    },
    [activeEditor]
  );

  const onFontFamilyChange = useCallback(
    (e) => {
      setFontFamily(e.target.value);
      // Apply font family to selected text
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            'font-family': e.target.value,
          });
        }
      });
    },
    [activeEditor]
  );

  // Define toolbar buttons
  const formatBold = () => {
    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = () => {
    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const formatUnderline = () => {
    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const formatStrikethrough = () => {
    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  };

  const insertLink = () => {
    const url = prompt('Enter URL');
    if (url) {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $createLinkNode(url, {
            rel: 'noopener noreferrer',
            target: '_blank',
          });
        }
      });
    }
  };

  const insertImage = () => {
    // This would typically open a file dialog
    alert('Image upload functionality would go here');
  };

  const formatParagraph = () => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createParagraphNode());
      }
    });
  };

  const formatBulletList = () => {
    activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
  };

  const formatNumberedList = () => {
    activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
  };

  const formatChecklist = () => {
    // Implement checklist logic
    // This is a placeholder as Lexical doesn't have built-in checklist
    alert('Checklist functionality would go here');
  };

  // Alignment commands
  const alignLeft = () => {
    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
  };

  const alignCenter = () => {
    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
  };

  const alignRight = () => {
    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
  };

  const alignJustify = () => {
    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
  };

  const formatIndent = () => {
    // Implement indent logic
    alert('Indent functionality would go here');
  };

  const formatOutdent = () => {
    // Implement outdent logic
    alert('Outdent functionality would go here');
  };

  const clearFormatting = () => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.hasFormat('bold')) node.toggleFormat('bold');
          if (node.hasFormat('italic')) node.toggleFormat('italic');
          if (node.hasFormat('underline')) node.toggleFormat('underline');
          if (node.hasFormat('strikethrough')) node.toggleFormat('strikethrough');
        });
      }
    });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-item-group">
        <button
          className="toolbar-item"
          onClick={() => activeEditor.dispatchCommand(UNDO_COMMAND)}
          title="Undo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 0 0-9-9H3"></path>
          </svg>
        </button>
        <button
          className="toolbar-item"
          onClick={() => activeEditor.dispatchCommand(REDO_COMMAND)}
          title="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 0 1 9-9h9"></path>
          </svg>
        </button>
      </div>

      <div className="toolbar-item-group">
        <button className="toolbar-item" title="Print">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
        </button>
        <button className="toolbar-item" title="Spellcheck">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 12V5l4 6 4-6v7"></path>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </div>

      <div className="toolbar-item-group zoom">
        <select className="toolbar-select" title="Zoom Level">
          <option>100%</option>
          <option>125%</option>
          <option>150%</option>
          <option>175%</option>
          <option>200%</option>
        </select>
      </div>

      <div className="toolbar-item-group format">
        <select className="toolbar-select" title="Paragraph Format" onChange={formatParagraph}>
          <option>Paragraph text</option>
          <option>Heading 1</option>
          <option>Heading 2</option>
          <option>Heading 3</option>
        </select>
        <select className="toolbar-select" title="Font Family" value={fontFamily} onChange={onFontFamilyChange}>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div className="toolbar-item-group size-controls">
        <button className="toolbar-item" onClick={() => onFontSizeChange({ target: { value: parseInt(fontSize) - 1 + 'px' } })} title="Decrease Font Size">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <span className="font-size">00</span>
        <button className="toolbar-item" onClick={() => onFontSizeChange({ target: { value: parseInt(fontSize) + 1 + 'px' } })} title="Increase Font Size">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-item-group text-formatting">
        <button
          className={`toolbar-item ${isBold ? 'active' : ''}`}
          onClick={formatBold}
          title="Bold"
        >
          <span style={{ fontWeight: 'bold' }}>B</span>
        </button>
        <button
          className={`toolbar-item ${isItalic ? 'active' : ''}`}
          onClick={formatItalic}
          title="Italic"
        >
          <span style={{ fontStyle: 'italic' }}>I</span>
        </button>
        <button
          className={`toolbar-item ${isUnderline ? 'active' : ''}`}
          onClick={formatUnderline}
          title="Underline"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>
        <button
          className={`toolbar-item ${isStrikethrough ? 'active' : ''}`}
          onClick={formatStrikethrough}
          title="Strikethrough"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>
        <button className="toolbar-item color-button" title="Text Color">
          <div className="color-indicator" style={{ backgroundColor: '#0066FF' }}></div>
        </button>
      </div>

      <div className="toolbar-item-group link-image">
        <button className="toolbar-item" onClick={insertLink} title="Insert Link">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </button>
        <button className="toolbar-item" onClick={insertImage} title="Insert Image">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-item-group lists">
        <button className="toolbar-item dropdown" title="Bullet List" onClick={formatBulletList}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3" y2="6"></line>
            <line x1="3" y1="12" x2="3" y2="12"></line>
            <line x1="3" y1="18" x2="3" y2="18"></line>
          </svg>
        </button>
        <button className="toolbar-item dropdown" title="Numbered List" onClick={formatNumberedList}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </button>
        <button className="toolbar-item dropdown" title="Checklist" onClick={formatChecklist}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </button>
      </div>

      <div className="toolbar-item-group alignment">
        <button className="toolbar-item" onClick={alignLeft} title="Align Left">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="17" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="17" y1="18" x2="3" y2="18"></line>
          </svg>
        </button>
        <button className="toolbar-item" onClick={alignCenter} title="Align Center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="10" x2="6" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="18" y1="18" x2="6" y2="18"></line>
          </svg>
        </button>
        <button className="toolbar-item" onClick={alignRight} title="Align Right">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="10" x2="7" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="7" y2="18"></line>
          </svg>
        </button>
        <button className="toolbar-item" onClick={alignJustify} title="Justify">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="3" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="toolbar-item-group indentation">
        <button className="toolbar-item" onClick={formatIndent} title="Increase Indent">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="8" x2="21" y2="8"></line>
            <line x1="3" y1="16" x2="21" y2="16"></line>
            <line x1="13" y1="12" x2="21" y2="12"></line>
            <polyline points="8 12 4 8 8 4"></polyline>
          </svg>
        </button>
        <button className="toolbar-item" onClick={formatOutdent} title="Decrease Indent">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="8" x2="21" y2="8"></line>
            <line x1="3" y1="16" x2="21" y2="16"></line>
            <line x1="13" y1="12" x2="21" y2="12"></line>
            <polyline points="4 12 8 8 4 4"></polyline>
          </svg>
        </button>
        <button className="toolbar-item" onClick={clearFormatting} title="Clear Formatting">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 14l-5-5-5 5"></path>
            <path d="M12 9v9"></path>
            <path d="M5 4h14"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};