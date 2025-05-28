import { Form, Input } from 'antd';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

/**
 * Renders dynamic fields for a selected location type
 */
interface Field {
	label: string;
	type: string;
	required?: boolean;
	placeholder?: string;
}

interface Option {
	value: string;
	label: string;
	fields?: Record<string, Field>;
}

interface DynamicLocationFieldsProps {
	locations: Option[];
}

const DynamicLocationFields = ({ locations }: DynamicLocationFieldsProps) => {
	console.log(locations);
	return (
		<Form.Item noStyle shouldUpdate>
			{({ getFieldValue }) => {
				const selectedType = getFieldValue('location');
				console.log(selectedType);
				if (
					selectedType !== 'attendee_address' &&
					selectedType !== 'attendee_phone'
				)
					return null;

				return (
					<>
						{locations.map(
							(location) =>
								location.value === selectedType &&
								location.fields &&
								Object.entries(location.fields).map(
									([_, field]) => (
										<Form.Item
											key="location-data"
											name="location-data"
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
											rules={
												field.required
													? [
															{
																required: true,
																message: `${field.label} is required`,
															},
														]
													: []
											}
										>
											{field.type === 'phone' ? (
												<PhoneInput country={'ca'} />
											) : (
												<Input
													placeholder={
														field.placeholder
													}
												/>
											)}
										</Form.Item>
									)
								)
						)}
					</>
				);
			}}
		</Form.Item>
	);
};

export default DynamicLocationFields;
