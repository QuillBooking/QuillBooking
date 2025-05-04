import { MdFormatLineSpacing } from "react-icons/md";
import { FiAlignCenter, FiAlignJustify, FiAlignLeft, FiAlignRight } from "react-icons/fi";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND
} from 'lexical';
import { Button, Flex } from "antd";
import "../../style.scss";
import { __ } from "@wordpress/i18n";
import { $patchStyleText } from "@lexical/selection";
import { useCallback } from "react";

interface AlignmentStylesProps {
  activeEditor: any;
}

export default function AlignmentStyles({ activeEditor }: AlignmentStylesProps) {
  // components/AlignmentStyles.tsx
  const applyLineSpacing = useCallback((spacing) => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, {
          'line-height': `${spacing} !important`,
        });
      }
      console.log('line-height',spacing)
    });
  }, [activeEditor]);

  return (
    <>
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
    </>
  );
};