/**
 *  External dependencies
 */
import { FaListUl, FaListOl } from 'react-icons/fa6';
import { MdOutlineChecklist } from 'react-icons/md';
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	INSERT_CHECK_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { Button, Flex } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { $isListNode } from '@lexical/list';
import { $getSelection, $isRangeSelection } from 'lexical';

interface ListStylesProps {
	activeEditor: any;
}

export default function ListStyles({ activeEditor }: ListStylesProps) {
	const [isBulletList, setIsBulletList] = useState(false);
	const [isNumberedList, setIsNumberedList] = useState(false);
	const [isCheckList, setIsCheckList] = useState(false);

	// Update active state of list buttons based on current selection
	const updateListState = useCallback(() => {
		activeEditor.getEditorState().read(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchorNode = selection.anchor.getNode();
				const element =
					anchorNode.getKey() === 'root'
						? anchorNode
						: anchorNode.getTopLevelElementOrThrow();

				// Find list node if exists
				let parentList = null;
				let node = element;
				while (node !== null) {
					if ($isListNode(node)) {
						parentList = node;
						break;
					}
					node = node.getParent();
				}

				// Update states based on list type
				if (parentList) {
					const listType = parentList.getListType();
					setIsBulletList(listType === 'bullet');
					setIsNumberedList(listType === 'number');
					setIsCheckList(listType === 'check');
				} else {
					setIsBulletList(false);
					setIsNumberedList(false);
					setIsCheckList(false);
				}
			}
		});
	}, [activeEditor]);

	// Register update listener
	useEffect(() => {
		return activeEditor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateListState();
			});
		});
	}, [activeEditor, updateListState]);

	const toggleList = (command, listType) => {
		if (
			(listType === 'bullet' && isBulletList) ||
			(listType === 'number' && isNumberedList) ||
			(listType === 'check' && isCheckList)
		) {
			activeEditor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
		} else {
			activeEditor.dispatchCommand(command, undefined);
		}
	};

	return (
		<Flex gap={10}>
			<Button
				onClick={() =>
					toggleList(INSERT_UNORDERED_LIST_COMMAND, 'bullet')
				}
				title="Bullet List"
				className="border-none shadow-none cursor-pointer p-0"
			>
				<FaListUl
					className={`text-[20px] hover:text-color-primary ${
						isBulletList ? 'text-color-primary' : 'text-[#52525B]'
					}`}
				/>
			</Button>

			<Button
				onClick={() =>
					toggleList(INSERT_ORDERED_LIST_COMMAND, 'number')
				}
				title="Numbered List"
				className="border-none shadow-none cursor-pointer p-0"
			>
				<FaListOl
					className={`text-[20px] hover:text-color-primary ${
						isNumberedList ? 'text-color-primary' : 'text-[#52525B]'
					}`}
				/>
			</Button>

			<Button
				onClick={() => toggleList(INSERT_CHECK_LIST_COMMAND, 'check')}
				title="Checklist"
				className="border-none shadow-none cursor-pointer p-0"
			>
				<MdOutlineChecklist
					className={`text-[20px] hover:text-color-primary ${
						isCheckList ? 'text-color-primary' : 'text-[#52525B]'
					}`}
				/>
			</Button>
		</Flex>
	);
}
