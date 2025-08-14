import React from 'react';
import { __ } from '@wordpress/i18n';
import { Flex, Checkbox, Button } from 'antd';
import type { ExtendedLocation, IntegrationType } from '../types';
import { IntegrationHelper } from '../helpers';
import { INTEGRATION_ICONS, INTEGRATION_NAMES } from '../constants';
import { EditIcon } from '@quillbooking/components';
import { Calendar } from '../../../types';

interface ConferencingSectionProps {
	locations: ExtendedLocation[];
	integrationHelper: IntegrationHelper;
	onCheckboxChange: (type: string, checked: boolean) => Promise<void>;
	onNavigateToIntegrations: (
		integrationType: string,
		hasSettings?: boolean,
		hasAccounts?: boolean
	) => Promise<void>;
	calendar: Calendar;
	messageClassName?: string;
	messageColor?: string;
}

const ConferencingSection: React.FC<ConferencingSectionProps> = ({
	locations,
	integrationHelper,
	onCheckboxChange,
	onNavigateToIntegrations,
	calendar,
	messageClassName = 'text-[#9197A4] text-[12px] italic',
	messageColor,
}) => {
	const isIntegrationDisabled = (type: IntegrationType): boolean => {
		// If integration is already selected, allow unchecking
		if (locations.some((loc) => loc.type === type)) {
			return false;
		}

		if (!integrationHelper.hasProVersion(type)) {
			return true;
		}

		if (
			integrationHelper.isCalendarTypeTeam(calendar) &&
			!integrationHelper.hasTeamMembersIntegrationSetup(type)
		) {
			return true;
		}

		if (integrationHelper.hasGetStarted(type)) {
			return false;
		}

		if (type === 'ms-teams') {
			return (
				!integrationHelper.hasSettings(type) ||
				!integrationHelper.hasAccounts(type) ||
				!integrationHelper.isTeamsEnabled()
			);
		}

		if (type === 'google-meet') {
			return (
				!integrationHelper.hasSettings(type) ||
				!integrationHelper.hasAccounts(type)
			);
		}

		if (type === 'zoom') {
			return (
				!integrationHelper.hasSettings(type) &&
				!integrationHelper.hasAccounts(type)
			);
		}

		return false;
	};

	const getIntegrationStatusMessage = (
		type: IntegrationType,
		calendar: Calendar
	): { message: string; className?: string; color?: string } => {
		if (!integrationHelper.hasProVersion(type)) {
			return {
				message: __(
					`Upgrade to Pro to access ${INTEGRATION_NAMES[type]} integration.`,
					'quillbooking'
				),
				className: 'text-orange-500 text-[12px] italic',
			};
		}

		if (
			integrationHelper.isCalendarTypeTeam(calendar) &&
			!integrationHelper.hasTeamMembersIntegrationSetup(type) &&
			type === 'zoom'
		) {
			return {
				message: __(
					`Looks like your remote connection for this location is disabled. must the main host set the remote connection first.`,
					'quillbooking'
				),
				className: 'text-red-500 text-[12px] italic',
			};
		}

		if (
			integrationHelper.isCalendarTypeTeam(calendar) &&
			!integrationHelper.hasTeamMembersIntegrationSetup(type)
		) {
			return {
				message: __(
					`Looks like your remote connection for this location is disabled. All hosts need to set ${INTEGRATION_NAMES[type]} event creation first.`,
					'quillbooking'
				),
				className: 'text-red-500 text-[12px] italic',
			};
		}

		if (type === 'google-meet' && !integrationHelper.hasSettings(type)) {
			return {
				message: __(
					'Add Global Settings to use Google Meet integration.',
					'quillbooking'
				),
				className: 'text-blue-500 text-[12px] italic',
			};
		}

		if (type === 'ms-teams') {
			if (!integrationHelper.hasSettings(type)) {
				return {
					message: __(
						'Add Global Settings to use Outlook integration.',
						'quillbooking'
					),
					className: 'text-blue-500 text-[12px] italic',
				};
			}
			if (!integrationHelper.hasAccounts(type)) {
				return {
					message: __(
						'Add an account to use Outlook integration.',
						'quillbooking'
					),
					className: 'text-blue-500 text-[12px] italic',
				};
			}
			if (!integrationHelper.isTeamsEnabled()) {
				return {
					message: __(
						'Teams is not enabled for your default account. Please enable it in the Outlook integration settings.',
						'quillbooking'
					),
					className: 'text-yellow-500 text-[12px] italic',
				};
			}
		}

		if (
			type === 'zoom' &&
			integrationHelper.hasSettings(type) &&
			!integrationHelper.hasAccounts(type)
		) {
			return {
				message: __(
					'You are connected now by global settings.',
					'quillbooking'
				),
				className: 'text-green-500 text-[12px] italic',
			};
		}

		if (type === 'zoom' && integrationHelper.hasAccounts(type)) {
			return {
				message: __(
					'You are connected now by your account.',
					'quillbooking'
				),
				className: 'text-green-500 text-[12px] italic',
			};
		}

		if (!integrationHelper.hasAccounts(type)) {
			return {
				message: __(
					`Add an account to use ${INTEGRATION_NAMES[type]} integration.`,
					'quillbooking'
				),
				className: 'text-blue-500 text-[12px] italic',
			};
		}

		if (integrationHelper.hasAccounts(type)) {
			return {
				message: __(
					`You are connected now by your account.`,
					'quillbooking'
				),
				className: 'text-green-500 text-[12px] italic',
			};
		}

		return { message: '' };
	};

	const renderIntegrationButton = (type: IntegrationType) => {
		if (!integrationHelper.hasProVersion(type)) {
			return (
				<Button
					onClick={() => onNavigateToIntegrations(type, false, false)}
					className="bg-transparent shadow-none border border-color-primary text-color-primary"
				>
					{__('Upgrade to Pro', 'quillbooking')}
				</Button>
			);
		}

		if (integrationHelper.isCalendarTypeTeam(calendar)) {
			return <></>;
		}

		if (!integrationHelper.hasSettings(type) && type !== 'zoom') {
			return (
				<Button
					onClick={() => onNavigateToIntegrations(type, true, false)}
					className="bg-transparent shadow-none border border-color-primary text-color-primary"
				>
					{__('Connect', 'quillbooking')}
				</Button>
			);
		}

		if (!integrationHelper.hasAccounts(type)) {
			return (
				<Button
					onClick={() => onNavigateToIntegrations(type, true, false)}
					className="bg-transparent shadow-none border border-color-primary text-color-primary"
				>
					{__('Add Account', 'quillbooking')}
				</Button>
			);
		}

		return (
			<Button
				onClick={() => onNavigateToIntegrations(type, true, true)}
				className="bg-transparent border-none text-[#3F4254] shadow-none p-0"
			>
				<EditIcon />
				{__('Manage Accounts', 'quillbooking')}
			</Button>
		);
	};

	const renderIntegrationCheckbox = (type: IntegrationType) => (
		<Checkbox
			key={type}
			className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
				locations.some((loc) => loc.type === type)
					? 'border-color-primary bg-color-secondary'
					: 'border-[#D3D4D6] bg-white'
			}`}
			checked={locations.some((loc) => loc.type === type)}
			onChange={(e) => onCheckboxChange(type, e.target.checked)}
			disabled={isIntegrationDisabled(type)}
		>
			<Flex justify="space-between" align="center" className="w-full">
				<Flex gap={12} className="items-center ml-2">
					<img
						src={INTEGRATION_ICONS[type]}
						alt={`${type}.png`}
						className="size-7"
					/>
					<Flex vertical>
						<div className="text-[#3F4254] text-[16px] font-semibold">
							{__(INTEGRATION_NAMES[type], 'quillbooking')}
						</div>
						<div
							className={
								getIntegrationStatusMessage(type, calendar)
									.className || messageClassName
							}
							style={
								messageColor
									? { color: messageColor }
									: getIntegrationStatusMessage(
												type,
												calendar
										  ).color
										? {
												color: getIntegrationStatusMessage(
													type,
													calendar
												).color,
											}
										: undefined
							}
						>
							{
								getIntegrationStatusMessage(type, calendar)
									.message
							}
						</div>
					</Flex>
				</Flex>
				{renderIntegrationButton(type)}
			</Flex>
		</Checkbox>
	);

	return (
		<Flex vertical gap={10} className="justify-start items-start">
			<div className="text-[#09090B] text-[16px]">
				{__('Conferencing', 'quillbooking')}
			</div>
			{renderIntegrationCheckbox('google-meet')}
			{renderIntegrationCheckbox('zoom')}
			{renderIntegrationCheckbox('ms-teams')}
		</Flex>
	);
};

export default ConferencingSection;
