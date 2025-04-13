import { BiUndo, BiRedo } from "react-icons/bi";
import { RiPrinterLine } from "react-icons/ri";
import { LuPaintRoller } from "react-icons/lu";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontColor, setFontColor] = useState('#0066FF');
  const [zoomLevel, setZoomLevel] = useState('100%');
  const [paragraphFormat, setParagraphFormat] = useState('paragraph');

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
    (newSize) => {
      const size = parseInt(newSize);
      setFontSize(String(size));
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            'font-size': `${size}px`,
          });
        }
      });
    },
    [activeEditor]
  );

  const onFontFamilyChange = useCallback(
    (e) => {
      const font = e.target.value;
      setFontFamily(font);
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            'font-family': font,
          });
        }
      });
    },
    [activeEditor]
  );

  const handleFormatChange = useCallback(
    (e) => {
      const format = e.target.value;
      setParagraphFormat(format);
      
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (format === 'paragraph') {
            $wrapNodes(selection, () => $createParagraphNode());
          } else if (format.startsWith('heading')) {
            const headingLevel = parseInt(format.split('-')[1]);
            $wrapNodes(selection, () => $createHeadingNode(headingLevel));
          } else if (format === 'quote') {
            $wrapNodes(selection, () => $createQuoteNode());
          }
        }
      });
    },
    [activeEditor]
  );

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL');
    if (url) {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const linkNode = $createLinkNode(url, {
            rel: 'noopener noreferrer',
            target: '_blank',
          });
          selection.insertNodes([linkNode]);
        }
      });
    }
  }, [activeEditor]);

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.hasFormat('bold')) node.toggleFormat('bold');
          if (node.hasFormat('italic')) node.toggleFormat('italic');
          if (node.hasFormat('underline')) node.toggleFormat('underline');
          if (node.hasFormat('strikethrough')) node.toggleFormat('strikethrough');
          // Clear other formats as needed
        });
        $patchStyleText(selection, {
          'font-size': null,
          'font-family': null,
          'color': null,
          'background-color': null,
        });
      }
    });
  }, [activeEditor]);

  const contentRef = useRef(null);
  
  // Calculate zoom scale as decimal (100% -> 1, 200% -> 2)
  const getZoomScale = () => {
    return parseInt(zoomLevel.replace('%', '')) / 100;
  };
  
  // Handle zoom level change
  const handleZoomChange = (e) => {
    setZoomLevel(e.target.value);
  };

  return (
    <div className="toolbar" style={{
      display: 'flex',
      padding: '20px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #e0e0e0',
      alignItems: 'center',
      justifyContent:"center",
      gap: '10px',
      flexWrap: 'wrap',
      color:"#1A1A1AB2",
    }}>
      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => activeEditor.dispatchCommand(UNDO_COMMAND)}
          title="Undo"
          style={{
            cursor: 'pointer'
          }}
        >
          <BiUndo className="text-[25px]"/>
        </button>
        <button
          onClick={() => activeEditor.dispatchCommand(REDO_COMMAND)}
          title="Redo"
          style={{
            cursor: 'pointer'
          }}
        >
          <BiRedo className="text-[25px]"/>
        </button>
      </div>

      {/* Print/Spell Check */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          title="Print"
          style={{
            cursor: 'pointer'
          }}
        >
          <RiPrinterLine className="text-[25px]"/>
        </button>
        <button 
          title="Paint"
          style={{
            paddingLeft:"5px",
            cursor: 'pointer'
          }}
        >
         <LuPaintRoller className="text-[25px]"/>
        </button>
      </div>

      {/* Zoom dropdown */}
      <div>
        <select 
          value={zoomLevel}
          onChange={handleZoomChange}
          style={{
            border: 'none',
            outline: 'none',
            padding: '4px 5px',
            width:"65px",
            cursor: 'pointer'
          }}
        >
          <option>100%</option>
          <option>125%</option>
          <option>150%</option>
          <option>175%</option>
          <option>200%</option>
        </select>
      </div>

      {/* Paragraph format & Font family */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <select 
          value={paragraphFormat}
          onChange={handleFormatChange}
          style={{
            border: 'none',
            outline:"none",
            padding: '4px 8px',
            backgroundColor: '#F4F4F5',
            width:"125px",
            cursor: 'pointer'
          }}
        >
          <option value="paragraph">Paragraph text</option>
          <option value="heading-1">Heading 1</option>
          <option value="heading-2">Heading 2</option>
          <option value="heading-3">Heading 3</option>
          <option value="quote">Quote</option>
        </select>
        
        <select 
          value={fontFamily}
          onChange={onFontFamilyChange}
          style={{
            border: 'none',
            outline:"none",
            padding: '4px 8px',
            backgroundColor: '#F4F4F5',
            width: '60px',
            cursor: 'pointer'
          }}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      {/* Font Size Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border:"solid #E1E1E2 1px",backgroundColor:"#FCFCFC", borderRadius:"20px" }}>
        <button 
          onClick={() => {
            if (parseInt(fontSize) > 8) {
              onFontSizeChange(parseInt(fontSize) - 1);
            }
          }}
          title="Decrease Font Size"
          style={{
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <span style={{ 
          width: '28px', 
          textAlign: 'center', 
          fontSize: '14px',
          userSelect: 'none'
        }}>
          {fontSize}
        </span>
        <button 
          onClick={() => onFontSizeChange(parseInt(fontSize) + 1)}
          title="Increase Font Size"
          style={{
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Separator */}
      <div style={{ width: '1px', height: '24px', backgroundColor: '#e0e0e0' }}></div>

      {/* Text formatting */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          title="Bold"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px 8px',
            background: isBold ? '#eee' : 'none',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          B
        </button>
        <button 
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          title="Italic"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px 8px',
            background: isItalic ? '#eee' : 'none',
            fontStyle: 'italic',
            cursor: 'pointer'
          }}
        >
          I
        </button>
        <button 
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          title="Underline"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px 8px',
            background: isUnderline ? '#eee' : 'none',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          U
        </button>
        <button 
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          title="Strikethrough"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px 8px',
            background: isStrikethrough ? '#eee' : 'none',
            textDecoration: 'line-through',
            cursor: 'pointer'
          }}
        >
          S
        </button>
        <button 
          title="Text Color"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px 8px',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: fontColor, 
            borderRadius: '2px' 
          }}></div>
        </button>
      </div>

      {/* Link and Image */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          onClick={insertLink}
          title="Insert Link"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </button>
        <button 
          title="Insert Image"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>
      </div>

      {/* Separator */}
      <div style={{ width: '1px', height: '24px', backgroundColor: '#e0e0e0' }}></div>

      {/* Lists */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          onClick={() => activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)}
          title="Bullet List"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        
        <button 
          onClick={() => activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)}
          title="Numbered List"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        
        <button 
          title="Checklist"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {/* Alignment */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
          title="Align Left"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="17" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="17" y1="18" x2="3" y2="18"></line>
          </svg>
        </button>
        <button 
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
          title="Align Center"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="10" x2="6" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="18" y1="18" x2="6" y2="18"></line>
          </svg>
        </button>
        <button 
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
          title="Align Right"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="7" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="7" y2="18"></line>
          </svg>
        </button>
        <button 
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
          title="Justify"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="3" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Indentation */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          title="Increase Indent"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="8" x2="21" y2="8"></line>
            <line x1="3" y1="16" x2="21" y2="16"></line>
            <line x1="13" y1="12" x2="21" y2="12"></line>
            <polyline points="8 12 4 8 8 4"></polyline>
          </svg>
        </button>
        <button 
          title="Decrease Indent"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="8" x2="21" y2="8"></line>
            <line x1="3" y1="16" x2="21" y2="16"></line>
            <line x1="13" y1="12" x2="21" y2="12"></line>
            <polyline points="4 12 8 8 4 4"></polyline>
          </svg>
        </button>
        <button 
          onClick={clearFormatting}
          title="Clear Formatting"
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '4px',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 14l-5-5-5 5"></path>
            <path d="M12 9v9"></path>
            <path d="M5 4h14"></path>
          </svg>
        </button>
      </div>

      {/* Add Shortcodes Button - Positioned to the right */}
      <button
        onClick={() => {
          // Implementation for adding shortcodes
          alert('Add shortcodes functionality would go here');
        }}
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '4px 12px',
          background: '#f5f5f5',
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <span style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '4px', 
          padding: '2px 4px',
          color: '#666',
          fontFamily: 'monospace'
        }}>
          {'</>'}
        </span>
        <span>Add Shortcodes</span>
      </button>
    </div>
  );
};