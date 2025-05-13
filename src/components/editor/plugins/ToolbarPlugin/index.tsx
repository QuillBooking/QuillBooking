/**
 *  Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 *  External dependencies
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
	$getSelection,
	$createParagraphNode,
	$getRoot,
	$isRangeSelection,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
	$createHeadingNode,
	$createQuoteNode,
	HeadingTagType,
} from '@lexical/rich-text';
import { Flex } from 'antd';
/**
 *  Internal dependencies
 */
import { $createImageNode } from '../../nodes/img-node';
import { INSERT_IMAGE_COMMAND } from '../../plugins/image-plugin';
import ListStyles from './list-styles';
import FontEditing from './font-editing';
import AlignmentStyles from './alignment-styles';
import Attachments from './attachments';
import AddingShortCode from './adding-shortcode';

interface ToolbarProps {
	type: string;
}

export const ToolbarPlugin = ({ type }: ToolbarProps) => {
	const [editor] = useLexicalComposerContext();
	const [activeEditor, setActiveEditor] = useState(editor);
	const [paragraphFormat, setParagraphFormat] = useState('paragraph');

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
								id: id || undefined,
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
									id: id || undefined,
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
			// Block format states
			const anchorNode = selection.anchor.getNode();
			const element =
				anchorNode.getKey() === 'root'
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

	const handleFormatChange = useCallback(
		(value) => {
			setParagraphFormat(value);

			activeEditor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					if (value === 'paragraph') {
						$setBlocksType(selection, () => $createParagraphNode());
					} else if (value.startsWith('heading')) {
						const headingLevel = parseInt(value.split('-')[1]);
						if (headingLevel >= 1 && headingLevel <= 6) {
							$setBlocksType(selection, () =>
								$createHeadingNode(
									`h${headingLevel}` as HeadingTagType
								)
							);
						}
					} else if (value === 'quote') {
						$setBlocksType(selection, () => $createQuoteNode());
					}
				}
			});
		},
		[activeEditor]
	);

	return (
		<Flex
			gap={15}
			align="center"
			wrap
			className={`toolbar bg-white text-[#52525B] ${type == 'email' ? 'border-b border-b-[#e0e0e0] p-5 justify-center' : ''}`}
		>
			<Flex gap={15} align="center">
				{type == 'email' && (
					<>
						{/* Paragraph format & Font family */}
						<FontEditing
							activeEditor={activeEditor}
							paragraphFormat={paragraphFormat}
							handleFormatChange={handleFormatChange}
							updateToolbar={updateToolbar}
						/>

						{/* Link and Image */}
						<Attachments activeEditor={activeEditor} />
					</>
				)}
			</Flex>

			<Flex gap={15} align="center">
				{/* Add Shortcodes Button - Positioned to the right */}
				<AddingShortCode activeEditor={activeEditor} />
				{type == 'email' && (
					<>
						{/* Lists */}
						<ListStyles activeEditor={activeEditor} />

						{/* Alignment */}
						<AlignmentStyles activeEditor={activeEditor} />
					</>
				)}
			</Flex>
		</Flex>
	);
};
