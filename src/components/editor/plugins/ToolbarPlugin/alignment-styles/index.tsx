/**
 *  Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
/**
 *  External dependencies
 */
import {
	FiAlignCenter,
	FiAlignJustify,
	FiAlignLeft,
	FiAlignRight,
} from 'react-icons/fi';
import {
	$getSelection,
	$isRangeSelection,
	FORMAT_ELEMENT_COMMAND,
} from 'lexical';
import { Button, Flex } from 'antd';

interface AlignmentStylesProps {
	activeEditor: any;
}

export default function AlignmentStyles({
	activeEditor,
}: AlignmentStylesProps) {
	const [alignment, setAlignment] = useState('left'); // Default alignment

	// Define command handlers with specific alignment logic
	const handleAlignLeft = () => {
		activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
		setAlignment('left');
	};

	const handleAlignCenter = () => {
		activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
		setAlignment('center');
	};

	const handleAlignRight = () => {
		activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
		setAlignment('right');
	};

	const handleAlignJustify = () => {
		activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
		setAlignment('justify');
	};

	// Update alignment state based on DOM instead of format bits
	const updateAlignmentState = useCallback(() => {
		activeEditor.getEditorState().read(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchorNode = selection.anchor.getNode();
				const element =
					anchorNode.getKey() === 'root'
						? anchorNode
						: anchorNode.getTopLevelElementOrThrow();

				const elementKey = element.getKey();
				const elementDOM = activeEditor.getElementByKey(elementKey);

				if (elementDOM) {
					// Get style directly from DOM
					const textAlign = elementDOM.style.textAlign;
					if (textAlign === 'center') {
						setAlignment('center');
					} else if (textAlign === 'right') {
						setAlignment('right');
					} else if (textAlign === 'justify') {
						setAlignment('justify');
					} else {
						setAlignment('left'); // Default or explicitly 'left'
					}
				}
			}
		});
	}, [activeEditor]);

	// Register update listener
	useEffect(() => {
		return activeEditor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateAlignmentState();
			});
		});
	}, [activeEditor, updateAlignmentState]);

	// Run update once on mount
	useEffect(() => {
		updateAlignmentState();
	}, [updateAlignmentState]);

	return (
		<>
			{/* Alignment */}
			<Flex gap={10}>
				<Button
					onClick={handleAlignLeft}
					title="Align Left"
					className="border-none shadow-none cursor-pointer p-0"
				>
					<FiAlignLeft
						className={`text-[20px] hover:text-color-primary ${
							alignment === 'left'
								? 'text-color-primary'
								: 'text-[#52525B]'
						}`}
					/>
				</Button>
				<Button
					onClick={handleAlignCenter}
					title="Align Center"
					className="border-none shadow-none cursor-pointer p-0"
				>
					<FiAlignCenter
						className={`text-[20px] hover:text-color-primary ${
							alignment === 'center'
								? 'text-color-primary'
								: 'text-[#52525B]'
						}`}
					/>
				</Button>
				<Button
					onClick={handleAlignRight}
					title="Align Right"
					className="border-none shadow-none cursor-pointer p-0"
				>
					<FiAlignRight
						className={`text-[20px] hover:text-color-primary ${
							alignment === 'right'
								? 'text-color-primary'
								: 'text-[#52525B]'
						}`}
					/>
				</Button>
				<Button
					onClick={handleAlignJustify}
					title="Align Justify"
					className="border-none shadow-none cursor-pointer p-0"
				>
					<FiAlignJustify
						className={`text-[20px] hover:text-color-primary ${
							alignment === 'justify'
								? 'text-color-primary'
								: 'text-[#52525B]'
						}`}
					/>
				</Button>
			</Flex>
		</>
	);
}
