/**
 *  Wordpress dependencies
 */
import { __ } from "@wordpress/i18n";
import { useCallback, useEffect, useState } from "@wordpress/element";
/**
 *  External dependencies
 */
import { LuBold, LuItalic, } from "react-icons/lu";
import { RxUnderline } from "react-icons/rx";
import { RiStrikethrough } from "react-icons/ri";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND
} from 'lexical';
import { Button, Flex, Select } from "antd";


interface FontEditingProps {
  activeEditor: any;
  paragraphFormat: string;
  handleFormatChange: (value: string) => void;
  updateToolbar: () => void;
}

export default function FontEditing({
  activeEditor,
  paragraphFormat,
  handleFormatChange,
  updateToolbar
}: FontEditingProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  // Update text formatting states based on selection
  const updateFormatState = useCallback(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));
        setIsUnderline(selection.hasFormat('underline'));
        setIsStrikethrough(selection.hasFormat('strikethrough'));
      }
    });
  }, [activeEditor]);

  // Register update listener
  useEffect(() => {
    return activeEditor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateFormatState();
      });
    });
  }, [activeEditor, updateFormatState]);

  return (
    <>
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
          className='rounded-md border-none outline-none px-2 bg-[#F1F1F2] cursor-pointer custom-ant-select w-fit'
        />
      </Flex>

      {/* Text formatting */}
      <Flex gap={10} className="border-r pr-5">
        <Button
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          title="Bold"
          className='border-none shadow-none cursor-pointer p-0'
        >
          <LuBold className={`text-[20px] ${isBold ? 'text-color-primary' : 'text-[#52525B]'
            }`} />
        </Button>
        <Button
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          title="Italic"
          className='border-none shadow-none cursor-pointer p-0'
        >
          <LuItalic className={`text-[20px] ${isItalic ? 'text-color-primary' : 'text-[#52525B]'
            }`} />
        </Button>
        <Button
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          title="Underline"
          className='border-none shadow-none cursor-pointer p-0'
        >
          <RxUnderline className={`text-[20px] ${isUnderline ? 'text-color-primary' : 'text-[#52525B]'
            }`} />
        </Button>
        <Button
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            // Force updateToolbar after formatting is applied
            setTimeout(() => {
              updateFormatState();
              updateToolbar();
            }, 0);
          }}
          title="Strikethrough"
          className='border-none shadow-none cursor-pointer p-0'
        >
          <RiStrikethrough className={`text-[20px] ${isStrikethrough ? 'text-color-primary' : 'text-[#52525B]'
            }`} />
        </Button>
      </Flex>
    </>
  );
};
