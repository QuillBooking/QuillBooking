/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

/**
 * External dependencies
 */
import { Card, Checkbox, Flex, Input } from 'antd';

/**
 * Internal dependencies
 */
import {
	CardHeader,
	Editor,
	GeneralSettingsEmailingIcon,
} from '@quillbooking/components';

const EmailingSettings = ({ settings, updateSettings }) => {
	// Create a local state to manage the footer content properly
	const [footerContent, setFooterContent] = useState(settings?.footer || '');

	// Update local state when settings change from external source
	useEffect(() => {
		if (settings?.footer !== undefined) {
			setFooterContent(settings.footer);
		}
	}, [settings?.footer]);

	// Handle footer content change
	const handleFooterChange = (value) => {
		setFooterContent(value);
		updateSettings('footer', value);
	};

	return (
		<Card>
			<CardHeader
				title={__('Email Settings', 'quillbooking')}
				description={__(
					'Configure your email settings for booking related emails',
					'quillbooking'
				)}
				icon={<GeneralSettingsEmailingIcon />}
			/>

			<Flex vertical gap={25} className="mt-4">
				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px] flex gap-1 items-center">
						{__('From Name', 'quillbooking')}
						<span className="text-[#818181] text-[12px] font-normal">
							{__(
								'Default Name that will be used to send email',
								'quillbooking'
							)}
						</span>
					</div>
					<Input
						id="from_name"
						className="w-full rounded-lg h-[48px]"
						placeholder={__('From Name for Emails', 'quillbooking')}
						value={settings.from_name || ''}
						onChange={(e) => {
							const value = e.target.value;
							if (/^[a-zA-Z\s]*$/.test(value)) {
								updateSettings('from_name', value);
							}
						}}
					/>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px] flex gap-1 items-center">
						{__('From Email', 'quillbooking')}
						<span className="text-[#818181] text-[12px] font-normal">
							{__(
								'Provide Valid Email Address that will be used to send emails',
								'quillbooking'
							)}
						</span>
					</div>
					<Input
						id="from_email"
						type="email"
						className="w-full rounded-lg h-[48px]"
						placeholder={__('name@domain.com', 'quillbooking')}
						value={settings.from_email || ''}
						onChange={(e) =>
							updateSettings('from_email', e.target.value)
						}
					/>
					<div className="text-[#818181]">
						{__(
							'Email as per your domain/SMTP settings.',
							'quillbooking'
						)}
					</div>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px] flex gap-1 items-center">
						{__('Reply To Name', 'quillbooking')}
						<span className="text-[#818181] text-[12px] font-normal">
							{__(
								'Default Reply to Name (Optional)',
								'quillbooking'
							)}
						</span>
					</div>
					<Input
						id="reply_to_name"
						className="w-full rounded-lg h-[48px]"
						placeholder={__('Reply To Name', 'quillbooking')}
						value={settings.reply_to_name || ''}
						onChange={(e) => {
							const value = e.target.value;
							if (/^[a-zA-Z\s]*$/.test(value)) {
								updateSettings('reply_to_name', value);
							}
						}}
					/>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px] flex gap-1 items-center">
						{__('Reply To Email', 'quillbooking')}
						<span className="text-[#818181] text-[12px] font-normal">
							{__(
								'Default Reply to Name (Optional)',
								'quillbooking'
							)}
						</span>
					</div>
					<Input
						id="reply_to_email"
						type="email"
						className="w-full rounded-lg h-[48px]"
						placeholder={__('name@domain.com', 'quillbooking')}
						value={settings.reply_to_email || ''}
						onChange={(e) =>
							updateSettings('reply_to_email', e.target.value)
						}
					/>
				</Flex>

				<Flex vertical gap={4}>
					<Checkbox
						className="custom-check text-[#3F4254] font-semibold"
						checked={settings.use_host_from_name || false}
						onChange={(e) =>
							updateSettings(
								'use_host_from_name',
								e.target.checked
							)
						}
					>
						{__(
							'Use Host Name as From Name for Booking Emails to Guests',
							'quillbooking'
						)}
					</Checkbox>
					<Checkbox
						className="custom-check text-[#3F4254] font-semibold"
						checked={settings.use_host_reply_to_email || false}
						onChange={(e) =>
							updateSettings(
								'use_host_reply_to_email',
								e.target.checked
							)
						}
					>
						{__(
							'Use Host Email For Replay-to Value For Booking Emails to Guests',
							'quillbooking'
						)}
					</Checkbox>
					<Checkbox
						className="custom-check text-[#3F4254] font-semibold"
						checked={settings.include_ics || false}
						onChange={(e) =>
							updateSettings('include_ics', e.target.checked)
						}
					>
						{__(
							'Include ICS File attachment in Booking Confirmation Emails',
							'quillbooking'
						)}
					</Checkbox>
				</Flex>

				<Flex vertical gap={4}>
					<div className="text-[#3F4254] font-semibold text-[16px] flex gap-1 items-center">
						{__(
							'Email Footer for Booking related emails',
							'quillbooking'
						)}
						<span className="text-[#818181] text-[12px] font-normal">
							{__('(Optional)', 'quillbooking')}
						</span>
					</div>
					<Editor
						message={footerContent}
						onChange={handleFooterChange}
						type="email"
						key={`footer-editor-${footerContent ? 'has-content' : 'empty'}`}
					/>
					<div className="text-[#3F4254]">
						{__(
							'You may include your business name, address etc here, for example:',
							'quillbooking'
						)}
						{__(
							'You have received this email because signed up for an event or made a booking on our website.',
							'quillbooking'
						)}
					</div>
				</Flex>
			</Flex>
		</Card>
	);
};

export default EmailingSettings;
