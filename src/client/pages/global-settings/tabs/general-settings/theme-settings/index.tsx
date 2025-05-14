/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Radio } from 'antd';

/**
 * Internal dependencies
 */
import { CardHeader, ThemeIcon } from '@quillbooking/components';

const ThemeSettings = ({ settings, updateSettings }) => {
	return (
		<Card>
			<CardHeader
				title={__('Theme', 'quillbooking')}
				description={__(
					'This only applies to your public landing pages.',
					'quillbooking'
				)}
				icon={<ThemeIcon />}
			/>

			<Flex className="mt-4">
				<Radio.Group
					value={settings.color_scheme}
					onChange={(e) =>
						updateSettings('color_scheme', e.target.value)
					}
					className="flex w-full justify-between"
				>
					<Radio
						value="system"
						className="custom-radio font-semibold cursor-pointer text-[#3F4254]"
					>
						{__('System default', 'quillbooking')}
					</Radio>
					<Radio
						value="light"
						className="custom-radio font-semibold cursor-pointer text-[#3F4254]"
					>
						{__('Light Mode', 'quillbooking')}
					</Radio>
					<Radio
						value="dark"
						className="custom-radio font-semibold cursor-pointer text-[#3F4254]"
					>
						{__('Dark Mode', 'quillbooking')}
					</Radio>
				</Radio.Group>
			</Flex>
		</Card>
	);
};

export default ThemeSettings;
