import { __ } from '@wordpress/i18n';
import { Fields } from '../../../../types';
import './style.scss';
import LeftArrowIcon from '../../../../icons/left-arrow-icon';
import { Form, Spin } from 'antd';
import FormField from '../../../inputs';
import { useState } from 'react';

interface QuestionsComponentsProps {
	fields: Fields;
	setStep: (step: number) => void;
	onSubmit: (values: any) => void;
}

const QuestionsComponents: React.FC<QuestionsComponentsProps> = ({
	fields,
	setStep,
	onSubmit,
}) => {
	const [form] = Form.useForm();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const allFields = {
		...fields.system,
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

	// called when the user clicks "Schedule Event"
	const handleFinish = async (values: Record<string, any>) => {
		try {
			setIsSubmitting(true);
			await onSubmit(values);
		} catch (error) {
			console.error('Error submitting form:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="questions-container">
			<div className="questions-header">
				<div
					className="questions-header-icon"
					onClick={() => setStep(1)}
				>
					<LeftArrowIcon />
				</div>
				<p>{__('Enter Details', '@quillbooking')}</p>
			</div>
			{sortedFields.length > 0 && (
				<Form
					layout="vertical"
					onFinish={handleFinish}
					form={form}
					requiredMark={false}
				>
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
					<Form.Item className="schedule-btn-container">
						<button
							className="schedule-btn"
							type="submit"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<Spin
										size="small"
										style={{ marginRight: '8px' }}
									/>
									{__('Scheduling...', '@quillbooking')}
								</>
							) : (
								__('Schedule Event', '@quillbooking')
							)}
						</button>
					</Form.Item>
				</Form>
			)}
		</div>
	);
};

export default QuestionsComponents;
