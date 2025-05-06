import { IoLinkOutline } from "react-icons/io5";
import { LiaImageSolid } from "react-icons/lia";
import { useCallback} from 'react';
import {
  $getSelection,
  $isRangeSelection
} from 'lexical';
import { $wrapNodes } from '@lexical/selection';
import {
  $createTextNode,
} from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { Button, Flex  } from "antd";
import { __ } from "@wordpress/i18n";
import { INSERT_IMAGE_COMMAND } from '../../../plugins/image-plugin';

interface AttachmentsProps {
  activeEditor: any;
}

export default function Attachments({ activeEditor }: AttachmentsProps) {

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

      console.log("media frame:", mediaFrame);

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
          console.log("image Data:", imageData);
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

  return (
    <>
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
    </>
  );
};