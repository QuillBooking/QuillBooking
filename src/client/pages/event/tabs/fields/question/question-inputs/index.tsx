/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Checkbox, Form, InputNumber } from 'antd';

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
import { Editor as EmailEditor } from '@quillbooking/components';

interface QuestionInputsProps {
	fieldKey: string;
	allFields: FieldsGroup;
	onUpdate: (updatedField: any, editingFieldKey: string) => void;
	type: string;
}
const QuestionInputs: React.FC<QuestionInputsProps> = ({
	allFields,
	fieldKey,
	type,
	onUpdate,
}) => {
	const [form] = Form.useForm();

	const onChange = () => {
		form.validateFields().then((values) => {
			console.log('values', values);
			// values might be { label, helpText, settings: { min? number, max? number, … } }
			const updatedSettings = {
				...allFields[fieldKey].settings, // keep all existing min/max/…
				...values.settings, // overwrite only the bits that changed
			};

			onUpdate(
				{
					...allFields[fieldKey],
					...values,
					settings: updatedSettings,
				},
				fieldKey
			);
		});
	};

	return (
		<Form
			form={form}
			layout="vertical"
			initialValues={allFields[fieldKey]}
			onValuesChange={onChange}
			requiredMark={false}
		>
			<div className="flex gap-4">
				<Form.Item className="flex-1" name="label">
					<CommonInput
						required={true}
						label={__('Label', 'quillbooking')}
						placeholder={__('Enter field label', 'quillbooking')}
					/>
				</Form.Item>
				{type === 'hidden' ? (
					<Form.Item className="flex-1" name="defaultValue">
						<CommonInput
							label={__('Default Value', 'quillbooking')}
							placeholder={__(
								'Enter default value',
								'quillbooking'
							)}
						/>
					</Form.Item>
				) : (
					<Form.Item className="flex-1" name="helpText">
						<CommonInput
							label={__('Helper Text', 'quillbooking')}
							placeholder={__('Enter help text', 'quillbooking')}
						/>
					</Form.Item>
				)}
			</div>

			{
				<>
					{(type === 'text' ||
						type === 'email' ||
						type === 'textarea') && (
						<Form.Item name="placeholder">
							<CommonInput
								label={__('Placeholder', 'quillbooking')}
								placeholder={__(
									'Enter placeholder',
									'quillbooking'
								)}
							/>
						</Form.Item>
					)}

					{type === 'phone' && (
						<Form.Item
							name={['settings', 'sms']}
							valuePropName="checked"
						>
							<Checkbox className="custom-checkbox">
								{__(
									'Use this number for sending sms notification',
									'quillbooking'
								)}
							</Checkbox>
						</Form.Item>
					)}

					{(type === 'select' ||
						type === 'multiple_select' ||
						type === 'radio' ||
						type === 'checkbox_group') &&
						fieldKey !== 'location-select' && (
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
										<div
											className={
												fields.length === 1
													? 'grid grid-cols-1 gap-y-2'
													: 'grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4'
											}
										>
											{fields.map(
												({
													key,
													name,
													...restField
												}) => (
													<div
														key={key}
														className="flex gap-2 items-center mb-1"
													>
														<Form.Item
															className="flex-1"
															{...restField}
															name={name}
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
															className="text-[#EF4444] cursor-pointer"
															onClick={() =>
																remove(name)
															}
														>
															<TrashIcon
																width={24}
																height={24}
															/>
														</div>
													</div>
												)
											)}
										</div>
										<div
											className="w-fit cursor-pointer text-color-primary font-semibold flex items-center gap-2"
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
						<Form.Item name="name">
							<CommonInput
								label={__('Name', 'quillbooking')}
								placeholder={__(
									'The value must be unique',
									'quillbooking'
								)}
							/>
						</Form.Item>
					)}

					{type === 'number' && (
						<>
							<div className="flex gap-4">
								<Form.Item
									initialValue={1}
									className="flex-1"
									name={['settings', 'min']}
									label={
										<>
											{__('Min Value', 'quillbooking')}
											<span className="text-[#EF4444]">
												*
											</span>
										</>
									}
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
										size="large"
										style={{ width: '100%' }}
										placeholder={__(
											'Enter minimum value',
											'quillbooking'
										)}
									/>
								</Form.Item>
								<Form.Item
									initialValue={100}
									className="flex-1"
									name={['settings', 'max']}
									label={
										<>
											{__('Max Value', 'quillbooking')}
											<span className="text-[#EF4444]">
												*
											</span>
										</>
									}
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
										size="large"
										style={{ width: '100%' }}
										placeholder={__(
											'Enter maximum value',
											'quillbooking'
										)}
									/>
								</Form.Item>
							</div>
						</>
					)}

					{(type === 'date' || type === 'datetime') && (
						<>
							<div className="flex gap-4">
								<Form.Item
									name="placeholder"
									className="flex-1"
								>
									<CommonInput
										label={__(
											'Placeholder',
											'quillbooking'
										)}
										placeholder={__(
											'Enter placeholder',
											'quillbooking'
										)}
									/>
								</Form.Item>
								<Form.Item
									className="flex-1"
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
							<div className="flex gap-4">
								<Form.Item
									className="flex-1"
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
								<Form.Item
									className="flex-1"
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
							<div className="flex gap-4">
								<Form.Item
									className="flex-1"
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
										label={__(
											'Max File Size (MB)',
											'quillbooking'
										)}
										placeholder={__(
											'Enter maximum file size',
											'quillbooking'
										)}
									/>
								</Form.Item>
								<Form.Item
									className="flex-1"
									name={['settings', 'maxFileCount']}
								>
									<CommonNumberInput
										label={__(
											'Max File Count',
											'quillbooking'
										)}
										placeholder={__(
											'Enter maximum file count',
											'quillbooking'
										)}
									/>
								</Form.Item>
							</div>
							<Form.Item
								name={['settings', 'allowedFiles']}
								label={__('Allowed File Types', 'quillbooking')}
							>
								<Checkbox.Group>
									<div className="flex flex-wrap gap-4">
										<Checkbox
											value="pdf"
											className="custom-checkbox"
										>
											{__('pdf', 'quillbooking')}
										</Checkbox>
										<Checkbox
											value="doc"
											className="custom-checkbox"
										>
											{__('doc', 'quillbooking')}
										</Checkbox>
										<Checkbox
											value="zip"
											className="custom-checkbox"
										>
											{__('zip', 'quillbooking')}
										</Checkbox>
										<Checkbox
											value="image"
											className="custom-checkbox"
										>
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
							{/* update the message  */}
							<EmailEditor message={''} onChange={onChange} />
						</Form.Item>
					)}
				</>
			}

			{(allFields[fieldKey].group === 'system' &&
				(fieldKey === 'name' || fieldKey === 'email')) ||
			allFields[fieldKey].group === 'system' ||
			type === 'hidden' ? null : (
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
