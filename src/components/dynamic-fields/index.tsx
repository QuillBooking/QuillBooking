/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import React from 'react';

/**
 * External dependencies
 */
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Form, Input, Radio, Checkbox, Select, Button, Space } from 'antd';

const { Option } = Select;

interface DynamicFormFieldProps {
	field: any;
}

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({ field }) => {
	const commonProps = {
		name: `fields-${field.label}`,
		label: field.label,
		rules: [{ required: field.required }],
	};

	switch (field.type) {
		case 'text':
			return (
				<Form.Item {...commonProps}>
					<Input size="large" placeholder={field.placeholder} />
				</Form.Item>
			);
		case 'textarea':
			return (
				<Form.Item {...commonProps}>
					<Input.TextArea
						size="large"
						placeholder={field.placeholder}
					/>
				</Form.Item>
			);
		case 'radio':
			return (
				<Form.Item {...commonProps}>
					<Radio.Group size="large">
						{field.settings.options.map((option: string) => (
							<Radio key={option} value={option}>
								{option}
							</Radio>
						))}
					</Radio.Group>
				</Form.Item>
			);
		case 'checkbox':
			return (
				<Form.Item {...commonProps}>
					<Checkbox.Group>
						{field.settings.options.map((option: string) => (
							<Checkbox key={option} value={option}>
								{option}
							</Checkbox>
						))}
					</Checkbox.Group>
				</Form.Item>
			);
		case 'additional_guests':
			return (
				<Form.Item label={field.label}>
					<Form.List name="additionalGuests">
						{(fields, { add, remove }) => (
							<>
								{fields.map(({ key, name, ...restField }) => (
									<Space key={key} align="baseline">
										<Form.Item
											{...restField}
											name={[name, 'email']}
											rules={[
												{
													required: true,
													type: 'email',
													message: __(
														'Please enter a valid email',
														'quillbooking'
													),
												},
											]}
										>
											<Input
												size="large"
												placeholder={__(
													'Guest Email',
													'quillbooking'
												)}
											/>
										</Form.Item>

										{/* Remove button moved outside of Form.Item */}
										<MinusCircleOutlined
											style={{
												fontSize: 16,
												color: '#999',
											}}
											onClick={() => remove(name)}
										/>
									</Space>
								))}

								<Form.Item>
									<Button
										type="dashed"
										onClick={() => add()}
										icon={<PlusOutlined />}
									>
										+ {__('Add guests', 'quillbooking')}
									</Button>
								</Form.Item>
							</>
						)}
					</Form.List>
				</Form.Item>
			);
		case 'select':
			return (
				<Form.Item {...commonProps}>
					<Select placeholder={field.placeholder} size="large">
						{field.settings.options.map((option: string) => (
							<Option key={option} value={option}>
								{option}
							</Option>
						))}
					</Select>
				</Form.Item>
			);
		default:
			return null;
	}
};

export default DynamicFormField;
