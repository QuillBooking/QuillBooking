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
// import DynamicLocationFields from '../dynamic-location-field';
import getValidationRules from './validation-rules';

const { TextArea, Password } = Input;
const { Option } = Select;

const isObjectOption = (option) => {
	return (
		typeof option === 'object' &&
		option !== null &&
		'label' in option &&
		'value' in option
	);
};

const FIELD_COMPONENTS = {
	text: (props) => <Input size="large" {...props} />,
	email: (props) => <Input size="large" {...props} />,
	textarea: (props) => <TextArea size="large" {...props} />,
	password: (props) => <Password size="large" {...props} />,
	number: (props) => <InputNumber size="large" {...props} />,
	phone: (props) => <InputNumber size="large" {...props} />,
	date: (props) => <DatePicker size="large" {...props} />,
	time: (props) => <TimePicker size="large" {...props} />,
	datetime: (props) => <DatePicker size="large" showTime {...props} />,
	range: (props) => <Slider size="large" {...props} />,
	color: (props) => <Input size="large" type="color" {...props} />,
	file: (props) => (
		<Upload beforeUpload={() => false} {...props}>
			<UploadOutlined /> {__('Upload', '@quillbooking')}
		</Upload>
	),
	select: (props) => {
		const { options = [], ...restProps } = props;

		return (
			<Select size="large" {...restProps}>
				{options.map((option, index) => {
					if (isObjectOption(option)) {
						return (
							<Option key={option.value} value={option.value}>
								{option.label}
							</Option>
						);
					}
					return (
						<Option key={`${option}-${index}`} value={option}>
							{option}
						</Option>
					);
				})}
			</Select>
		);
	},
	radio: (props) => <Radio.Group size="large" {...props} />,
	checkbox: ({ label, required, ...props }) => (
		<Checkbox {...props}>
			{label}
			{required && <span className="required">*</span>}
		</Checkbox>
	),
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

	const rules = getValidationRules(field);

	return (
		<>
			<div style={{ marginBottom: '16px' }}>
				<Form.Item
					style={{ marginBottom: 0 }}
					label={
						type !== 'checkbox' && (
							<div>
								<p className="form-label">{label}</p>
							</div>
						)
					}
					name={`fields-${id}`}
					key={id}
					rules={rules}
					validateTrigger={['onChange', 'onBlur']}
					valuePropName={type === 'checkbox' ? 'checked' : 'value'}
				>
					{FieldComponent(fieldProps)}
				</Form.Item>
				{helpText && <div className="help-text">{helpText}</div>}
			</div>
			{/* {id === 'location-select' && form && (
				<DynamicLocationFields
					fieldKey={id}
					locationFields={locationFields}
				/>
			)} */}
		</>
	);
};

export default FormField;
