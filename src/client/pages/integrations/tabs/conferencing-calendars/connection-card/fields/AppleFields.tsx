import { __ } from '@wordpress/i18n';
import { Flex, Form, Select } from 'antd';
import { useEffect } from 'react';
import { NavLink } from '@quillbooking/navigation';

const AppleFields = ({ CACHE_TIME_OPTIONS, form, calendar }) => {
	const cacheTime = Form.useWatch('cache_time', form);
	useEffect(() => {
		console.log('Apple cache_time:', cacheTime);
	}, [cacheTime]);

	const handleCacheTimeChange = (value) => {
		console.log('Apple selection changed to:', value);
		form.setFieldValue('cache_time', value);
	};

	return (
		<div className="apple-fields">
			<Flex vertical gap={10} className="w-full">
				<div className="text-[#71717A] italic">
					{__(
						'Your Apple Calendar API configuration is already. You can connect your Apple Calendar from your host settings.',
						'quillbooking'
					)}
					<span className="cursor-pointer font-semibold underline ml-1">
						{__('Read the documentation', 'quillbooking')}
					</span>
				</div>

				<Form.Item
					name="cache_time"
					label={
						<div className="text-[#3F4254] font-semibold text-[16px]">
							{__('Caching Time', 'quillbooking')}
							<span className="text-[#E53E3E]">*</span>
						</div>
					}
				>
					<Select
						options={CACHE_TIME_OPTIONS}
						className="w-full h-[48px] rounded-lg mb-2"
						value={cacheTime}
						onChange={handleCacheTimeChange}
					/>
					<div className="text-[#71717A] italic">
						{__(
							'Select how many minutes the Apple Calendar events API call will be cached...',
							'quillbooking'
						)}
					</div>
					{calendar?.id && (
						<NavLink
							to={`calendars/${calendar.id}&tab=integrations&subtab=apple`}
						>
							<span className="text-blue-500 hover:text-blue-600 transition-colors font-medium cursor-pointer">
								{__('Manage accounts', 'quillbooking')}
							</span>
						</NavLink>
					)}
					{!calendar?.id && (
						<span className="text-gray-400 cursor-not-allowed font-medium">
							{__('Manage accounts', 'quillbooking')}
						</span>
					)}
				</Form.Item>
			</Flex>
		</div>
	);
};

export default AppleFields;
