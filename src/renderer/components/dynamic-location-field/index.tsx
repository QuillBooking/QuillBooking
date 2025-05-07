import { Checkbox, Form, Input } from 'antd';
import ConfigAPI from '@quillbooking/config';

const renderField = (field) => {
	switch (field.type) {
		case 'text':
			return <Input placeholder={field.desc} />;
		case 'checkbox':
			return <Checkbox>{field.desc}</Checkbox>;
		case 'url':
			return <Input type="url" placeholder={field.desc} />;
		default:
			return <Input placeholder={field.desc} />;
	}
};
/**
 * Renders dynamic fields for a selected location type
 */
const DynamicLocationFields = ({ fieldKey = 'location-select' }) => {
	const locationTypes = ConfigAPI.getLocations();
	return (
		<Form.Item noStyle shouldUpdate>
			{({ getFieldValue }) => {
				const selectedType = getFieldValue('location-select');
				const locationConfig = locationTypes[selectedType];
				if (!locationConfig) return null;

				return (
					<>
						{Object.entries(locationConfig.frontend_fields).map(
							([_, field]) => (
								<Form.Item
									key={fieldKey}
									name={['field', fieldKey]}
									label={
										<div className="form-label">
											<p>
												{field.label}
												{field.required && (
													<span className="required">
														*
													</span>
												)}
											</p>
										</div>
									}
								>
									{renderField(field)}
								</Form.Item>
							)
						)}
					</>
				);
			}}
		</Form.Item>
	);
};

export default DynamicLocationFields;
