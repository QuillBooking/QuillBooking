/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Select } from 'antd';
import { Fields, FieldsGroup } from 'client/types';

interface QuestionInfoProps {
	fieldKey: string;
	index: number;
	allFields: FieldsGroup;
	handleSave: (updatedField: Fields) => void;
	setEdtingField: (fieldKey: string) => void;
	setType: (type: string) => void;
}
const QuestionInfo: React.FC<QuestionInfoProps> = ({
	fieldKey,
	index,
	allFields,
	handleSave,
	setEdtingField,
	setType,
}) => {
	return (
		<div className="flex items-center gap-8">
			<p className="font-medium text-xl">
				{/* {allFields[fieldKey].label} */}
				{__('Question', 'quillbooking')} {`(${index + 1})`}
			</p>

			<div>
				<Select
					options={[
						{
							value: 'text',
							label: __('Text', 'quillbooking'),
						},
						{
							value: 'textarea',
							label: __('Textarea', 'quillbooking'),
						},
						{
							value: 'checkbox',
							label: __('Checkbox', 'quillbooking'),
						},
						{
							value: 'select',
							label: __('Select', 'quillbooking'),
						},
						{
							value: 'radio',
							label: __('Radio', 'quillbooking'),
						},
						{
							value: 'date',
							label: __('Date', 'quillbooking'),
						},
						{
							value: 'time',
							label: __('Time', 'quillbooking'),
						},
						{
							value: 'datetime',
							label: __('Datetime', 'quillbooking'),
						},
						{
							value: 'number',
							label: __('Number', 'quillbooking'),
						},
						{
							value: 'multiple_select',
							label: __('Multiple Select', 'quillbooking'),
						},
						{
							value: 'file',
							label: __('File', 'quillbooking'),
						},
						{
							value: 'hidden',
							label: __('Hidden', 'quillbooking'),
						},
						{
							value: 'checkbox_group',
							label: __('Checkbox Group', 'quillbooking'),
						},
						{
							value: 'terms',
							label: __('Terms', 'quillbooking'),
						},
					]}
					defaultValue={allFields[fieldKey].type}
					onChange={(value) => {
						const updatedField = {
							...allFields[fieldKey],
							type: value,
						};
						setEdtingField(fieldKey);
						setType(value);
						// handleSave(updatedField);
					}}
					getPopupContainer={(trigger) =>
						document.getElementById(`card-${fieldKey}`) || trigger
					}
					className="w-[150px]"
					disabled={
						allFields[fieldKey].group === 'system' ||
						allFields[fieldKey].group === 'location' ||
						allFields[fieldKey].group === 'other'
					}
				/>
			</div>

			<div className="flex gap-2">
				{allFields[fieldKey].group == 'system' ? (
					<div className="font-bold text-xs py-1 px-4 bg-[#EEE7F4] rounded-[40px] text-color-primary uppercase">
						{__('System', 'quillbooking')}
					</div>
				) : (
					''
				)}

				{allFields[fieldKey].required ? (
					<div className="fon#D8D7D7t-bold text-xs py-1 px-4 bg-[#EEE7F4] rounded-[40px] text-color-primary uppercase">
						{__('rquired', 'quillbooking')}
					</div>
				) : (
					''
				)}
			</div>
		</div>
	);
};

export default QuestionInfo;
