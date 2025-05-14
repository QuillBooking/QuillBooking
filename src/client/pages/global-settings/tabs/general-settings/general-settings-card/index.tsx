/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Checkbox, Flex, Input, Radio, Select } from 'antd';

/**
 * Internal dependencies
 */
import { CardHeader, AdvancedSettingsIcon } from '@quillbooking/components';

const GeneralSettingsCard = ({ settings, updateSettings }) => {
	const getTimeOptions = () => {
		const options: { value: number; label: string }[] = [];

		// 10 to 50 minutes
		for (let i = 10; i <= 50; i += 10) {
			options.push({
				value: i,
				label: `${i} ${__('minutes', 'quillbooking')}`,
			});
		}

		// 1 to 12 hours
		for (let i = 1; i <= 12; i++) {
			options.push({
				value: i * 60,
				label: `${i} ${i === 1 ? __('hour', 'quillbooking') : __('hours', 'quillbooking')}`,
			});
		}

		// 1 to 2 days
		for (let i = 1; i <= 2; i++) {
			options.push({
				value: i * 24 * 60,
				label: `${i} ${i === 1 ? __('day', 'quillbooking') : __('days', 'quillbooking')}`,
			});
		}

		return options;
	};

	// Country code options simplified
	const countryOptions = [
		{ value: '+1', label: 'United States (+1)' },
		{ value: '+44', label: 'United Kingdom (+44)' },
		{ value: '+91', label: 'India (+91)' },
		{ value: '+49', label: 'Germany (+49)' },
		{ value: '+33', label: 'France (+33)' },
		{ value: '+81', label: 'Japan (+81)' },
		{ value: '+86', label: 'China (+86)' },
		{ value: '+7', label: 'Russia (+7)' },
		{ value: '+61', label: 'Australia (+61)' },
		{ value: '+55', label: 'Brazil (+55)' },
		{ value: '+39', label: 'Italy (+39)' },
		{ value: '+1', label: 'Canada (+1)' },
		{ value: '+52', label: 'Mexico (+52)' },
	];

	// Day options
	const dayOptions = [
		{ value: 'sunday', label: __('Sunday', 'quillbooking') },
		{ value: 'monday', label: __('Monday', 'quillbooking') },
		{ value: 'tuesday', label: __('Tuesday', 'quillbooking') },
		{ value: 'wednesday', label: __('Wednesday', 'quillbooking') },
		{ value: 'thursday', label: __('Thursday', 'quillbooking') },
		{ value: 'friday', label: __('Friday', 'quillbooking') },
		{ value: 'saturday', label: __('Saturday', 'quillbooking') },
	];

	// Frequency options
	const frequencyOptions = [
		{ value: 'daily', label: __('Daily', 'quillbooking') },
		{ value: 'weekly', label: __('Weekly', 'quillbooking') },
		{ value: 'monthly', label: __('Monthly', 'quillbooking') },
	];

	return (
		<Card>
			<CardHeader
				title={__('General Settings', 'quillbooking')}
				description={__(
					'Manage your settings related emails, notifications and other general settings',
					'quillbooking'
				)}
				icon={<AdvancedSettingsIcon />}
			/>

			<Flex vertical gap={25} className="mt-4">
				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__('Admin Email', 'quillbooking')}
					</div>
					<Input
						id="admin_email"
						type="email"
						className="w-full rounded-lg h-[48px]"
						placeholder={__('{{wp.admin_email}}', 'quillbooking')}
						value={settings.admin_email || ''}
						onChange={(e) =>
							updateSettings('admin_email', e.target.value)
						}
					/>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__('Calendar Start From', 'quillbooking')}
					</div>
					<Select
						id="start_from"
						className="w-full rounded-lg h-[48px]"
						value={settings.start_from || 'monday'}
						onChange={(value) =>
							updateSettings('start_from', value)
						}
						options={dayOptions}
					/>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__('Default Time Format', 'quillbooking')}
					</div>
					<Radio.Group
						value={settings.time_format}
						onChange={(e) =>
							updateSettings('time_format', e.target.value)
						}
						className="flex w-full"
					>
						<Radio
							value="12"
							className={`custom-radio border w-1/2 rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                ${
									settings.time_format === '12'
										? 'bg-color-secondary border-color-primary'
										: 'border'
								}`}
						>
							{__('12h', 'quillbooking')}
						</Radio>
						<Radio
							value="24"
							className={`custom-radio border w-1/2 rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                ${
									settings.time_format === '24'
										? 'bg-color-secondary border-color-primary'
										: 'border'
								}`}
						>
							{__('24h', 'quillbooking')}
						</Radio>
					</Radio.Group>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__(
							'Mark booking as cancelled automatically after',
							'quillbooking'
						)}
					</div>
					<Select
						id="auto_cancel_after"
						className="w-full rounded-lg h-[48px]"
						value={settings.auto_cancel_after || 60}
						onChange={(value) =>
							updateSettings('auto_cancel_after', value)
						}
						options={getTimeOptions()}
					/>
					<div className="text-[#818181]">
						{__(
							'if customer does not complete the payment for paid events.',
							'quillbooking'
						)}
					</div>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__(
							'Mark booking as completed automatically after',
							'quillbooking'
						)}
					</div>
					<Select
						id="auto_complete_after"
						className="w-full rounded-lg h-[48px]"
						value={settings.auto_complete_after || 120}
						onChange={(value) =>
							updateSettings('auto_complete_after', value)
						}
						options={getTimeOptions()}
					/>
					<div className="text-[#818181]">
						{__('from the event end time', 'quillbooking')}
					</div>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__('Default Country Code', 'quillbooking')}
					</div>
					<Select
						id="default_country_code"
						className="w-full rounded-lg h-[48px]"
						value={settings.default_country_code || 120}
						onChange={(value) =>
							updateSettings('default_country_code', value)
						}
						options={countryOptions}
					/>
				</Flex>

				<Flex vertical gap={4}>
					<div className="font-semibold text-[16px]">
						{__('Summary Email', 'quillbooking')}
					</div>
					<Checkbox
						className="custom-check text-[#3F4254] font-semibold"
						checked={settings.enable_summary_email || false}
						onChange={(e) =>
							updateSettings(
								'enable_summary_email',
								e.target.checked
							)
						}
					>
						{__(
							'Enable Booking Summary Notification.',
							'quillbooking'
						)}
					</Checkbox>
				</Flex>

				{settings.enable_summary_email && (
					<Flex vertical gap={4}>
						<div className="text-[#3F4254] font-semibold text-[16px]">
							{__('Email Frequency?', 'quillbooking')}
						</div>
						<Select
							id="summary_email_frequency"
							className="w-full rounded-lg h-[48px]"
							value={settings.summary_email_frequency || 120}
							onChange={(value) =>
								updateSettings('summary_email_frequency', value)
							}
							options={frequencyOptions}
						/>
					</Flex>
				)}
			</Flex>
		</Card>
	);
};

export default GeneralSettingsCard;
