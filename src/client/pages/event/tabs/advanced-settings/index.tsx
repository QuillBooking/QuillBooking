import { AdvancedSettingsIcon, ProTab } from '@quillbooking/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const AdvancedSettings: React.FC = () => {
	return applyFilters(
		'quillbooking.event.advaned_settings_tab',
		<ProTab
			title={__('Advanced Settings', 'quillbooking')}
			description={__(
				'Customize the question asked on the booking page',
				'quillbooking'
			)}
			icon={<AdvancedSettingsIcon />}
		/>
	) as React.ReactNode;
};

export default AdvancedSettings;
