import { Form, Input, Radio } from 'antd';
import DynamicLocationFields from '../dynamic-location-field';

/**
 * Renders dynamic fields for a selected location type
 */
interface Field {
	label: string;
	desc: string;
	type: string;
	required?: boolean;
}

interface Option {
	value: string;
	label: string;
	fields?: Record<string, Field>;
}

interface LocationsProps {
	locationFields: {
		label: string;
		options: Option[];
	};
}

const Locations = ({ locationFields }: LocationsProps) => {
	console.log('Locations', locationFields);
	return (
		<>
			{locationFields.options.length > 1 ? (
				<>
					<Form.Item
						key="location"
						name="location"
						label={
							<div className="form-label">
								<p>{locationFields.label}</p>
							</div>
						}
						rules={[
							{
								required: true,
								message: 'Please select a location',
							},
						]}
					>
						<Radio.Group>
							{locationFields.options.map((option) => (
								<Radio key={option.value} value={option.value}>
									{option.label}
								</Radio>
							))}
						</Radio.Group>
					</Form.Item>
					<DynamicLocationFields locations={locationFields.options} />
				</>
			) : (
				locationFields.options[0].fields &&
				Object.entries(locationFields.options[0].fields).map(
					([fieldKey, field]) => {
						const typedField = field as Field & {
							placeholder?: string;
						};
						return (
							<Form.Item
								key={fieldKey}
								name={['field', fieldKey]}
								label={
									<div className="form-label">
										<p>
											{typedField.label}
											<span className="required">*</span>
										</p>
									</div>
								}
							>
								<Input
									placeholder={typedField.placeholder}
									type={typedField.type}
								/>
							</Form.Item>
						);
					}
				)
			)}
		</>
	);
};

export default Locations;
