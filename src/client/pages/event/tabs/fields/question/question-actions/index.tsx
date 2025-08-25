/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Switch } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { TrashIcon } from '@quillbooking/components';
import { FieldsGroup } from '@quillbooking/types';

interface QuestionActionsProps {
	fieldKey: string;
	sortedFields: string[];
	allFields: FieldsGroup;
	onUpdate: (updatedField: any, editingFieldKey: string) => void;
	moveField: (fieldKey: string, direction: 'up' | 'down') => void;
	removeField: (
		fieldKey: string,
		group: 'system' | 'location' | 'custom' | 'other'
	) => void;
}

const QuestionActions: React.FC<QuestionActionsProps> = ({
	fieldKey,
	sortedFields,
	allFields,
	onUpdate,
	moveField,
	removeField,
}) => {
	return (
		<div className="flex gap-3 items-center">
			{(allFields[fieldKey].group !== 'system' ||
				fieldKey === 'message' ||
				fieldKey === 'guest') && (
				<Switch
					checked={allFields[fieldKey].enabled}
					onChange={(checked) => {
						const updatedField = {
							...allFields[fieldKey],
							enabled: checked,
						};
						onUpdate(updatedField, fieldKey);
					}}
					className={
						allFields[fieldKey].enabled
							? 'bg-color-primary'
							: 'bg-gray-400'
					}
				/>
			)}

			{allFields[fieldKey].group !== 'other' && (
				<div className="flex gap-5 border-l border-r border-[#D8D7D7] pl-4  pr-4">
					<div
						className={`${
							sortedFields.indexOf(fieldKey) === 0
								? 'text-[#D1D5DB] cursor-not-allowed'
								: 'cursor-pointer'
						}`}
						onClick={() =>
							sortedFields.indexOf(fieldKey) !== 0 &&
							moveField(fieldKey, 'up')
						}
					>
						<ArrowUpOutlined />
					</div>
					<div
						className={`${
							sortedFields.indexOf(fieldKey) ===
							sortedFields.length - 1
								? 'text-[#D1D5DB] cursor-not-allowed'
								: 'cursor-pointer'
						}`}
						onClick={() =>
							sortedFields.indexOf(fieldKey) !==
								sortedFields.length - 1 &&
							moveField(fieldKey, 'down')
						}
					>
						<ArrowDownOutlined />
					</div>
				</div>
			)}

			<div
				className={`${
					allFields[fieldKey].group === 'system' ||
					allFields[fieldKey].group === 'other'
						? 'text-[#D1D5DB] cursor-not-allowed'
						: 'text-[#EF4444] cursor-pointer'
				}`}
				onClick={() =>
					removeField(
						fieldKey,
						allFields[fieldKey].group as
							| 'system'
							| 'location'
							| 'custom'
							| 'other'
					)
				}
			>
				<TrashIcon width={24} height={24} />
			</div>
		</div>
	);
};

export default QuestionActions;
