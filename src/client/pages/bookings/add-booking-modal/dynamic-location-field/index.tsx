import { Form, Input } from 'antd';

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
													<p>{field.label}</p>
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
											<Input
												size="large"
												placeholder={field.placeholder}
											/>
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
