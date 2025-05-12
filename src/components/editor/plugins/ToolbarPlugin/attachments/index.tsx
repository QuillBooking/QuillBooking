/**
 * WordPress dependencies
 */
import { __ } from "@wordpress/i18n";
/**
 * External dependencies
 */
import { IoLinkOutline } from "react-icons/io5";
import { LiaImageSolid } from "react-icons/lia";
import { useCallback, useState, useMemo } from 'react';
import {
  $getSelection,
  $createTextNode,
  $isRangeSelection
} from 'lexical';
import { $wrapNodes } from '@lexical/selection';
import { $createLinkNode } from '@lexical/link';
import { Button, Flex, Modal, Input } from "antd";
/**
 * Internal dependencies
 */
import { INSERT_IMAGE_COMMAND } from '../../../plugins/image-plugin';
import { MergeTagModal, Header, UrlIcon, WebhookListIcon } from '@quillbooking/components'

interface AttachmentsProps {
  activeEditor: any;
}

export default function Attachments({ activeEditor }: AttachmentsProps) {
  // State for managing modals
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [mergeTagModal, setMergeTagModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selectedText, setSelectedText] = useState('');

  // Function to open WordPress media library
  const openMediaLibrary = useCallback(() => {
    if (window.wp && window.wp.media) {
      activeEditor.focus();

      const mediaFrame = window.wp.media({
        title: 'Select or Upload Media',
        button: {
          text: 'Use this media'
        },
        multiple: false
      });

      mediaFrame.on('select', () => {
        try {
          const attachment = mediaFrame.state().get('selection').first().toJSON();

          if (!attachment || !attachment.url) {
            console.error('Invalid attachment data:', attachment);
            return;
          }

          const width = attachment.width ? `${attachment.width}px` : 'auto';
          const height = attachment.height ? `${attachment.height}px` : 'auto';

          const imageData = {
            src: attachment.url || '/api/placeholder/400/300',
            altText: attachment.alt || attachment.title || 'Image',
            width: width,
            height: height,
            id: attachment.id ? attachment.id.toString() : null
          };

          activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, imageData);
        } catch (error) {
          console.error('Error processing media selection:', error);
          alert('Failed to insert the selected image. Please try again.');
        }
      });

      mediaFrame.open();
    } else {
      console.error('WordPress Media Library not available');
      const mockImageData = {
        src: '/api/placeholder/400/300',
        altText: 'Placeholder Image',
        width: '400px',
        height: '300px',
        id: undefined
      };
      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, mockImageData);
    }
  }, [activeEditor]);

  // Function to handle merge tag selection for URLs
  const handleMergeTagClick = useCallback((tagValue: string) => {
    setLinkUrl(prev => prev + tagValue);
    setMergeTagModal(false);
  }, []);

  // Function to open the link modal and capture selected text
  const openLinkModal = useCallback(() => {
    activeEditor.focus();
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        setSelectedText(text);
        setLinkText(text || '');
      }
    });
    setLinkModalOpen(true);
  }, [activeEditor]);

  // Function to insert the link into the editor
  const insertLink = useCallback(() => {
    if (linkUrl) {
      activeEditor.focus();
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed() || !selectedText) {
            const textToUse = linkText || linkUrl;
            const linkTextNode = $createTextNode(textToUse);
            const linkNode = $createLinkNode(linkUrl, {
              rel: 'noopener noreferrer',
              target: '_blank',
            });
            linkNode.append(linkTextNode);
            selection.insertNodes([linkNode]);
          } else {
            $wrapNodes(selection, () =>
              $createLinkNode(linkUrl, {
                rel: 'noopener noreferrer',
                target: '_blank',
              })
            );
          }
        }
      });

      setLinkUrl('');
      setLinkText('');
      setLinkModalOpen(false);
    }
  }, [activeEditor, linkUrl, linkText, selectedText]);

  // Memoized Link Modal component
  const LinkModal = useMemo(() => (
    <Modal
      open={linkModalOpen}
      onCancel={() => {
        setLinkModalOpen(false);
        setLinkUrl('');
        setLinkText('');
      }}
      footer={[
        <Button key="insert" type="primary" onClick={insertLink} className="bg-color-primary text-white w-full">
          {__("Insert", "quillbooking")}
        </Button>
      ]}
      getContainer={false}
      destroyOnClose
    >
      <Flex vertical gap={16}>
        <Flex gap={10} className='items-center'>
          <span className="bg-[#EDEDED] p-2 rounded"><WebhookListIcon width={24} height={24} /></span>
          <Header
            header={__("Add Link", 'quillbooking')}
            subHeader={__('Choose your Merge tags type and Select one of them related to your input.', 'quillbooking')} />
        </Flex>
        <div className="mb-6">
          <span className="text-[#09090B] text-[16px] font-semibold">
            {__('Link', 'quillbooking')}
            <span className="text-red-500">*</span>
          </span>
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-[48px] rounded-lg mt-2 pl-[10px] pr-0 py-0"
            autoFocus
            suffix={
              <span
                className="bg-[#EEEEEE] p-[0.7rem] rounded-r-lg"
                onClick={() => setMergeTagModal(true)}
              >
                <UrlIcon />
              </span>
            }
          />
        </div>
      </Flex>
    </Modal>
  ), [linkModalOpen, linkUrl, linkText, selectedText, insertLink]);

  const MergeTagsModal = useMemo(() => (
    <Modal
      open={mergeTagModal}
      onCancel={() => setMergeTagModal(false)}
      footer={null}
      width={1000}
      getContainer={false}
      destroyOnClose
    >
      <Flex gap={10} className="items-center border-b pb-4 mb-4">
        <div className="bg-[#EDEDED] rounded-lg p-3 mt-2">
          <UrlIcon />
        </div>
        <Header
          header={__('Link with Merge Tags', 'quillbooking')}
          subHeader={__(
            'Choose your Merge tags type and Select one of them to insert into your link URL.',
            'quillbooking'
          )}
        />
      </Flex>
      <MergeTagModal onMentionClick={handleMergeTagClick} />
    </Modal>
  ), [mergeTagModal, handleMergeTagClick]);

  return (
    <>
      {/* Link and Image buttons */}
      <Flex gap={10} className="border-r pr-5">
        <Button
          onClick={openLinkModal}
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

      {/* Render modals */}
      {LinkModal}
      {MergeTagsModal}
    </>
  );
};