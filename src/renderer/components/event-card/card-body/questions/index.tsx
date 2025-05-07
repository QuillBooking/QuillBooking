import { __ } from '@wordpress/i18n';
import { Fields } from '../../../../types';
import './style.scss';
import LeftArrowIcon from '../../../../icons/left-arrow-icon';
import { Form } from 'antd';
import FormField from '../../../inputs';

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

	const allFields = {
		...fields.system,
		...fields.location,
		...fields.custom,
	};
	const sortedFields = Object.keys(allFields).sort(
		(a, b) => allFields[a].order - allFields[b].order
	);

	// called when the user clicks “Schedule Event”
	const handleFinish = (values: Record<string, any>) => {
		// values is an object keyed by your field IDs
		console.log('handle finish:', values);
		onSubmit(values);
		// advance to next step if you want:
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
				<Form layout="vertical" onFinish={handleFinish} form={form}>
					{sortedFields.map((fieldKey, index) => (
						<>
							<FormField
								key={index}
								id={fieldKey}
								field={allFields[fieldKey]}
								form={form}
							/>
						</>
					))}
					<Form.Item className="schedule-btn-container">
						<button className="schedule-btn" type="submit">
							{__('Schedule Event', '@quillbooking')}
						</button>
					</Form.Item>
				</Form>
			)}
		</div>
	);
};

export default QuestionsComponents;
