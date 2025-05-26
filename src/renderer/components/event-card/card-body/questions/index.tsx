import { __ } from '@wordpress/i18n';
import { Fields } from '../../../../types';
import './style.scss';
import LeftArrowIcon from '../../../../icons/left-arrow-icon';
import { Form } from 'antd';
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
		...(fields.location['location-select']
			? { 'location-select': fields.location['location-select'] }
			: { ...fields.location }),
		...fields.custom,
	};

	const sortedFields = Object.keys(allFields).sort(
		(a, b) => allFields[a].order - allFields[b].order
	);

	// called when the user clicks "Schedule Event"
	const handleFinish = (values: Record<string, any>) => {
		setIsSubmitting(true);
		
		// Call the onSubmit function passed from parent
		try {
			onSubmit(values);
		} catch (error) {
			// If there's an error, re-enable the button
			console.error('Form submission error:', error);
			setIsSubmitting(false);
		}
		
		// Note: You might want to handle re-enabling the button depending on your
		// overall application structure. If onSubmit is asynchronous and you need to
		// re-enable the button after it completes, you would need to modify onSubmit
		// to return a Promise and handle it appropriately.
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
								/>
							)
					)}
					<Form.Item className="schedule-btn-container">
						<button 
							className="schedule-btn" 
							type="submit" 
							disabled={isSubmitting}
						>
							{!isSubmitting ? __('Schedule Event', '@quillbooking') : 'Scheduling...'}
						</button>
					</Form.Item>
				</Form>
			)}
		</div>
	);
};

export default QuestionsComponents;