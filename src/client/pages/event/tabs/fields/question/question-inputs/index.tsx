/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import {
	Checkbox,
	DatePicker,
	Form,
	Input,
	InputNumber,
} from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { FieldsGroup } from 'client/types';
import CommonInput from './common-input';
import { BiPlus } from 'react-icons/bi';
import { TrashIcon } from '../../../../../../../components';
import CommonNumberInput from './common-number-input';
import CommonDatepicker from './common-datepicker';

interface QuestionInputsProps {
	fieldKey: string;
	allFields: FieldsGroup;
	setEdtingField: (fieldKey: string) => void;
	// handleSave: (updatedField: Fields) => void;
	handleChange: (values: any) => void;
	type: string;
}
const QuestionInputs: React.FC<QuestionInputsProps> = ({
	allFields,
	fieldKey,
	type,
	handleChange,
	setEdtingField
}) => {
	const [form] = Form.useForm();

	const onChange = () => {
		form.validateFields().then((values) => {
			setEdtingField(fieldKey);
			handleChange({ ...allFields[fieldKey], ...values });
		});
	};

	return (
		<Form
			form={form}
			layout="vertical"
			initialValues={allFields[fieldKey]}
			onChange={onChange}
		>
			<div className='flex gap-4'>
				<Form.Item
					className='flex-1'
					name="label"
					rules={[
						{
							required: true,
							message: __('Label is required', 'quillbooking'),
						},
					]}
				>
					<CommonInput
						label={__('Label*', 'quillbooking')}
						placeholder={__('Enter field label', 'quillbooking')}
					/>
				</Form.Item>
				{type === 'hidden' ?
					(
						<Form.Item
							className='flex-1'
							name="defaultValue"
						>
							<CommonInput
								label={__('Default Value', 'quillbooking')}
								placeholder={__('Enter default value', 'quillbooking')}
							/>
						</Form.Item>
					)
					: (

						<Form.Item
							className='flex-1'
							name="helpText"
						>
							<CommonInput
								label={__('Helper Text', 'quillbooking')}
								placeholder={__('Enter help text', 'quillbooking')}
							/>
						</Form.Item>
					)}
			</div>

			{
				<>
					{(type === 'text' || type === 'email' || type === 'textarea') && (
						<Form.Item name='placeholder'>
							<CommonInput
								label={__('Placeholder', 'quillbooking')}
								placeholder={__('Enter placeholder', 'quillbooking')}
							/>
						</Form.Item>
					)}

					{type === 'phone' && (<Form.Item name={['settings', 'sms']}>
						<Checkbox className="custom-checkbox">
							{__('Use this number for sending sms notification', 'quillbooking')}
						</Checkbox>
					</Form.Item>)}

					{(type === 'select' ||
						type === 'multiple_select' ||
						type === 'radio' ||
						type === 'checkbox_group') && (
							<Form.List
								name={['settings', 'options']}
								initialValue={
									!allFields[fieldKey].settings?.options
										? ['Option 1', 'Option 2']
										: undefined
								}
							>
								{(fields, { add, remove }) => (
									<>
										<div className={
											fields.length === 1
												? 'grid grid-cols-1 gap-y-2'
												: 'grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4'
										}>
											{fields.map(
												({ key, name, ...restField }) => (
													<div
														key={key}
														className='flex gap-2 items-center mb-1'
													>
														<Form.Item
															className='flex-1'
															{...restField}
															name={name}
															rules={[
																{
																	required: true,
																	message: __(
																		'Option is required',
																		'quillbooking'
																	),
																},
															]}
															style={{
																marginBottom: 0,
															}}
														>
															<CommonInput
																placeholder={__(
																	'Enter option',
																	'quillbooking'
																)}
															/>
														</Form.Item>
														<div
															className='text-[#EF4444] cursor-pointer'
															onClick={() =>
																remove(name)
															}
														>
															<TrashIcon width={24} height={24} />
														</div>
													</div>
												)
											)}
										</div>
										<div
											className='w-fit cursor-pointer text-color-primary font-semibold flex items-center gap-2'
											onClick={() => add()}
										>
											<BiPlus />
											{__(
												'Add New Option',
												'quillbooking'
											)}
										</div>
									</>
								)}
							</Form.List>
						)}

					{type === 'hidden' && (
						<Form.Item name='name'>
							<CommonInput
								label={__('Name', 'quillbooking')}
								placeholder={__('The value must be unique', 'quillbooking')}
							/>
						</Form.Item>
					)}

					{type === 'number' ? (
						<>
							<Form.Item
								name={['settings', 'min']}
								label={__('Min Value', 'quillbooking')}
								rules={[
									{
										required: true,
										message: __(
											'Min value is required',
											'quillbooking'
										),
									},
								]}
							>
								<InputNumber
									placeholder={__(
										'Enter minimum value',
										'quillbooking'
									)}
								/>
							</Form.Item>
							<Form.Item
								name={['settings', 'max']}
								label={__('Max Value', 'quillbooking')}
								rules={[
									{
										required: true,
										message: __(
											'Max value is required',
											'quillbooking'
										),
									},
								]}
							>
								<InputNumber
									placeholder={__(
										'Enter maximum value',
										'quillbooking'
									)}
								/>
							</Form.Item>
							<Form.Item
								name={['settings', 'format']}
								label={__('Format', 'quillbooking')}
							>
								<Input
									placeholder={__(
										'Enter format',
										'quillbooking'
									)}
								/>
							</Form.Item>
						</>
					) : null}

					{(type === 'date' || type === 'datetime') && (
						<>
							<div className='flex gap-4'>
								<Form.Item name='placeholder' className='flex-1'>
									<CommonInput
										label={__('Placeholder', 'quillbooking')}
										placeholder={__('Enter placeholder', 'quillbooking')}
									/>
								</Form.Item>
								<Form.Item
									className='flex-1'
									name={['settings', 'format']}

								>
									<CommonInput
										label={__('Format', 'quillbooking')}
										placeholder={__(
											'Enter format',
											'quillbooking'
										)}
									/>
								</Form.Item>
							</div>
							<div className='flex gap-4'>
								<Form.Item className='flex-1'
									name={['settings', 'min']}
									rules={[
										{
											required: true,
											message: __(
												'Min date is required',
												'quillbooking'
											),
										},
									]}
								>
									<CommonDatepicker
										label={__('Min Date', 'quillbooking')}
										placeholder={__(
											'Select minimum date',
											'quillbooking'
										)}
									/>
								</Form.Item>
								<Form.Item className='flex-1'
									name={['settings', 'max']}
									rules={[
										{
											required: true,
											message: __(
												'Max date is required',
												'quillbooking'
											),
										},
									]}
								>
									<CommonDatepicker
										label={__('Max Date', 'quillbooking')}
										placeholder={__(
											'Select maximum date',
											'quillbooking'
										)}
									/>
								</Form.Item>
							</div>

						</>
					)}

					{type === 'file' && (
						<>
							<div className='flex gap-4'>
								<Form.Item
									className='flex-1'
									name={['settings', 'maxFileSize']}
									rules={[
										{
											required: true,
											message: __(
												'Max file size is required',
												'quillbooking'
											),
										},
									]}
								>
									<CommonNumberInput
										label={__('Max File Size (MB)', 'quillbooking')}
										placeholder={__(
											'Enter maximum file size',
											'quillbooking'
										)}
									/>
								</Form.Item>
								<Form.Item
									className='flex-1'
									name={['settings', 'maxFileCount']}
									rules={[
										{
											required: true,
											message: __(
												'Max file count is required',
												'quillbooking'
											),
										},
									]}
								>
									<CommonNumberInput label={__('Max File Count', 'quillbooking')} placeholder={__(
										'Enter maximum file count',
										'quillbooking'
									)} />
								</Form.Item>
							</div>
							<Form.Item
								name={['settings', 'allowedFiles']}
								label={__(
									'Allowed File Types',
									'quillbooking'
								)}
							>
								<Checkbox.Group>
									<div className="flex flex-wrap gap-4">
										<Checkbox value="pdf" className="custom-checkbox">
											{__('pdf', 'quillbooking')}
										</Checkbox>
										<Checkbox value="doc" className="custom-checkbox">
											{__('doc', 'quillbooking')}
										</Checkbox>
										<Checkbox value="zip" className="custom-checkbox">
											{__('zip', 'quillbooking')}
										</Checkbox>
										<Checkbox value="image" className="custom-checkbox">
											{__('image', 'quillbooking')}
										</Checkbox>
									</div>
								</Checkbox.Group>
							</Form.Item>
						</>
					)}

					{type === 'terms' && (
						<Form.Item
							name={['settings', 'termsText']}
							label={__('Terms and Conditions', 'quillbooking')}
						>
						</Form.Item>
					)}
				</>
			}

			{(allFields[fieldKey].group === 'system' &&
				(fieldKey === 'name' ||
					fieldKey === 'email' ||
					fieldKey === 'address') || type === 'hidden') ? null : (
				<Form.Item name="required" valuePropName="checked">
					<Checkbox className="custom-checkbox">
						{__('Required Question', 'quillbooking')}
					</Checkbox>
				</Form.Item>
			)}
		</Form>
	);
};

export default QuestionInputs;
