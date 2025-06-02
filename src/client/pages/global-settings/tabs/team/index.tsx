import { ProTab, TeamMembersIcon } from '@quillbooking/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const TeamTab: React.FC = () => {
	return (
		<div className="w-full">
			{
				applyFilters(
					'quillbooking.global_settings.team_tab',
					<ProTab
						title={__('Team', 'quillbooking')}
						description={__(
							'Grant Team Members Access to FluentBookings for Calendar and Booking Management.',
							'quillbooking'
						)}
						icon={<TeamMembersIcon />}
					/>
				) as React.ReactNode
			}
		</div>
	);
};

export default TeamTab;
