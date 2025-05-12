import type { Rule } from 'antd/es/form';
import {
	Form,
	Input,
	InputNumber,
	DatePicker,
	TimePicker,
	Checkbox,
	Radio,
	Select,
	Slider,
	Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { __ } from '@wordpress/i18n';
import './style.scss';
import DynamicLocationFields from '../dynamic-location-field';

const { TextArea, Password } = Input;
const { Option } = Select;

// Component mapping with configuration
const FIELD_COMPONENTS = {
	text: (props) => <Input {...props} />,
	email: (props) => <Input {...props} />,
	textarea: (props) => <TextArea {...props} />,
	password: (props) => <Password {...props} />,
	number: (props) => <InputNumber {...props} />,
	phone: (props) => <InputNumber {...props} />,
	date: (props) => <DatePicker {...props} />,
	time: (props) => <TimePicker {...props} />,
	datetime: (props) => <DatePicker showTime {...props} />,
	range: (props) => <Slider {...props} />,
	color: (props) => <Input type="color" {...props} />,
	file: (props) => (
		<Upload beforeUpload={() => false} {...props}>
			<UploadOutlined /> {__('Upload', '@quillbooking')}
		</Upload>
	),
	select: (props) => {
		const { options = [], ...restProps } = props;

		return (
			<Select {...restProps}>
				{options.map((option, index) => {
					if (isObjectOption(option)) {
						return (
							<Option key={option.value} value={option.value}>
								{option.label}
							</Option>
						);
					}

					// Handle string format: "Option 1"
					return (
						<Option key={`${option}-${index}`} value={option}>
							{option}
						</Option>
					);
				})}
			</Select>
		);
	},
	radio: (props) => <Radio.Group {...props} />,
	checkbox: ({ label, required, ...props }) => (
		<Checkbox {...props}>
			{label}
			{required && <span className="required">*</span>}
		</Checkbox>
	),
};

const isObjectOption = (option) => {
	return (
		typeof option === 'object' &&
		option !== null &&
		'label' in option &&
		'value' in option
	);
};

const FormField = ({ field, id, form, locationFields }) => {
	const {
		type,
		label,
		value,
		options = [],
		helpText = null,
		required,
		...otherProps
	} = field;
	const FieldComponent = FIELD_COMPONENTS[type] || FIELD_COMPONENTS.text;
	const style = { width: '100%' };
	let updatedOptions = options;
	if (field.settings?.options?.length) {
		updatedOptions = field.settings.options;
	}

	const fieldProps = {
		value,
		options: updatedOptions,
		label,
		required,
		style,
		...otherProps,
	};

	const rules: Rule[] = [];

	// Required validation
	if (required) {
		rules.push({
			required: true,
			message: __(`${label} is required`, '@quillbooking'),
		});
	}

	if (type === 'email') {
		rules.push({
			type: 'email',
			message: __('Please enter a valid email address', '@quillbooking'),
		});
	}

	if (type === 'phone') {
		rules.push({
			pattern: field.pattern || /^[0-9+\-\s()]*$/,
			message: __('Please enter a valid phone number', '@quillbooking'),
		});
	}

	if (type === 'number') {
		if (field.settings?.min) {
			rules.push({
				type: 'number',
				min: field.settings.min,
				message: __(
					`${label} must be at least ${field.settings.min}`,
					'@quillbooking'
				),
			});
		}
		if (field.settings?.max) {
			rules.push({
				type: 'number',
				max: field.settings.max,
				message: __(
					`${label} must be at most ${field.settings.max}`,
					'@quillbooking'
				),
			});
		}
		rules.push({
			type: 'number',
			message: __('Please enter a valid number', '@quillbooking'),
		});
	}

	return (
		<>
			<div style={{ marginBottom: '24px' }}>
				<Form.Item
					style={{ marginBottom: 0 }}
					label={
						type !== 'checkbox' && (
							<div className="form-label">
								<p>
									{label}
									{required && (
										<span className="required">*</span>
									)}
								</p>
							</div>
						)
					}
					name={id}
					key={id}
					rules={rules}
					validateTrigger={['onChange', 'onBlur']}
					valuePropName={type === 'checkbox' ? 'checked' : 'value'}
				>
					{FieldComponent(fieldProps)}
				</Form.Item>
				{helpText && <div className="help-text">{helpText}</div>}
			</div>
			{id === 'location-select' && form && (
				<DynamicLocationFields
					fieldKey={id}
					locationFields={locationFields}
				/>
			)}
		</>
	);
};

export default FormField;
