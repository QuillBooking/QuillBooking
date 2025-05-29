import { __ } from '@wordpress/i18n';
import LeftArrowIcon from '../../icons/left-arrow-icon';
import { Booking, Fields } from '../../types';
import { Form, Input } from 'antd';
import { Dayjs } from 'dayjs';
import { css } from '@emotion/css';

interface RescheduleProps {
	setStep: (step: number) => void;
	fields: Fields;
	ajax_url: string;
	booking: Booking | null;
	selectedDate: Dayjs | null;
	selectedTime: string | null;
	timezone: string;
	url: string;
	baseColor: string;
	darkColor: string;
}

const { TextArea } = Input;

const Reschedule: React.FC<RescheduleProps> = ({
	setStep,
	fields,
	ajax_url,
	booking,
	selectedDate,
	selectedTime,
	timezone: timeZone,
	url,
	baseColor,
	darkColor,
}) => {
	const [form] = Form.useForm();

	// Helper function to render form label with required mark if needed
	const renderLabel = (field: { label: string; required: boolean }) => (
		<div className="form-label">
			<p>
				{field.label}
				{field.required && <span className="required">*</span>}
			</p>
		</div>
	);

	// Called when the user clicks "Reschedule Event"
	const handleFinish = async (values: any) => {
		const formData = new FormData();
		formData.append('action', 'quillbooking_reschedule_booking');
		formData.append('id', booking?.hash_id?.toString() || '');
		formData.append('timezone', timeZone || '');
		formData.append(
			'start_date',
			`${selectedDate ? selectedDate.format('YYYY-MM-DD') : ''} ${selectedTime ? selectedTime + ':00' : ''}`
		);

		// Add reason for rescheduling from form values
		if (values.reasonForReschedule) {
			formData.append('reschedule_reason', values.reasonForReschedule);
		}

		try {
			const response = await fetch(ajax_url, {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				(window.top || window).location.href =
					`${url}/?quillbooking=booking&id=${booking?.hash_id}&type=confirm`;
			}
		} catch (error) {
			console.error('Error rescheduling booking:', error);
		}
	};

	// Get the rescheduling reason field from fields
	const reschedulingReasonField = fields.other?.rescheduling_reason;

	return (
		<div className="reschedule-container">
			<div className="questions-container">
				<div className="questions-header">
					<div
						className="questions-header-icon"
						onClick={() => setStep(1)}
					>
						<LeftArrowIcon />
					</div>
					<p>{__('Enter Details', 'quillbooking')}</p>
				</div>

				<Form
					layout="vertical"
					onFinish={handleFinish}
					form={form}
					requiredMark={false}
				>
					<Form.Item
						style={{ marginBottom: 16 }}
						label={renderLabel(fields.system.name)}
						name="name"
						initialValue={booking?.guest.name}
					>
						<Input disabled />
					</Form.Item>

					<Form.Item
						style={{ marginBottom: 16 }}
						label={renderLabel(fields.system.email)}
						name="email"
						initialValue={booking?.guest.email}
					>
						<Input disabled />
					</Form.Item>

					{reschedulingReasonField &&
						reschedulingReasonField.enabled && (
							<>
								<Form.Item
									style={{ marginBottom: 16 }}
									label={renderLabel(reschedulingReasonField)}
									name="reasonForReschedule"
									rules={[
										{
											required:
												reschedulingReasonField.required,
											message: __(
												'Please provide a reason for rescheduling',
												'quillbooking'
											),
										},
									]}
								>
									<TextArea
										placeholder={
											reschedulingReasonField.placeholder
										}
									/>
								</Form.Item>
								{reschedulingReasonField.helpText && (
									<div className="help-text">
										{reschedulingReasonField.helpText}
									</div>
								)}
							</>
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
						>
							{__('Reschedule Event', 'quillbooking')}
						</button>
					</Form.Item>
				</Form>
			</div>
		</div>
	);
};

export default Reschedule;
