/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import {
	Button,
	Checkbox,
	DatePicker,
	Form,
	Input,
	InputNumber,
	Select,
	Space,
	Switch,
} from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { Fields, FieldsGroup } from 'client/types';

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
			<Form.Item
				name="label"
				label={__('Label', 'quillbooking')}
				rules={[
					{
						required: true,
						message: __('Label is required', 'quillbooking'),
					},
				]}
			>
				<Input placeholder={__('Enter field label', 'quillbooking')} />
			</Form.Item>
			<Form.Item
				name="placeholder"
				label={__('Placeholder', 'quillbooking')}
			>
				<Input
					placeholder={__('Enter field placeholder', 'quillbooking')}
				/>
			</Form.Item>
			<Form.Item name="helpText" label={__('Help Text', 'quillbooking')}>
				<Input placeholder={__('Enter help text', 'quillbooking')} />
			</Form.Item>
			<Form.Item shouldUpdate>
				{
					<>
						{type === 'select' ||
						type === 'multiple_select' ||
						type === 'radio' ||
						type === 'checkbox' ||
						type === 'checkbox_group' ? (
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
										{fields.map(
											({ key, name, ...restField }) => (
												<Space
													key={key}
													style={{
														display: 'flex',
														marginBottom: 8,
													}}
													align="end"
												>
													<Form.Item
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
														<Input
															placeholder={__(
																'Enter option value',
																'quillbooking'
															)}
														/>
													</Form.Item>
													<Button
														onClick={() =>
															remove(name)
														}
														danger
													>
														{__(
															'Remove',
															'quillbooking'
														)}
													</Button>
												</Space>
											)
										)}
										<Form.Item>
											<Button
												type="dashed"
												onClick={() => add()}
												block
											>
												{__(
													'Add Option',
													'quillbooking'
												)}
											</Button>
										</Form.Item>
									</>
								)}
							</Form.List>
						) : null}
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
						{type === 'date' || type === 'datetime' ? (
							<>
								<Form.Item
									name={['settings', 'min']}
									label={__('Min Date', 'quillbooking')}
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
									<DatePicker
										placeholder={__(
											'Select minimum date',
											'quillbooking'
										)}
									/>
								</Form.Item>
								<Form.Item
									name={['settings', 'max']}
									label={__('Max Date', 'quillbooking')}
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
									<DatePicker
										placeholder={__(
											'Select maximum date',
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
						{type === 'file' ? (
							<>
								<Form.Item
									name={['settings', 'maxFileSize']}
									label={__(
										'Max File Size (MB)',
										'quillbooking'
									)}
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
									<InputNumber
										placeholder={__(
											'Enter maximum file size',
											'quillbooking'
										)}
									/>
								</Form.Item>
								<Form.Item
									name={['settings', 'maxFileCount']}
									label={__('Max File Count', 'quillbooking')}
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
									<InputNumber
										placeholder={__(
											'Enter maximum file count',
											'quillbooking'
										)}
									/>
								</Form.Item>
								<Form.Item
									name={['settings', 'allowedFiles']}
									label={__(
										'Allowed File Types',
										'quillbooking'
									)}
								>
									<Input
										placeholder={__(
											'Enter allowed file types',
											'quillbooking'
										)}
									/>
								</Form.Item>
							</>
						) : null}
					</>
				}
			</Form.Item>

			{allFields[fieldKey].group === 'system' &&
			(fieldKey === 'name' ||
				fieldKey === 'email' ||
				fieldKey === 'address') ? null : (
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
