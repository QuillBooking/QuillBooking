/**
 *  Wordpress dependencies
 */
import { __ } from "@wordpress/i18n";
/**
 *  External dependencies
 */
import { HiOutlineCodeBracketSquare } from "react-icons/hi2";
import { useCallback, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { Button, Flex, Modal } from "antd";
/**
 *  Internal dependencies
 */
import { $createMentionNode } from '../../../nodes/mention-node';
import { Header, UrlIcon, MergeTagModal } from "@quillbooking/components";
import Mentions from "../../../mentions";

interface AddingShortCodeProps {
  activeEditor: any;
}

export default function AddingShortCode({ activeEditor }: AddingShortCodeProps) {

  const [mentionModalVisible, setMentionModalVisible] = useState(false);

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

      {/* Mentions Modal */}
      <Modal
        open={mentionModalVisible}
        onCancel={() => setMentionModalVisible(false)}
        footer={null}
        width={1000}
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
        <MergeTagModal onMentionClick={(mention, category) => handleAddMention(mention, category)} />
      </Modal>
    </>
  );
};