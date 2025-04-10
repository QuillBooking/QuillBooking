/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Switch, Popconfirm } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { TrashIcon } from '@quillbooking/components';
import { FieldsGroup } from 'client/types';

interface QuestionActionsProps {
	fieldKey: string;
	sortedFields: string[];
	allFields: FieldsGroup;
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
	moveField,
	removeField,
}) => {
	return (
		<div className="flex gap-3 items-center">
			{allFields[fieldKey].group !== 'system' ||
			fieldKey === 'message' ||
			fieldKey === 'guest' ? (
				<Switch
					// checked={!day.off}
					// onChange={(_, checked) =>
					// 	onCustomAvailabilityChange(
					// 		key,
					// 		'off',
					// 		!checked
					// 	)
					// }
					// className={
					// 	!day.off
					// 		? 'bg-color-primary'
					// 		: 'bg-gray-400'
					// }
					className="bg-color-primary"
				/>
			) : (
				''
			)}

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

			<Popconfirm
				title={__('Are you sure to delete this field?', 'quillbooking')}
				onConfirm={() =>
					removeField(
						fieldKey,
						allFields[fieldKey].group as
							| 'system'
							| 'location'
							| 'custom'
							| 'other'
					)
				}
				okText={__('Yes', 'quillbooking')}
				cancelText={__('No', 'quillbooking')}
				disabled={allFields[fieldKey].group === 'system'}
				getPopupContainer={(trigger) =>
					document.getElementById(`card-${fieldKey}`) || trigger
				}
				
			>
				<div
					className={`${
						allFields[fieldKey].group === 'system' || allFields[fieldKey].group === 'other'
							? 'text-[#D1D5DB] cursor-not-allowed'
							: 'text-[#EF4444] cursor-pointer'
					}`}
				>
					<TrashIcon width={24} height={24} />
				</div>
			</Popconfirm>
		</div>
	);
};

export default QuestionActions;
