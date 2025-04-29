import { LuBold, LuItalic, } from "react-icons/lu";
import { RxUnderline } from "react-icons/rx";
import { RiStrikethrough } from "react-icons/ri";
import {
  FORMAT_TEXT_COMMAND
} from 'lexical';
import { Button, Flex, Select } from "antd";
import "../../style.scss";
import { __ } from "@wordpress/i18n";

interface FontEditingProps {
  activeEditor: any;
  paragraphFormat: string;
  handleFormatChange: (value: string) => void;
  fontFamily: string;
  onFontFamilyChange: (value: string) => void;
  updateToolbar: () => void;
}

export default function FontEditing({
  activeEditor,
  paragraphFormat,
  handleFormatChange,
  fontFamily,
  onFontFamilyChange,
  updateToolbar
}: FontEditingProps) {
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
    </>
  );
};