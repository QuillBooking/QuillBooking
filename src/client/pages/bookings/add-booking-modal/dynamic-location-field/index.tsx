import { Checkbox, Form, Input } from 'antd';

const renderField = (field) => {
	switch (field.type) {
		case 'text':
			return <Input size='large' placeholder={field.desc} />;
		case 'checkbox':
			return <Checkbox>{field.desc}</Checkbox>;
		case 'url':
			return <Input size='large' type="url" placeholder={field.desc} />;
		default:
			return <Input size='large' placeholder={field.desc} />;
	}
};
/**
 * Renders dynamic fields for a selected location type
 */
interface Field {
	label: string;
	desc: string;
	type: string;
	required?: boolean;
}

interface DynamicLocationFieldsProps {
	fieldKey?: string;
	locationFields: Record<string, Field>;
}

const DynamicLocationFields = ({
	fieldKey = 'location-select',
	locationFields,
}: DynamicLocationFieldsProps) => {
	return (
		<Form.Item noStyle shouldUpdate>
			{({ getFieldValue }) => {
				const selectedType = getFieldValue('fields-location-select');
				if (!locationFields[selectedType]) return null;
				const field = locationFields[selectedType];

				return (
					<>
						<Form.Item
							key={fieldKey}
							name={['field-', fieldKey]}
							label={
								<div className="form-label">
									<p className='text-[14px]'>
										{field.label}
										{field.required && (
											<span className="required">*</span>
										)}
									</p>
								</div>
							}
						>
							{renderField(field)}
						</Form.Item>
					</>
				);
			}}
		</Form.Item>
	);
};

export default DynamicLocationFields;
