/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Select } from 'antd';
import { FieldsGroup } from 'client/types';
import { TagComponent } from '@quillbooking/components';

interface QuestionInfoProps {
	fieldKey: string;
	index: number;
	allFields: FieldsGroup;
	onUpdate: (updatedField: any, editingFieldKey: string) => void;
	setType: (type: string) => void;
}
const QuestionInfo: React.FC<QuestionInfoProps> = ({
	fieldKey,
	index,
	allFields,
	onUpdate,
	setType,
}) => {
	return (
		<div className="flex items-center gap-8">
			<p className="font-medium text-xl">
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
							value: 'phone',
							label: __('phone', 'quillbooking'),
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
							value: 'time',
							label: __('Time', 'quillbooking'),
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

						if(value === 'number') {
							updatedField.settings = {
								...updatedField.settings,
								min: 0,
								max: 100,
							}
						}

						if (value === 'select' || value === 'multiple_select' || value === 'radio' ) {
							updatedField.settings = {
								...updatedField.settings,
								options: [
									"Option 1",
									"Option 2"
								]
							}
						}
						setType(value);
						onUpdate(updatedField, fieldKey);
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
				{allFields[fieldKey].group == 'system' && (
					<TagComponent label={__('system', 'quillbooking')} />
				)}

				{allFields[fieldKey].group == 'custom' && (
					<TagComponent label={__('custom', 'quillbooking')} />
				)}

				{allFields[fieldKey].required && (
					<TagComponent label={__('required', 'quillbooking')} />
				)}
			</div>
		</div>
	);
};

export default QuestionInfo;
