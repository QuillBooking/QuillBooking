/**
 *  External dependencies
 */
import { useEffect, useState, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TextNode } from 'lexical';
import { Flex } from 'antd';

/**
 *  Internal dependencies
 */
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { MentionNode } from './nodes/mention-node';
import { ImageNode } from './nodes/img-node';
import AutoLinkMatchers from './plugins/autolink-plugin';
import HtmlSerializer from './html-serializer';
import InitialContentPlugin from './plugins/initial-content-plugin';
import WordCountPlugin from './word-count';
import './style.scss';

const theme = {
	paragraph: 'editor-paragraph',
	text: {
		bold: 'editor-text-bold',
		italic: 'editor-text-italic',
		underline: 'editor-text-underline',
		strikethrough: 'editor-text-linethrough',
		fontFamily: 'editor-text-font-family',
		lineHeight: 'editor-text-line-height',
	},
	list: {
		ul: 'editor-list-ul',
		ol: 'editor-list-ol',
		checklist: 'editor-list-checklist',
	},
};

interface EditorProps {
	message: string;
	onChange: (html: string) => void;
	type: string;
}

export default function Editor({ message, onChange, type }: EditorProps) {
	const [editorActive, setEditorActive] = useState(false);
	const [wordCount, setWordCount] = useState(0);
	// Keep track of the initial load to prevent resetting content during editing
	const initialLoadRef = useRef(true);
	// Store initial message to compare if it changes from parent
	const initialMessageRef = useRef(message);

	const initialConfig = {
		namespace: 'EmailBodyEditor',
		theme,
		onError: (error: Error) => console.error(error),
		nodes: [
			HeadingNode,
			ListNode,
			AutoLinkNode,
			ListItemNode,
			TextNode,
			QuoteNode,
			TableNode,
			TableCellNode,
			TableRowNode,
			LinkNode,
			MentionNode,
			ImageNode,
		],
	};

	const handleHtmlChange = (html: string) => {
		if (onChange) onChange(html);
	};

	const handleWordCountChange = (count: number) => {
		setWordCount(count);
	};

	// Set initial word count from initial message
	useEffect(() => {
		if (initialLoadRef.current) {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = message || '';
			const text = tempDiv.textContent || tempDiv.innerText || '';
			const words = text.split(/\s+/).filter((word) => word.length > 0);
			setWordCount(words.length);
		}
	}, [message]);

	// Check if message was changed externally (not from this editor's onChange)
	useEffect(() => {
		// Skip the first render and during active editing
		if (initialLoadRef.current) {
			initialLoadRef.current = false;
			return;
		}

		// Only update the editor if the message prop changes from an external source
		// and the editor is not currently focused/active
		if (!editorActive && message !== initialMessageRef.current) {
			initialMessageRef.current = message;

			// Update word count for the new external message
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = message || '';
			const text = tempDiv.textContent || tempDiv.innerText || '';
			const words = text.split(/\s+/).filter((word) => word.length > 0);
			setWordCount(words.length);
		}
	}, [message, editorActive]);

	return (
		<div className="email-body-editor">
			<LexicalComposer initialConfig={initialConfig}>
				<div className="editor-container">
					{type == 'email' && <ToolbarPlugin type={type} />}
					<div className="editor-inner">
						<RichTextPlugin
							contentEditable={
								<ContentEditable
									className="editor-input"
									onFocus={() => setEditorActive(true)}
									onBlur={() => setEditorActive(false)}
								/>
							}
							placeholder={
								<div className="editor-placeholder">
									Enter content here...
								</div>
							}
							ErrorBoundary={() => (
								<div className="editor-error"></div>
							)}
						/>
						<HtmlSerializer
							onChange={handleHtmlChange}
							onWordCountChange={handleWordCountChange}
						/>
						<HistoryPlugin />
						{type === 'email' && (
							<>
								<ListPlugin />
								<LinkPlugin />
								<AutoLinkMatchers />
								<CheckListPlugin />
							</>
						)}
						{/* Only load initial content once when the component mounts */}
						{initialLoadRef.current && (
							<InitialContentPlugin
								initialContent={initialMessageRef.current}
							/>
						)}
					</div>
					<Flex
						justify="space-between"
						align="center"
						className="bg-[#FCFCFC] border-t py-2 px-5 text-[#1A1A1AB2]"
					>
						<WordCountPlugin wordCount={wordCount} />
						{type == 'sms' && <ToolbarPlugin type={type} />}
					</Flex>
				</div>
			</LexicalComposer>
		</div>
	);
}
