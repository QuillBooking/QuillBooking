import { __ } from '@wordpress/i18n';
import { Button, Flex, Form, Select, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AppleFields = ({ CACHE_TIME_OPTIONS, form, calendar }) => {
	const cacheTime = Form.useWatch('cache_time', form);
	const navigate = useNavigate();
	const location = useLocation();
	const [isNavigating, setIsNavigating] = useState(false);

	useEffect(() => {
		console.log('Apple cache_time:', cacheTime);
	}, [cacheTime]);

	const handleCacheTimeChange = (value) => {
		console.log('Apple selection changed to:', value);
		form.setFieldValue('cache_time', value);
	};

	const handleNavigateToIntegration = async () => {
		if (!calendar?.id) {
			message.error({
				content: __(
					'No calendar selected. Please select a calendar first.',
					'quillbooking'
				),
				key: 'navigate',
			});
			return;
		}

		try {
			setIsNavigating(true);

			// Show loading message
			message.loading({
				content: __(
					'Preparing to navigate to integration...',
					'quillbooking'
				),
				key: 'navigate',
				duration: 0,
			});

			// Small delay to show loading state and ensure smooth transition
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Use React Router's navigate function to navigate to the integration
			// Navigate to the full path
			const path = `calendars/${calendar.id}`;
			navigate(
				`/wordpress/wp-admin/admin.php?page=quillbooking&path=${encodeURIComponent(path)}&tab=integrations&subtab=apple`
			);

			// Show success message briefly
			message.success({
				content: __(
					'Navigating to integration settings...',
					'quillbooking'
				),
				key: 'navigate',
				duration: 1,
			});
		} catch (error) {
			console.error('Navigation error:', error);
			message.error({
				content: __(
					'Failed to navigate to integration settings. Please try again.',
					'quillbooking'
				),
				key: 'navigate',
				duration: 3,
			});
		} finally {
			setIsNavigating(false);
		}
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
					<Button
						type="link"
						onClick={handleNavigateToIntegration}
						loading={isNavigating}
						className="flex items-center gap-2 hover:text-blue-600 transition-colors"
						disabled={!calendar?.id}
					>
						{__('Manage accounts', 'quillbooking')}
					</Button>
				</Form.Item>
			</Flex>
		</div>
	);
};

export default AppleFields;
