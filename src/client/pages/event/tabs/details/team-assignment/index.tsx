import { __ } from '@wordpress/i18n';
import React from 'react';
import { EventInfoIcon, ProTab } from '@quillbooking/components';
import { Host } from '@quillbooking/types';
import { applyFilters } from '@wordpress/hooks';

interface TeamAssignmentProps {
	team: Host[];
	calendarId: number;
	onChange: (key: string, value: any) => void;
}

const TeamAssignment: React.FC<TeamAssignmentProps> = ({
	team,
	calendarId,
	onChange,
}) => {
	return applyFilters(
		'quillbooking.event.team-assignment',
		<ProTab
			title={__('Assignment', 'quillbooking')}
			description={__('Set your Members and Event Host.', 'quillbooking')}
			icon={<EventInfoIcon />}
		/>,
		{ team, calendarId, onChange }
	) as React.ReactNode;
};

export default TeamAssignment;
