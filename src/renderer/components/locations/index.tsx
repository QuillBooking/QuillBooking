import { Form, Input, Radio } from 'antd';
import DynamicLocationFields from '../dynamic-location-field';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { __ } from '@wordpress/i18n';

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
	countryCode: string;
}

const Locations = ({ locationFields, countryCode }: LocationsProps) => {
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
								<p>
									{locationFields.label}
									<span className="required">*</span>
								</p>
							</div>
						}
					>
						<Radio.Group>
							{locationFields.options.map((option) => (
								<Radio key={option.value} value={option.value}>
									{option.label}
								</Radio>
							))}
						</Radio.Group>
					</Form.Item>
					<DynamicLocationFields
						locations={locationFields.options}
						countryCode={countryCode}
					/>
				</>
			) : (
				<>
					<Form.Item
						key="location"
						name="location"
						initialValue={locationFields.options[0].value}
						style={{ display: 'none' }}
					>
						<Input type="hidden" />
					</Form.Item>
					{locationFields.options[0].fields &&
						Object.entries(locationFields.options[0].fields).map(
							([fieldKey, field]) => {
								const typedField = field as Field & {
									placeholder?: string;
								};
								return (
									<>
										<Form.Item
											key={fieldKey}
											name="location-data"
											rules={[
												{
													required: true,
													message: __(
														`${typedField.label} is required`,
														'@quillbooking'
													),
												},
											]}
											label={
												<div className="form-label">
													<p>
														{typedField.label}
														<span className="required">
															*
														</span>
													</p>
												</div>
											}
										>
											{typedField.type == 'phone' ? (
												<PhoneInput
													country={countryCode}
												/>
											) : (
												<Input
													placeholder={
														typedField.placeholder
													}
													type={typedField.type}
												/>
											)}
										</Form.Item>
									</>
								);
							}
						)}
				</>
			)}
		</>
	);
};

export default Locations;
