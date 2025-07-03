import { __ } from '@wordpress/i18n';
import { Fields } from '../../../../types';
import './style.scss';
import LeftArrowIcon from '../../../../icons/left-arrow-icon';
import { Form, Spin } from 'antd';
import FormField from '../../../inputs';
import { useEffect, useState } from 'react';
import { useApi } from '@quillbooking/shared-hooks';
import { css } from '@emotion/css';

interface QuestionsComponentsProps {
	fields: Fields;
	setStep: (step: number) => void;
	onSubmit: (values: any) => void;
	baseColor: string;
	darkColor: string;
	prefilledData?: { name?: string; email?: string }; // name comes from username parameter
}

const QuestionsComponents: React.FC<QuestionsComponentsProps> = ({
	fields,
	setStep,
	onSubmit,
	baseColor,
	darkColor,
	prefilledData,
}) => {
	const [form] = Form.useForm();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [countryCode, setCountryCode] = useState<string>('us');
	const { callApi } = useApi();

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

	const fetchCountryCode = () => {
		callApi({
			path: 'settings',
			method: 'GET',
			onSuccess: (data) => {
				console.log('Country code fetched:', data);
				setCountryCode(data.general.default_country_code.toLowerCase());
			},
			onError: (error) => {
				console.error('Error fetching country code:', error);
			},
		});
	};

	useEffect(() => {
		fetchCountryCode();
	}, []);

	// Set initial form values from prefilled data
	useEffect(() => {
		if (prefilledData) {
			const initialValues: Record<string, any> = {};
			if (prefilledData.name) initialValues.name = prefilledData.name;
			if (prefilledData.email) initialValues.email = prefilledData.email;

			if (Object.keys(initialValues).length > 0) {
				form.setFieldsValue(initialValues);
			}
		}
	}, [prefilledData, form]);

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
									countryCode={countryCode}
								/>
							)
					)}
					<Form.Item className="schedule-btn-container">
						<button
							className={`schedule-btn ${css`
								background-color: ${baseColor};
								&:hover {
									background-color: ${darkColor};
								}
							`}`}
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
