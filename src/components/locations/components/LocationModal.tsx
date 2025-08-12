import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Modal, Form, Input, Checkbox, Button } from 'antd';
import { map, get } from 'lodash';
import TextArea from 'antd/es/input/TextArea';
import type { LocationField } from '@quillbooking/config';

const { useForm } = Form;

interface LocationModalProps {
	isVisible: boolean;
	newLocationType: string | null;
	locationTypes: any;
	onOk: () => Promise<void>;
	onCancel: () => void;
	form: any;
}

const LocationModal: React.FC<LocationModalProps> = ({
	isVisible,
	newLocationType,
	locationTypes,
	onOk,
	onCancel,
	form,
}) => {
	const renderCustomLocationFields = () => (
		<>
			<Form.Item
				name="location"
				label={
					<div className="text-[#09090B] text-[16px]">
						{__('Location Name', 'quillbooking')}
						<span className="text-red-500">*</span>
					</div>
				}
				rules={[
					{
						required: true,
						message: __(
							'Please enter location name',
							'quillbooking'
						),
					},
				]}
			>
				<Input
					placeholder={__('Location Name', 'quillbooking')}
					className="rounded-lg h-[48px]"
				/>
			</Form.Item>

			<Form.Item
				name="description"
				label={
					<div className="text-[#09090B] text-[16px]">
						{__('Description', 'quillbooking')}
						<span className="text-red-500">*</span>
					</div>
				}
				rules={[
					{
						required: true,
						message: __('Please enter description', 'quillbooking'),
					},
				]}
			>
				<TextArea
					rows={4}
					placeholder={__('Description', 'quillbooking')}
					className="rounded-lg"
				/>
			</Form.Item>

			<Form.Item name="display_on_booking" valuePropName="checked">
				<Checkbox className="custom-check text-[#3F4254] font-semibold">
					{__('Display on booking', 'quillbooking')}
				</Checkbox>
			</Form.Item>
		</>
	);

	const renderStandardLocationFields = () => {
		if (!newLocationType) return null;

		return map(
			get(locationTypes, `${newLocationType}.fields`, {}),
			(field: LocationField, fieldKey) => (
				<Form.Item
					key={fieldKey}
					name={fieldKey}
					{...(field.type === 'checkbox'
						? { valuePropName: 'checked' }
						: {
								label: (
									<div className="text-[#09090B] text-[16px]">
										{field.label}
										<span className="text-red-500">*</span>
										{field.label === 'Person Phone' && (
											<span className="text-[#afb9c4] text-sm ml-2">
												(with country code)
											</span>
										)}
									</div>
								),
							})}
					rules={[
						{
							required: field.required,
							message: sprintf(
								__('Please enter %s', 'quillbooking'),
								field.label
							),
						},
					]}
				>
					{field.type === 'checkbox' ? (
						<Checkbox className="custom-check text-[#3F4254] font-semibold">
							{field.label}
						</Checkbox>
					) : (
						<Input
							type={field.type}
							placeholder={sprintf(
								__('%s', 'quillbooking'),
								field.label
							)}
							className="rounded-lg h-[48px]"
						/>
					)}
				</Form.Item>
			)
		);
	};

	const getModalTitle = () => {
		if (newLocationType === 'custom') {
			return __('Custom Location', 'quillbooking');
		}
		return sprintf(
			__(' %s ', 'quillbooking'),
			get(locationTypes, `${newLocationType}.title`, '')
		);
	};

	return (
		<Modal
			title={
				<div>
					<h2 className="text-[#09090B] text-[30px] font-[700]">
						{getModalTitle()}
					</h2>
					<span className="text-[#979797] font-[400] text-[14px]">
						Add the following data.
					</span>
				</div>
			}
			open={isVisible}
			getContainer={false}
			footer={null}
			onCancel={onCancel}
		>
			<Form form={form} layout="vertical" requiredMark={false}>
				{newLocationType === 'custom'
					? renderCustomLocationFields()
					: renderStandardLocationFields()}

				<Form.Item>
					<Button
						htmlType="submit"
						className="w-full bg-color-primary text-white font-semibold rounded-lg transition-all"
						onClick={onOk}
					>
						{__('Submit', 'quillbooking')}
					</Button>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default LocationModal;
