import { LuBold, LuItalic, } from "react-icons/lu";
import { RxUnderline } from "react-icons/rx";
import { RiStrikethrough } from "react-icons/ri";
import { IoLinkOutline } from "react-icons/io5";
import { HiOutlineCodeBracketSquare } from "react-icons/hi2";
import { LiaImageSolid } from "react-icons/lia";
import { FaListUl, FaListOl } from "react-icons/fa6";
import { MdOutlineChecklist, MdFormatLineSpacing } from "react-icons/md";
import { FiAlignCenter, FiAlignJustify, FiAlignLeft, FiAlignRight } from "react-icons/fi";
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
  INSERT_CHECK_LIST_COMMAND,
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
import { Button, Flex, Select, Modal, Upload, Space, Table } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import "../style.scss";
import { $createMentionNode } from '../mention-node';
import { Header, UrlIcon } from "@quillbooking/components";
import { __ } from "@wordpress/i18n";
import Mentions from "../mentions";
// Import the ImageNode
import { $createImageNode, INSERT_IMAGE_COMMAND } from '../img-node';

// Define custom command for image insertion
//export const INSERT_IMAGE_COMMAND = 'INSERT_IMAGE_COMMAND';

export const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [paragraphFormat, setParagraphFormat] = useState('paragraph');
  const [mentionModalVisible, setMentionModalVisible] = useState(false);

  // Register image insertion command
  useEffect(() => {
    if (!activeEditor) {
      return;
    }

    return activeEditor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const { src, altText, width, height, id } = payload;
        
        // Make sure we have a valid src before proceeding
        if (!src) {
          console.error('Image source is undefined or empty');
          return false;
        }
        
        // Focus the editor to ensure we have a valid selection
        activeEditor.focus();
        
        try {
          activeEditor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              // Create an ImageNode with the media info
              const imageNode = $createImageNode({ 
                src, 
                altText: altText || 'Image',
                width: width || 'auto',
                height: height || 'auto',
                id: id || undefined
              });
              
              // Insert the node at the current selection
              selection.insertNodes([imageNode]);
            } else {
              // If no selection, insert at the end of the document
              const root = $getRoot();
              const lastChild = root.getLastChild();
              if (lastChild) {
                const imageNode = $createImageNode({ 
                  src, 
                  altText: altText || 'Image',
                  width: width || 'auto',
                  height: height || 'auto',
                  id: id || undefined
                });
                lastChild.insertAfter(imageNode);
              }
            }
          });
          return true;
        } catch (error) {
          console.error('Error inserting image:', error);
          return false;
        }
      },
      0
    );
  }, [activeEditor]);

  // Update format states based on selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Existing formatting states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Block format states
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Check element type and update block format state
      if (elementDOM) {
        if (elementDOM.tagName === 'P') {
          setParagraphFormat('paragraph');
        } else if (elementDOM.tagName === 'H1') {
          setParagraphFormat('heading-1');
        } else if (elementDOM.tagName === 'H2') {
          setParagraphFormat('heading-2');
        } else if (elementDOM.tagName === 'H3') {
          setParagraphFormat('heading-3');
        } else if (elementDOM.tagName === 'BLOCKQUOTE') {
          setParagraphFormat('quote');
        }

        // Get current font family
        const fontFamilyValue = window.getComputedStyle(elementDOM).fontFamily;
        // Clean up the font family string (removing quotes, etc.)
        let cleanFontFamily = fontFamilyValue.replace(/["']/g, '').split(',')[0].trim();

        // Set the detected font family if it's in our list of options
        if (['Arial', 'Times New Roman', 'Courier New', 'Georgia'].includes(cleanFontFamily)) {
          setFontFamily(cleanFontFamily);
        }
      }
    }
  }, [activeEditor]);

  useEffect(() => {
    return activeEditor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [activeEditor, updateToolbar]);

  const onFontFamilyChange = useCallback(
    (value) => {
      setFontFamily(value);
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Apply font family style
          $patchStyleText(selection, {
            'font-family': value,
          });

          selection.formatText();
        }
      });
    },
    [activeEditor]
  );

  const handleFormatChange = useCallback(
    (value) => {
      setParagraphFormat(value);

      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (value === 'paragraph') {
            $wrapNodes(selection, () => $createParagraphNode());
          } else if (value.startsWith('heading')) {
            const headingLevel = parseInt(value.split('-')[1]);
            // Make sure headingLevel is a valid value (1-6)
            if (headingLevel >= 1 && headingLevel <= 6) {
              $wrapNodes(selection, () => $createHeadingNode(`h${headingLevel}`));
            }
          } else if (value === 'quote') {
            $wrapNodes(selection, () => $createQuoteNode());
          }
        }
      });
    },
    [activeEditor]
  );

  // Function to open WordPress media library
  const openMediaLibrary = useCallback(() => {
    // Check if we're in a WordPress environment
    if (window.wp && window.wp.media) {
      // Focus the editor first to ensure we have a valid selection point
      activeEditor.focus();
      
      // Create the media frame
      const mediaFrame = window.wp.media({
        title: 'Select or Upload Media',
        button: {
          text: 'Use this media'
        },
        multiple: false  // Set to true for multiple selections
      });

      console.log("media frame:",mediaFrame);
  
      // When media is selected
      mediaFrame.on('select', () => {
        try {
          // Get the selected attachment
          const attachment = mediaFrame.state().get('selection').first().toJSON();
          
          // Debug to see what's coming from WordPress
          console.log('Selected attachment:', attachment);
          
          // Make sure we have the essential data
          if (!attachment || !attachment.url) {
            console.error('Invalid attachment data:', attachment);
            return;
          }
          
          // Safe way to determine dimensions
          const width = attachment.width ? `${attachment.width}px` : 'auto';
          const height = attachment.height ? `${attachment.height}px` : 'auto';
          
          // Format the data for our ImageNode and ensure all values are valid
          const imageData = {
            src: attachment.url || '/api/placeholder/400/300', // Provide a fallback
            altText: attachment.alt || attachment.title || 'Image',
            width: width,
            height: height,
            id: attachment.id ? attachment.id.toString() : null
          };
          
          // Insert the selected image into the editor with proper error handling
          activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, imageData);
          console.log("image Data:",imageData);
        } catch (error) {
          console.error('Error processing media selection:', error);
          // Provide user feedback
          alert('Failed to insert the selected image. Please try again.');
        }
      });
  
      // Open the media library
      mediaFrame.open();
      console.log("open");
    } else {
      console.error('WordPress Media Library not available');
      // Provide fallback for non-WordPress environments or development
      
      // For development/testing - create a mock image insertion with placeholder
      const mockImageData = {
        src: '/api/placeholder/400/300',
        altText: 'Placeholder Image',
        width: '400px',
        height: '300px',
        id: undefined  // Change null to undefined to match the type definition
      };
      
      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, mockImageData);
    }
  }, [activeEditor]);
  const insertLink = useCallback(() => {
    const url = prompt('Enter URL');
    if (url) {
      activeEditor.focus();
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed()) {
            // If nothing is selected, create a link with the URL as text
            const linkText = $createTextNode(url);
            const linkNode = $createLinkNode(url, {
              rel: 'noopener noreferrer',
              target: '_blank',
            });

            // Add the text inside the link node
            linkNode.append(linkText);

            // Insert the link with its text
            selection.insertNodes([linkNode]);
          } else {
            // If text is selected, wrap it in a link
            $wrapNodes(selection, () =>
              $createLinkNode(url, {
                rel: 'noopener noreferrer',
                target: '_blank',
              })
            );
          }
        }
      });
    }
  }, [activeEditor]);

  const applyLineSpacing = useCallback((spacing) => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, {
          'line-height': spacing,
        });
      }
    });
  }, [activeEditor]);

  // Add a function to handle adding a mention
  const handleAddMention = useCallback((mention, category) => {
    activeEditor.focus();
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const mentionNode = $createMentionNode(mention, category);
        selection.insertNodes([mentionNode]);
      }
    });
    setMentionModalVisible(false);
  }, [activeEditor]);

  return (
    <>
      <div className="toolbar" style={{
        display: 'flex',
        padding: '20px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        alignItems: 'center',
        justifyContent: "center",
        gap: '15px',
        flexWrap: 'wrap',
        color: "#52525B",
      }}>
        {/* Paragraph format & Font family */}
        <Flex gap={10} className="border-r pr-5">
          <Select
            options={[
              { value: 'paragraph', label: 'Paragraph Text' },
              { value: 'heading-1', label: 'Heading 1' },
              { value: 'heading-2', label: 'Heading 2' },
              { value: 'heading-3', label: 'Heading 3' },
              { value: 'quote', label: 'Quote' },
            ]}
            getPopupContainer={(trigger) => trigger.parentElement}
            value={paragraphFormat}
            onChange={handleFormatChange}
            className='rounded-md border-none outline-none px-2 bg-[#F4F4F5] cursor-pointer custom-ant-select w-fit'
          />

          <Select
            options={[
              { value: 'Arial', label: 'Arial' },
              { value: 'Times New Roman', label: 'Times New Roman' },
              { value: 'Courier New', label: 'Courier New' },
              { value: 'Georgia', label: 'Georgia' },
            ]}
            getPopupContainer={(trigger) => trigger.parentElement}
            value={fontFamily}
            onChange={onFontFamilyChange}
            className='rounded-md border-none outline-none px-2 bg-[#F4F4F5] cursor-pointer custom-ant-select w-fit'
          />
        </Flex>

        {/* Text formatting */}
        <Flex gap={10} className="border-r pr-5">
          <Button
            onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
            title="Bold"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <LuBold className="text-[20px] text-[#52525B]" />
          </Button>
          <Button
            onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
            title="Italic"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <LuItalic className="text-[20px] text-[#52525B]" />
          </Button>
          <Button
            onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
            title="Underline"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <RxUnderline className="text-[20px] text-[#52525B]" />
          </Button>
          <Button
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
              // Force updateToolbar after formatting is applied
              setTimeout(() => {
                activeEditor.getEditorState().read(() => {
                  updateToolbar();
                });
              }, 0);
            }}
            title="Strikethrough"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <RiStrikethrough className="text-[20px] text-[#52525B]" />
          </Button>
        </Flex>

        {/* Link and Image */}
        <Flex gap={10} className="border-r pr-5">
          <Button
            onClick={insertLink}
            title="Insert Link"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <IoLinkOutline className="text-[20px] text-[#52525B]" />
          </Button>
          <Button
            onClick={openMediaLibrary}
            title="Insert Image from Media Library"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <LiaImageSolid className="text-[20px] text-[#52525B]" />
          </Button>
        </Flex>

        {/* Add Shortcodes Button - Positioned to the right */}
        <Button
          onClick={() => {
            setMentionModalVisible(true);
          }}
          className="bg-[#E3DFF1] border rounded-lg border-[#333333] cursor-pointer flex items-center"
        >
          <HiOutlineCodeBracketSquare className="text-[20px] text-[#52525B]" />
          <span className="text-[#52525B]">Add Shortcodes</span>
        </Button>

        {/* Lists */}
        <Flex gap={10}>
          <Button
            onClick={() => activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
            title="Bullet List"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <FaListUl className="text-[20px] text-[#52525B]" />
          </Button>

          <Button
            onClick={() => activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
            title="Numbered List"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <FaListOl className="text-[20px] text-[#52525B]" />
          </Button>

          <Button
            onClick={() => activeEditor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}
            title="Checklist"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <MdOutlineChecklist className="text-[20px] text-[#52525B]" />
          </Button>
        </Flex>

        {/* Alignment */}
        <Flex gap={10}>
          <Button
            onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
            title="Align Left"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <FiAlignLeft className="text-[20px] text-[#52525B]" />
          </Button>
          <Button
            onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
            title="Align Center"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <FiAlignCenter className="text-[20px] text-[#52525B]" />
          </Button>
          <Button
            onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
            title="Align Right"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <FiAlignRight className="text-[20px] text-[#52525B]" />
          </Button>
          <Button
            onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
            title="Justify"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <FiAlignJustify className="text-[20px] text-[#52525B]" />
          </Button>
          <Button
            onClick={() => applyLineSpacing('2')}
            title="Line Spacing"
            className="border-none shadow-none cursor-pointer p-0"
          >
            <MdFormatLineSpacing className="text-[20px] text-[#52525B]" />
          </Button>
        </Flex>
      </div>

      {/* Mentions Modal */}
      <Modal
        open={mentionModalVisible}
        onCancel={() => setMentionModalVisible(false)}
        footer={null}
        width={700}
        getContainer={false}
      >
        <Flex gap={10} className='items-center border-b pb-4 mb-4'>
          <div className='bg-[#EDEDED] rounded-lg p-3 mt-2'>
            <UrlIcon />
          </div>
          <Header header={__('Email Notification', 'quillbooking')}
            subHeader={__(
              'Customize the email notifications sent to attendees and organizers',
              'quillbooking'
            )} />
        </Flex>
        <Mentions onMentionClick={(mention, category) => handleAddMention(mention, category)} />
      </Modal>
    </>
  );
};