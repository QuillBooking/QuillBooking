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
import getValidationRules from './validation-rules';
import Locations from '../locations';

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

const FormField = ({ field, id }) => {
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
			{id === 'location-select' ? (
				<Locations locationFields={field} />
			) : (
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
						valuePropName={
							type === 'checkbox' ? 'checked' : 'value'
						}
					>
						{FieldComponent(fieldProps)}
					</Form.Item>
					{helpText && <div className="help-text">{helpText}</div>}
				</div>
			)}
		</>
	);
};

export default FormField;
