import { __ } from '@wordpress/i18n';
import { Fields } from 'client/types';
import './style.scss';
import { Form } from 'antd';
import FormField from '../inputs';

interface QuestionsComponentsProps {
	fields: Fields;
}

const QuestionsComponents: React.FC<QuestionsComponentsProps> = ({
	fields,
}) => {
	const [form] = Form.useForm();

	const allFields = {
		message: fields.system.message,
		...(fields.location['location-select'] && {
			'location-select': fields.location['location-select'],
		}),
		...fields.custom,
	};

	const locationFields = {
		attendee_address: fields.location.address,
		attendee_phone: fields.location.phone,
	};
	const sortedFields = Object.keys(allFields).sort(
		(a, b) => allFields[a].order - allFields[b].order
	);

	return (
		<>
			{sortedFields.map(
				(fieldKey, index) =>
					(allFields[fieldKey].enabled ||
						allFields[fieldKey].enabled === undefined) && (
						<FormField
							key={index}
							id={fieldKey}
							field={allFields[fieldKey]}
							form={form}
							locationFields={locationFields}
						/>
					)
			)}
		</>
	);
};

export default QuestionsComponents;
