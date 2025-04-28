import { FaListUl, FaListOl } from "react-icons/fa6";
import { MdOutlineChecklist } from "react-icons/md";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from '@lexical/list';
import { Button, Flex } from "antd";
import "../../style.scss";

interface ListStylesProps {
  activeEditor: any;
}

export default function ListStyles({ activeEditor }: ListStylesProps) {
  return (
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
  );
};