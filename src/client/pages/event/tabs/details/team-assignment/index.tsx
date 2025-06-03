import { __ } from '@wordpress/i18n';
import React, { useEffect, useState } from 'react';
import { Flex, Card, Select } from 'antd';
import { CardHeader, EventInfoIcon, TrashIcon } from '@quillbooking/components';
import { Host } from '@quillbooking/client';
import { useApi } from '@quillbooking/hooks';

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
	const { callApi } = useApi();
	const [calendarTeamMembers, setCalendarTeamMembers] = useState<Host[]>([]);
	const [eventTeamMember, setEventTeamMember] = useState<Host[]>([]);

	const fetchCalendarTeam = () => {
		callApi({
			path: 'calendars/' + calendarId + '/team',
			method: 'GET',
			onSuccess: (response: any[]) => {
				console.log('Fetched team members:', response);
				const transformedHosts: Host[] = response.map((member) => ({
					id: member.ID,
					name: member.display_name,
					image: member.image,
				}));
				setCalendarTeamMembers(transformedHosts);
			},
		});
	};

	const handleRemoveMember = (memberId: number) => {
		if (eventTeamMember.length <= 1) {
			return; // Prevent removing the last member
		}

		const updatedTeamMembers = eventTeamMember.filter(
			(member) => member.id !== memberId
		);
		setEventTeamMember(updatedTeamMembers);
		console.log(
			'Updated team members after removal:',
			updatedTeamMembers.map((member) => member.id)
		);
		onChange(
			'hosts',
			updatedTeamMembers.map((member) => member.id)
		);
	};

	const handleAddMember = (memberId: number) => {
		const memberAlreadyExists = eventTeamMember.some(
			(member) => member.id === memberId
		);

		// If member already exists, don't add them again
		if (memberAlreadyExists) {
			return;
		}
		const selectedMember = calendarTeamMembers.find(
			(member) => member.id === memberId
		);

		if (selectedMember) {
			const updatedTeamMembers = [...eventTeamMember, selectedMember];
			console.log(
				'Updated team members after removal:',
				updatedTeamMembers.map((member) => member.id)
			);
			setEventTeamMember(updatedTeamMembers);
			onChange(
				'hosts',
				updatedTeamMembers.map((member) => member.id)
			);
		}
	};

	useEffect(() => {
		fetchCalendarTeam();
		setEventTeamMember(team);
	}, []);

	return (
		<Card className="rounded-lg">
			<CardHeader
				title={__('Assignment', 'quillbooking')}
				description={__(
					'Set your Members and Event Host.',
					'quillbooking'
				)}
				icon={<EventInfoIcon />}
			/>

			<Select
				mode="multiple"
				placeholder="Select team members"
				value={eventTeamMember.map((host) => host.id)}
				onChange={(selectedIds) => {
					// Get current member IDs
					const currentIds = eventTeamMember.map(
						(member) => member.id
					);

					// Check for removed members
					if (selectedIds.length < currentIds.length) {
						const removedId = currentIds.find(
							(id) => !selectedIds.includes(id)
						);
						if (removedId !== undefined) {
							handleRemoveMember(removedId);
						}
					}
					// Check for added members
					else if (selectedIds.length > currentIds.length) {
						const addedId = selectedIds.find(
							(id) => !currentIds.includes(id)
						);
						if (addedId !== undefined) {
							handleAddMember(Number(addedId));
						}
					}
				}}
				options={calendarTeamMembers.map((member) => ({
					label: member.name,
					value: member.id,
				}))}
				style={{ width: '100%' }}
				getPopupContainer={(trigger) => trigger.parentElement}
			/>
			{eventTeamMember.length > 0 && (
				<Flex vertical gap={5} className="mt-4">
					<span className="text-sm text-gray-500">
						{__('Team Members:', 'quillbooking')}
					</span>

					{eventTeamMember.map((member) => (
						<Flex key={member.id} align="center" gap={8}>
							<div className="flex gap-2 px-3 py-2 items-center rounded-lg border border-[#EDEBEB] w-full">
								<img
									src={member.image}
									alt={member.name}
									className="w-8 h-8 rounded-full"
									style={{ objectFit: 'cover' }}
								/>
								<span className="text-sm">{member.name}</span>
							</div>
							{eventTeamMember.length > 1 && (
								<div
									className="text-[#B3261E] cursor-pointer"
									onClick={() =>
										handleRemoveMember(member.id)
									}
								>
									<TrashIcon width={20} height={22} />
								</div>
							)}
						</Flex>
					))}
				</Flex>
			)}
		</Card>
	);
};

export default TeamAssignment;
