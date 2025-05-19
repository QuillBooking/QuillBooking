import { __ } from '@wordpress/i18n';
import { Flex, Form, Select } from 'antd';
import { useEffect } from 'react';

const OutlookFields = ({ CACHE_TIME_OPTIONS, form }) => {
	const cacheTime = Form.useWatch('cache_time', form);
	
	useEffect(() => {
		console.log('Outlook cache_time:', cacheTime);
	}, [cacheTime]);
	
	const handleCacheTimeChange = (value) => {
		console.log('Outlook selection changed to:', value);
		form.setFieldValue('cache_time', value);
	};
	
	return (
		<div className="outlook-fields">
			<Flex vertical gap={10} className="w-full">
				<div className="text-[#71717A] italic">
					{__(
						'Your outlook API configuration is already. You can connect your outlook calendar from your host settings.',
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
							'Select how many minutes the Outlook Calendar / MS Teams events API call will be cached...',
							'quillbooking'
						)}
					</div>
				</Form.Item>
			</Flex>
		</div>
	);
};

export default OutlookFields;
