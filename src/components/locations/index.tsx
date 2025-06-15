/**
 * Wordpress dependencies
 */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { Flex, Button, Input, Modal, Form, Checkbox, message } from 'antd';
import { map, isEmpty, get, uniqueId } from 'lodash';
import { FaPlus } from 'react-icons/fa';
/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import { ACTIVE_PRO_URL } from '../../constants';
import type { LocationField } from '@quillbooking/config';
import type {
	ConnectedIntegrationsFields,
	ConnectedIntegrationsFieldsMicrosoft,
	Location,
} from '@quillbooking/client';
import { EditIcon, TrashIcon } from '@quillbooking/components';

import './style.scss';
import meet from '@quillbooking/assets/icons/google/google_meet.png';
import zoom from '@quillbooking/assets/icons/zoom/zoom_video.png';
import teams from '@quillbooking/assets/icons/teams/teams.png';
import TextArea from 'antd/es/input/TextArea';
import { useNavigate } from '@quillbooking/hooks';

// Extended Location type to include custom ID for multiple custom locations
interface ExtendedLocation extends Location {
	id?: string;
}

const Locations: React.FC<{
	locations: ExtendedLocation[];
	onChange: (locations: ExtendedLocation[]) => void;
	onKeepDialogOpen?: () => void;
	connected_integrations: {
		apple: ConnectedIntegrationsFields;
		google: ConnectedIntegrationsFields;
		outlook: ConnectedIntegrationsFieldsMicrosoft;
		twilio: ConnectedIntegrationsFields;
		zoom: ConnectedIntegrationsFields;
	};
	calendar?: any;
	handleSubmit?: (redirect: boolean) => Promise<any>;
}> = ({
	locations,
	onChange,
	onKeepDialogOpen,
	connected_integrations,
	calendar,
	handleSubmit = async (redirect: boolean) => {},
}) => {
	const navigate = useNavigate();
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLocationIndex, setEditingLocationIndex] = useState<
		number | null
	>(null);
	const [newLocationType, setNewLocationType] = useState<string | null>(null);
	const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
	const [customLocations, setCustomLocations] = useState<
		{ id: string; fields?: Record<string, any>; visible: boolean }[]
	>(
		locations
			.filter((loc) => loc.type === 'custom')
			.map((loc) => ({
				id: loc.id || uniqueId('custom-'),
				fields: loc.fields,
				visible: true,
			}))
	);
	const [cachedLocationData, setCachedLocationData] = useState<
		Record<string, any>
	>({});
	const [form] = Form.useForm();
	const locationTypes = ConfigAPI.getLocations();
	const [messageApi, contextHolder] = message.useMessage();

	// Check if an integration is connected
	const isIntegrationConnected = (type: string): boolean => {
		switch (type) {
			case 'google-meet':
				return connected_integrations.google.connected;
			case 'zoom':
				return connected_integrations.zoom.connected;
			case 'ms-teams':
				return connected_integrations.outlook.connected;
			default:
				return true; // For non-integration locations
		}
	};

	const isIntegrationGolbalConnected = (type: string): boolean => {
		switch (type) {
			case 'google-meet':
				return connected_integrations.google.has_settings;
			case 'zoom':
				return connected_integrations.zoom.has_settings;
			case 'ms-teams':
				return connected_integrations.outlook.has_settings;
			default:
				return true; // For non-integration locations
		}
	};

	const hasGetStarted = (type: string): boolean => {
		switch (type) {
			case 'google-meet':
				return connected_integrations.google.has_get_started;
			case 'zoom':
				return connected_integrations.zoom.has_get_started;
			case 'ms-teams':
				return connected_integrations.outlook.has_get_started;
			default:
				return false;
		}
	};

	const hasProVersion = (type: string): boolean => {
		switch (type) {
			case 'google-meet':
				return connected_integrations.google.has_pro_version;
			case 'zoom':
				return connected_integrations.zoom.has_pro_version;
			case 'ms-teams':
				return connected_integrations.outlook.has_pro_version;
			default:
				return false;
		}
	};

	const convertToSlug = (type: string) => {
		switch (type) {
			case 'google-meet':
				return 'google';
			case 'zoom':
				return 'zoom';
			case 'ms-teams':
				return 'outlook';
			default:
				return type;
		}
	};

	// Handle regular location type changes
	const handleLocationTypeChange = (index: number, newType: string) => {
		const locationType = get(locationTypes, newType);

		// If the new location type has no fields, update it directly
		if (isEmpty(locationType?.fields)) {
			const updatedLocations = [...locations];
			updatedLocations[index] = {
				type: newType,
				fields: {},
			};
			onChange(updatedLocations);
			return;
		}

		// Otherwise, open the modal to fill the fields
		setEditingLocationIndex(index);
		setNewLocationType(newType);
		setIsModalVisible(true);
	};

	// Navigate to integration settings page
	const navigateToIntegrations = async (
		integrationType: string,
		hasSettings = false,
		hasAccounts = false
	) => {
		if (!hasProVersion(integrationType)) {
			window.location.href = ACTIVE_PRO_URL;
			return;
		}

		if (hasProVersion(integrationType) && hasGetStarted(integrationType)) {
			// First add the location to the locations array
			const updatedLocations = [...locations];
			const existingIndex = updatedLocations.findIndex(
				(loc) => loc.type === integrationType
			);

			if (existingIndex === -1) {
				updatedLocations.push({
					type: integrationType,
					fields: {},
				});
				// Update the locations array and wait for it to complete
				await new Promise<void>((resolve) => {
					onChange(updatedLocations);
					resolve();
				});
			}

			// Then call handleSubmit to save the changes
			try {
				// Add a small delay to ensure the state update is complete
				await new Promise((resolve) => setTimeout(resolve, 100));
				const response = await handleSubmit(false); // Don't redirect yet, we'll handle navigation here

				// Check if we got a valid calendar response
				if (!response?.id) {
					messageApi.error(
						__('Failed to create calendar', 'quillbooking')
					);
					return;
				}

				const path = `calendars/${response.id}`;

				if (!hasSettings) {
					navigate(
						`integrations&tab=conferencing-calendars&subtab=${convertToSlug(integrationType)}`
					);
				} else if (!hasAccounts) {
					navigate(
						`${encodeURIComponent(path)}&tab=integrations&subtab=${convertToSlug(integrationType)}`
					);
				} else {
					navigate(
						`${encodeURIComponent(path)}&tab=integrations&subtab=${convertToSlug(integrationType)}`
					);
				}
			} catch (error) {
				console.error('Error saving calendar:', error);
				messageApi.error(__('Failed to save calendar', 'quillbooking'));
			}
			return;
		}

		// Only navigate if we have a calendar ID
		if (!calendar?.id) {
			messageApi.error(__('Calendar not found', 'quillbooking'));
			return;
		}

		const path = `calendars/${calendar.id}`;

		if (!hasSettings) {
			navigate(
				`integrations&tab=conferencing-calendars&subtab=${convertToSlug(integrationType)}`
			);
		} else if (!hasAccounts) {
			navigate(
				`${encodeURIComponent(path)}&tab=integrations&subtab=${convertToSlug(integrationType)}`
			);
		} else {
			navigate(
				`${encodeURIComponent(path)}&tab=integrations&subtab=${convertToSlug(integrationType)}`
			);
		}
	};

	// Modified handleCheckboxChange to check has_pro_version first
	const handleCheckboxChange = async (type: string, checked: boolean) => {
		// First priority: Check if user has Pro version for this integration
		if (
			checked &&
			!hasProVersion(type) &&
			!isIntegrationConnected(type) &&
			!hasGetStarted(type) &&
			!isIntegrationGolbalConnected(type)
		) {
			// If trying to check but integration isn't connected and no Pro version, show error message
			switch (type) {
				case 'google-meet':
					messageApi.error({
						content: __(
							'Google Meet is not connected. Please connect it first.',
							'quillbooking'
						),
						duration: 5,
					});
					return;
				case 'zoom':
					messageApi.error({
						content: __(
							'Zoom is not connected. Please connect it first.',
							'quillbooking'
						),
						duration: 5,
					});
					return;
				case 'ms-teams':
					// Check if Teams is enabled for the default account
					if (!connected_integrations.outlook.teams_enabled) {
						messageApi.error({
							content: __(
								'Microsoft Teams is not enabled for your default account. Please enable it in the Outlook integration settings.',
								'quillbooking'
							),
							duration: 5,
						});
					} else {
						messageApi.error({
							content: __(
								'Microsoft Teams is not connected. Please connect it first.',
								'quillbooking'
							),
							duration: 5,
						});
					}
					return;
			}
		}

		// If not custom and integration is connected (or not required), handle regular location toggle
		const existingIndex = locations.findIndex((loc) => loc.type === type);

		if (checked) {
			// If the location was previously saved, restore its data
			const savedFields = cachedLocationData[type] || {};

			if (existingIndex !== -1) {
				const updatedLocations = [...locations];
				updatedLocations[existingIndex] = {
					type,
					fields:
						Object.keys(savedFields).length > 0 ? savedFields : {},
				};
				onChange(updatedLocations);
			} else {
				const updatedLocations = [...locations];
				updatedLocations.push({
					type,
					fields:
						Object.keys(savedFields).length > 0 ? savedFields : {},
				});
				onChange(updatedLocations);

				// If there are saved fields but the location needs configuration, open modal
				if (
					Object.keys(savedFields).length === 0 &&
					!isEmpty(get(locationTypes, `${type}.fields`))
				) {
					handleLocationTypeChange(updatedLocations.length - 1, type);
				}
			}
		} else {
			// When unchecking, save the current location data before removing
			const locationToRemove = locations.find((loc) => loc.type === type);
			if (locationToRemove && locationToRemove.fields) {
				setCachedLocationData((prev) => ({
					...prev,
					[type]: locationToRemove.fields,
				}));
			}

			const updatedLocations = locations.filter(
				(loc) => loc.type !== type
			);
			onChange(updatedLocations);
		}
	};

	// Handle modal submission
	const handleModalOk = async () => {
		try {
			const values = await form.validateFields();

			// Update location based on type
			if (newLocationType === 'custom' && editingCustomId) {
				// Handle custom location update
				const updatedLocations = [...locations];
				const locationIndex = updatedLocations.findIndex(
					(loc) => loc.type === 'custom' && loc.id === editingCustomId
				);

				if (locationIndex !== -1) {
					// Update existing custom location
					updatedLocations[locationIndex] = {
						type: 'custom',
						id: editingCustomId,
						fields: values,
					};
				} else {
					// Add new custom location with the generated ID
					updatedLocations.push({
						type: 'custom',
						id: editingCustomId,
						fields: values,
					});

					// Only now add to customLocations array since form submission was successful
					setCustomLocations((prev) => [
						...prev,
						{ id: editingCustomId, fields: values, visible: true },
					]);
				}

				// Update existing custom location if applicable
				if (locationIndex === -1) {
					// New location was added, no need to update customLocations here
				} else {
					// Update existing location in customLocations
					const updatedCustomLocations = [...customLocations];
					const customIndex = updatedCustomLocations.findIndex(
						(custom) => custom.id === editingCustomId
					);

					if (customIndex !== -1) {
						updatedCustomLocations[customIndex].fields = values;
						setCustomLocations(updatedCustomLocations);
					}
				}

				onChange(updatedLocations);
			} else {
				// Handle regular location update (unchanged)
				const updatedLocations = [...locations];
				if (editingLocationIndex !== null) {
					updatedLocations[editingLocationIndex] = {
						type: newLocationType!,
						fields: values,
					};

					// Cache the location data when saving
					setCachedLocationData((prev) => ({
						...prev,
						[newLocationType!]: values,
					}));

					onChange(updatedLocations);
				}
			}

			setIsModalVisible(false);
			setEditingLocationIndex(null);
			setNewLocationType(null);
			setEditingCustomId(null);
			form.resetFields();
		} catch (error) {
			console.error('Validation failed:', error);
		}
	};

	// Handle modal cancellation
	const handleModalCancel = () => {
		// Clean up regular locations if needed
		if (editingLocationIndex !== null && newLocationType !== 'custom') {
			const currentLocation = locations[editingLocationIndex];
			// Only remove if it's a new location with no fields
			if (
				!currentLocation?.fields ||
				Object.keys(currentLocation.fields).length === 0
			) {
				const updatedLocations = locations.filter(
					(_, i) => i !== editingLocationIndex
				);
				onChange(updatedLocations);
			}
		}

		// Clean up empty custom location
		if (newLocationType === 'custom' && editingCustomId) {
			// If this is a new custom location being created (not yet in locations array)
			const existingCustomLoc = locations.find(
				(loc) => loc.type === 'custom' && loc.id === editingCustomId
			);

			if (!existingCustomLoc) {
				// Remove from customLocations state
				setCustomLocations((prev) =>
					prev.filter((custom) => custom.id !== editingCustomId)
				);
			}
		}

		setIsModalVisible(false);
		setEditingLocationIndex(null);
		setNewLocationType(null);
		setEditingCustomId(null);
		form.resetFields();

		if (typeof onKeepDialogOpen === 'function') {
			onKeepDialogOpen();
		}
	};

	// Edit location handler
	const handleEditLocation = (type: string, customId?: string) => {
		if (type === 'custom' && customId) {
			// Edit custom location
			const customLocation = locations.find(
				(loc) => loc.type === type && loc.id === customId
			);
			if (customLocation?.fields) {
				setNewLocationType(type);
				setEditingCustomId(customId);
				form.setFieldsValue(customLocation.fields);
				setIsModalVisible(true);
			}
		} else {
			// Edit standard location
			const index = locations.findIndex((loc) => loc.type === type);
			if (index !== -1) {
				setEditingLocationIndex(index);
				setNewLocationType(type);
				form.setFieldsValue(locations[index].fields);
				setIsModalVisible(true);
			}
		}
	};

	// Toggle custom location checkbox
	const handleCustomCheckboxChange = (customId: string, checked: boolean) => {
		// Update the customLocations visibility state
		setCustomLocations((prev) =>
			prev.map((custom) =>
				custom.id === customId
					? { ...custom, visible: checked }
					: custom
			)
		);

		if (checked) {
			// Get the custom location data
			const customLocation = customLocations.find(
				(custom) => custom.id === customId
			);

			// Add to locations array if not already there
			if (customLocation) {
				const existingIndex = locations.findIndex(
					(loc) => loc.type === 'custom' && loc.id === customId
				);

				if (existingIndex === -1) {
					const updatedLocations = [...locations];
					updatedLocations.push({
						type: 'custom',
						id: customId,
						fields: customLocation.fields || {},
					});
					onChange(updatedLocations);

					// If fields need configuration, open the modal
					if (
						!customLocation.fields ||
						Object.keys(customLocation.fields).length === 0
					) {
						setNewLocationType('custom');
						setEditingCustomId(customId);
						setIsModalVisible(true);
					}
				}
			}
		} else {
			// Remove from locations array but keep in customLocations
			const updatedLocations = locations.filter(
				(loc) => !(loc.type === 'custom' && loc.id === customId)
			);
			onChange(updatedLocations);
		}
	};

	// Add custom location
	const addCustomLocation = () => {
		const newCustomId = uniqueId('custom-');

		// Open modal to edit the new custom location
		setNewLocationType('custom');
		setEditingCustomId(newCustomId);
		form.resetFields();
		setIsModalVisible(true);
	};

	// Remove custom location completely
	const removeCustomLocation = (customId: string) => {
		// Remove from customLocations state
		setCustomLocations((prev) =>
			prev.filter((custom) => custom.id !== customId)
		);

		// Remove from locations array
		const updatedLocations = locations.filter(
			(loc) => !(loc.type === 'custom' && loc.id === customId)
		);

		onChange(updatedLocations);
	};

	// Helper function to determine if Google Meet checkbox should be disabled
	const isGoogleMeetDisabled = (): boolean => {
		// If Google Meet is already selected, allow unchecking
		if (locations.some((loc) => loc.type === 'google-meet')) {
			return false;
		}

		if (!connected_integrations.google.has_pro_version) {
			return true;
		}
		if (connected_integrations.google.has_get_started) {
			return false;
		}
		if (
			!connected_integrations.google.has_settings ||
			!connected_integrations.google.has_accounts
		) {
			return true;
		}
		return false;
	};

	const isOutlookDisabled = (): boolean => {
		// If Google Meet is already selected, allow unchecking
		if (locations.some((loc) => loc.type === 'ms-teams')) {
			return false;
		}

		if (!connected_integrations.outlook.has_pro_version) {
			return true;
		}
		if (connected_integrations.outlook.has_get_started) {
			return false;
		}
		if (
			!connected_integrations.outlook.has_settings ||
			!connected_integrations.outlook.has_accounts
		) {
			return true;
		}
		if (!connected_integrations.outlook.teams_enabled) {
			return true;
		}
		return false;
	};

	const isZoomDisabled = (): boolean => {
		// If Zoom is already selected, allow unchecking
		if (locations.some((loc) => loc.type === 'zoom')) {
			return false;
		}

		if (!connected_integrations.zoom.has_pro_version) {
			return true;
		}
		if (connected_integrations.zoom.has_get_started) {
			return false;
		}
		if (
			!connected_integrations.zoom.has_settings &&
			!connected_integrations.zoom.has_accounts
		) {
			return true;
		}
		return false;
	};

	return (
		<>
			{contextHolder}
			<Flex vertical gap={15}>
				<Flex vertical gap={10} className="justify-start items-start">
					<div className="text-[#09090B] text-[16px]">
						{__('Conferencing', 'quillbooking')}
					</div>

					{/* google */}
					<Checkbox
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							locations.some((loc) => loc.type === 'google-meet')
								? 'border-color-primary bg-color-secondary' // Checked styles
								: 'border-[#D3D4D6] bg-white' // Default styles
						}`}
						checked={locations.some(
							(loc) => loc.type === 'google-meet'
						)}
						onChange={(e) =>
							handleCheckboxChange(
								'google-meet',
								e.target.checked
							)
						}
						disabled={isGoogleMeetDisabled()}
					>
						<Flex
							justify="space-between"
							align="center"
							className="w-full"
						>
							<Flex gap={12} className="items-center ml-2">
								<img
									src={meet}
									alt="google_meet.png"
									className="size-7"
								/>
								<Flex vertical>
									<div className="text-[#3F4254] text-[16px] font-semibold">
										{__('Google Meet', 'quillbooking')}
									</div>

									<div className="text-[#9197A4] text-[12px] italic">
										{(() => {
											let googleStatusMessage = '';

											if (
												!connected_integrations.google
													.has_pro_version
											) {
												googleStatusMessage = __(
													'Upgrade to Pro to access Google Meet integration.',
													'quillbooking'
												);
											} else if (
												!connected_integrations.google
													.has_settings
											) {
												googleStatusMessage = __(
													'Add Global Settings to use Google Meet integration.',
													'quillbooking'
												);
											} else if (
												!connected_integrations.google
													.has_accounts
											) {
												googleStatusMessage = __(
													'Add an account to use Google Meet integration.',
													'quillbooking'
												);
											}

											return googleStatusMessage;
										})()}
									</div>
								</Flex>
							</Flex>
							{(() => {
								// User doesn't have pro version or settings
								if (
									!connected_integrations.google
										.has_pro_version
								) {
									return (
										<Button
											onClick={async () => {
												await navigateToIntegrations(
													'google-meet',
													false,
													false
												);
											}}
											className="bg-transparent shadow-none border border-color-primary text-color-primary"
										>
											{__(
												'Upgrade to Pro',
												'quillbooking'
											)}
										</Button>
									);
								}

								// User has pro and settings but no accounts
								if (
									!connected_integrations.google.has_settings
								) {
									return (
										<Button
											onClick={async () => {
												await navigateToIntegrations(
													'google-meet',
													true,
													false
												);
											}}
											className="bg-transparent shadow-none border border-color-primary text-color-primary"
										>
											{__('Connect', 'quillbooking')}
										</Button>
									);
								}

								if (
									!connected_integrations.google.has_accounts
								) {
									return (
										<Button
											onClick={async () => {
												await navigateToIntegrations(
													'google-meet',
													true,
													false
												);
											}}
											className="bg-transparent shadow-none border border-color-primary text-color-primary"
										>
											{__('Add Account', 'quillbooking')}
										</Button>
									);
								}

								// User has everything configured - show manage accounts
								return (
									<Button
										onClick={async () => {
											await navigateToIntegrations(
												'google-meet',
												true,
												true
											);
										}}
										className="bg-transparent border-none text-[#3F4254] shadow-none p-0"
									>
										<EditIcon />
										{__('Manage Accounts', 'quillbooking')}
									</Button>
								);
							})()}
						</Flex>
					</Checkbox>

					{/* zoom */}
					<Checkbox
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							locations.some((loc) => loc.type === 'zoom')
								? 'border-color-primary bg-color-secondary'
								: 'border-[#D3D4D6] bg-white'
						}`}
						checked={locations.some((loc) => loc.type === 'zoom')}
						onChange={(e) =>
							handleCheckboxChange('zoom', e.target.checked)
						}
						disabled={isZoomDisabled()}
					>
						<Flex
							justify="space-between"
							align="center"
							className="w-full"
						>
							<Flex gap={12} className="items-center ml-2">
								<img
									src={zoom}
									alt="zoom.png"
									className="size-7"
								/>
								<Flex vertical>
									<div className="text-[#3F4254] text-[16px] font-semibold">
										{__('Zoom Video', 'quillbooking')}
									</div>

									<div className="text-[#9197A4] text-[12px] italic">
										{(() => {
											let zoomStatusMessage = '';

											if (
												!connected_integrations.zoom
													.has_pro_version
											) {
												zoomStatusMessage = __(
													'Upgrade to Pro to access Zoom Video integration.',
													'quillbooking'
												);
											} else if (
												!connected_integrations.zoom
													.has_accounts
											) {
												zoomStatusMessage = __(
													'Add an account to use Zoom Video integration.',
													'quillbooking'
												);
											}

											return zoomStatusMessage;
										})()}
									</div>
								</Flex>
							</Flex>
							{(() => {
								// User doesn't have pro version or settings
								if (
									!connected_integrations.zoom.has_pro_version
								) {
									return (
										<Button
											onClick={async () => {
												await navigateToIntegrations(
													'zoom',
													false,
													false
												);
											}}
											className="bg-transparent shadow-none border border-color-primary text-color-primary"
										>
											{__(
												'Upgrade to Pro',
												'quillbooking'
											)}
										</Button>
									);
								}

								if (!connected_integrations.zoom.has_accounts) {
									return (
										<Button
											onClick={async () => {
												await navigateToIntegrations(
													'zoom',
													true,
													false
												);
											}}
											className="bg-transparent shadow-none border border-color-primary text-color-primary"
										>
											{__('Add Account', 'quillbooking')}
										</Button>
									);
								}

								// User has everything configured - show manage accounts
								return (
									<Button
										onClick={async () => {
											await navigateToIntegrations(
												'zoom',
												true,
												true
											);
										}}
										className="bg-transparent border-none text-[#3F4254] shadow-none p-0"
									>
										<EditIcon />
										{__('Manage Accounts', 'quillbooking')}
									</Button>
								);
							})()}
						</Flex>
					</Checkbox>

					{/* outlook */}
					<Checkbox
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							locations.some((loc) => loc.type === 'ms-teams')
								? 'border-color-primary bg-color-secondary'
								: 'border-[#D3D4D6] bg-white'
						}`}
						checked={locations.some(
							(loc) => loc.type === 'ms-teams'
						)}
						onChange={(e) =>
							handleCheckboxChange('ms-teams', e.target.checked)
						}
						disabled={isOutlookDisabled()}
					>
						<Flex
							justify="space-between"
							align="center"
							className="w-full"
						>
							<Flex gap={12} className="items-center ml-2">
								<img
									src={teams}
									alt="teams.png"
									className="size-7"
								/>
								<Flex vertical>
									<div className="text-[#3F4254] text-[16px] font-semibold">
										{__('MS Teams', 'quillbooking')}
									</div>

									<div className="text-[#9197A4] text-[12px] italic">
										{(() => {
											let outlookStatusMessage = '';

											if (
												!connected_integrations.outlook
													.has_pro_version
											) {
												outlookStatusMessage = __(
													'Upgrade to Pro to access Outlook integration.',
													'quillbooking'
												);
											} else if (
												!connected_integrations.outlook
													.has_settings
											) {
												outlookStatusMessage = __(
													'Add Global Settings to use Outlook integration.',
													'quillbooking'
												);
											} else if (
												!connected_integrations.outlook
													.has_accounts
											) {
												outlookStatusMessage = __(
													'Add an account to use Outlook integration.',
													'quillbooking'
												);
											} else if (
												!connected_integrations.outlook
													.teams_enabled
											) {
												outlookStatusMessage = __(
													'Teams is not enabled for your default account. Please enable it in the Outlook integration settings.',
													'quillbooking'
												);
											}
											return outlookStatusMessage;
										})()}
									</div>
								</Flex>
							</Flex>
							{(() => {
								// User doesn't have pro version or settings
								if (
									!connected_integrations.outlook
										.has_pro_version
								) {
									return (
										<Button
											onClick={async () => {
												await navigateToIntegrations(
													'ms-teams',
													false,
													false
												);
											}}
											className="bg-transparent shadow-none border border-color-primary text-color-primary"
										>
											{__(
												'Upgrade to Pro',
												'quillbooking'
											)}
										</Button>
									);
								}

								// User has pro and settings but no accounts
								if (
									!connected_integrations.outlook.has_settings
								) {
									return (
										<Button
											onClick={async () => {
												await navigateToIntegrations(
													'ms-teams',
													true,
													false
												);
											}}
											className="bg-transparent shadow-none border border-color-primary text-color-primary"
										>
											{__('Connect', 'quillbooking')}
										</Button>
									);
								}

								if (
									!connected_integrations.outlook.has_accounts
								) {
									return (
										<Button
											onClick={async () => {
												await navigateToIntegrations(
													'ms-teams',
													true,
													false
												);
											}}
											className="bg-transparent shadow-none border border-color-primary text-color-primary"
										>
											{__('Add Account', 'quillbooking')}
										</Button>
									);
								}

								// User has everything configured - show manage accounts
								return (
									<Button
										onClick={async () => {
											await navigateToIntegrations(
												'ms-teams',
												true,
												true
											);
										}}
										className="bg-transparent border-none text-[#3F4254] shadow-none p-0"
									>
										<EditIcon />
										{__('Manage Accounts', 'quillbooking')}
									</Button>
								);
							})()}
						</Flex>
					</Checkbox>
				</Flex>

				<Flex vertical gap={10} className="justify-start items-start">
					<div className="text-[#09090B] text-[16px]">
						{__('In Person', 'quillbooking')}
					</div>
					<Checkbox
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							locations.some(
								(loc) => loc.type === 'attendee_address'
							)
								? 'border-color-primary bg-color-secondary'
								: 'border-[#D3D4D6] bg-white'
						}`}
						checked={locations.some(
							(loc) => loc.type === 'attendee_address'
						)}
						onChange={(e) =>
							handleCheckboxChange(
								'attendee_address',
								e.target.checked
							)
						}
					>
						<Flex vertical>
							<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
								{__('Attendee Address', 'quillbooking')}
							</div>
							<div className="text-[#9197A4] text-[12px] italic ml-2">
								{__('In Person', 'quillbooking')}
							</div>
						</Flex>
					</Checkbox>
					<Checkbox
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							locations.some(
								(loc) => loc.type === 'person_address'
							)
								? 'border-color-primary bg-color-secondary' // Checked styles
								: 'border-[#D3D4D6] bg-white' // Default styles
						}`}
						checked={locations.some(
							(loc) => loc.type === 'person_address'
						)}
						onChange={(e) =>
							handleCheckboxChange(
								'person_address',
								e.target.checked
							)
						}
					>
						<Flex align="center" className="justify-between">
							<Flex vertical className="w-[505px]">
								<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
									{__('Organizer Address', 'quillbooking')}
								</div>
								<div className="text-[#3F4254] text-[12px] italic ml-2">
									{(() => {
										const personAddress = locations.find(
											(loc) =>
												loc.type === 'person_address'
										);
										// If there's cached data, use it; otherwise fall back to "In Person"
										const cachedFields =
											cachedLocationData[
												'person_address'
											] || {};
										return (
											personAddress?.fields?.location ||
											cachedFields?.location || (
												<span className="text-[#9197A4]">
													{__(
														'In Person',
														'quillbooking'
													)}
												</span>
											)
										);
									})()}
								</div>
							</Flex>
							{(() => {
								const personAddress = locations.find(
									(loc) => loc.type === 'person_address'
								);
								if (personAddress?.fields?.location) {
									return (
										<Button
											onClick={() =>
												handleEditLocation(
													'person_address'
												)
											}
											className="bg-transparent border-none text-[#3F4254] shadow-none"
										>
											<EditIcon />
											{__('Edit', 'quillbooking')}
										</Button>
									);
								}
								return null;
							})()}
						</Flex>
					</Checkbox>
				</Flex>
			</Flex>

			<Flex vertical gap={15}>
				<Flex vertical gap={10} className="justify-start items-start">
					<div className="text-[#09090B] text-[16px]">
						{__('Phone & Online Meeting', 'quillbooking')}
					</div>
					<Checkbox
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							locations.some(
								(loc) => loc.type === 'attendee_phone'
							)
								? 'border-color-primary bg-color-secondary' // Checked styles
								: 'border-[#D3D4D6] bg-white' // Default styles
						}`}
						checked={locations.some(
							(loc) => loc.type === 'attendee_phone'
						)}
						onChange={(e) =>
							handleCheckboxChange(
								'attendee_phone',
								e.target.checked
							)
						}
					>
						<Flex vertical>
							<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
								{__('Attendee Phone', 'quillbooking')}
							</div>
							<div className="text-[#9197A4] text-[12px] italic ml-2">
								{__('Phone', 'quillbooking')}
							</div>
						</Flex>
					</Checkbox>
					<Checkbox
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							locations.some((loc) => loc.type === 'person_phone')
								? 'border-color-primary bg-color-secondary' // Checked styles
								: 'border-[#D3D4D6] bg-white' // Default styles
						}`}
						checked={locations.some(
							(loc) => loc.type === 'person_phone'
						)}
						onChange={(e) =>
							handleCheckboxChange(
								'person_phone',
								e.target.checked
							)
						}
					>
						<Flex align="center" className="justify-between">
							<Flex vertical className="w-[505px]">
								<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
									{__('Organizer Phone', 'quillbooking')}
								</div>
								<div className="text-[#3F4254] text-[12px] italic ml-2">
									{(() => {
										const personPhone = locations.find(
											(loc) => loc.type === 'person_phone'
										);
										// If there's cached data, use it; otherwise fall back to "Phone"
										const cachedFields =
											cachedLocationData[
												'person_phone'
											] || {};
										return (
											personPhone?.fields?.phone ||
											cachedFields?.phone || (
												<span className="text-[#9197A4]">
													{__(
														'Phone',
														'quillbooking'
													)}
												</span>
											)
										);
									})()}
								</div>
							</Flex>
							{(() => {
								const personPhone = locations.find(
									(loc) => loc.type === 'person_phone'
								);
								if (personPhone?.fields?.phone) {
									return (
										<Button
											onClick={() =>
												handleEditLocation(
													'person_phone'
												)
											}
											className="bg-transparent border-none text-[#3F4254] shadow-none"
										>
											<EditIcon />
											{__('Edit', 'quillbooking')}
										</Button>
									);
								}
								return null;
							})()}
						</Flex>
					</Checkbox>
					<Checkbox
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							locations.some((loc) => loc.type === 'online')
								? 'border-color-primary bg-color-secondary' // Checked styles
								: 'border-[#D3D4D6] bg-white' // Default styles
						}`}
						checked={locations.some((loc) => loc.type === 'online')}
						onChange={(e) =>
							handleCheckboxChange('online', e.target.checked)
						}
					>
						<Flex align="center" className="justify-between">
							<Flex vertical className="w-[505px]">
								<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
									{__('Online Meeting', 'quillbooking')}
								</div>
								<div className="text-[#3F4254] text-[12px] italic ml-2">
									{(() => {
										const meetingUrl = locations.find(
											(loc) => loc.type === 'online'
										);
										// If there's cached data, use it; otherwise fall back to "Online"
										const cachedFields =
											cachedLocationData['online'] || {};
										return (
											meetingUrl?.fields?.meeting_url ||
											cachedFields?.meeting_url || (
												<span className="text-[#9197A4]">
													{__(
														'Online',
														'quillbooking'
													)}
												</span>
											)
										);
									})()}
								</div>
							</Flex>
							{(() => {
								const meetingUrl = locations.find(
									(loc) => loc.type === 'online'
								);
								if (meetingUrl?.fields?.meeting_url) {
									return (
										<Button
											onClick={() =>
												handleEditLocation('online')
											}
											className="bg-transparent border-none text-[#3F4254] shadow-none"
										>
											<EditIcon />
											{__('Edit', 'quillbooking')}
										</Button>
									);
								}
								return null;
							})()}
						</Flex>
					</Checkbox>
				</Flex>

				<Flex vertical gap={2} className="justify-start items-start">
					<div className="text-[#09090B] text-[16px]">
						{__('Other', 'quillbooking')}
					</div>

					{customLocations.map((customLoc) => {
						const customLocation = locations.find(
							(loc) =>
								loc.type === 'custom' && loc.id === customLoc.id
						);

						return (
							<Checkbox
								key={customLoc.id}
								className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
									customLocation
										? 'border-color-primary bg-color-secondary'
										: 'border-[#D3D4D6] bg-white'
								}`}
								checked={!!customLocation}
								onChange={(e) =>
									handleCustomCheckboxChange(
										customLoc.id,
										e.target.checked
									)
								}
							>
								<Flex
									align="center"
									className="justify-between"
								>
									<Flex vertical className="w-[415px]">
										<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
											{customLocation?.fields?.location ||
												customLoc.fields?.location ||
												__('Custom', 'quillbooking')}
										</div>
										<div className="text-[#3F4254] text-[12px] italic ml-2">
											{customLocation?.fields
												?.description ||
												customLoc.fields?.description ||
												__('Custom', 'quillbooking')}
										</div>
									</Flex>
									{customLocation?.fields?.location && (
										<Flex>
											<Button
												onClick={(e) => {
													e.stopPropagation();
													handleEditLocation(
														'custom',
														customLoc.id
													);
												}}
												className="bg-transparent border-none text-[#3F4254] shadow-none"
											>
												<EditIcon />
												{__('Edit', 'quillbooking')}
											</Button>
											<Button
												onClick={(e) => {
													e.stopPropagation();
													removeCustomLocation(
														customLoc.id
													);
												}}
												className="bg-transparent border-none text-[#3F4254] shadow-none"
											>
												<div className="text-[#EF4444]">
													<TrashIcon />
												</div>
												{__('Delete', 'quillbooking')}
											</Button>
										</Flex>
									)}
								</Flex>
							</Checkbox>
						);
					})}

					<Button
						onClick={addCustomLocation}
						icon={<FaPlus className="text-color-primary" />}
						className="text-color-primary font-semibold outline-none border-none shadow-none"
					>
						{__('Add Custom Location', 'quillbooking')}
					</Button>
				</Flex>
			</Flex>

			<Modal
				title={
					<div>
						<h2 className="text-[#09090B] text-[30px] font-[700]">
							{newLocationType === 'custom'
								? __('Custom Location', 'quillbooking')
								: sprintf(
										__(' %s ', 'quillbooking'),
										get(
											locationTypes,
											`${newLocationType}.title`,
											''
										)
									)}
						</h2>
						<span className="text-[#979797] font-[400] text-[14px]">
							Add the following data.
						</span>
					</div>
				}
				open={isModalVisible}
				getContainer={false}
				footer={null}
				onCancel={handleModalCancel}
			>
				<Form form={form} layout="vertical" requiredMark={false}>
					{newLocationType === 'custom' ? (
						<>
							<Form.Item
								name="location"
								label={
									<div className="text-[#09090B] text-[16px]">
										{__('Location Name', 'quillbooking')}
										<span className="text-red-500">*</span>
									</div>
								}
								rules={[
									{
										required: true,
										message: __(
											'Please enter location name',
											'quillbooking'
										),
									},
								]}
							>
								<Input
									placeholder={__(
										'Location Name',
										'quillbooking'
									)}
									className="rounded-lg h-[48px]"
								/>
							</Form.Item>

							<Form.Item
								name="description"
								label={
									<div className="text-[#09090B] text-[16px]">
										{__('Description', 'quillbooking')}
										<span className="text-red-500">*</span>
									</div>
								}
								rules={[
									{
										required: true,
										message: __(
											'Please enter description',
											'quillbooking'
										),
									},
								]}
							>
								<TextArea
									rows={4}
									placeholder={__(
										'Description',
										'quillbooking'
									)}
									className="rounded-lg"
								/>
							</Form.Item>

							<Form.Item
								name="display_on_booking"
								valuePropName="checked"
							>
								<Checkbox className="custom-check text-[#3F4254] font-semibold">
									{__('Display on booking', 'quillbooking')}
								</Checkbox>
							</Form.Item>
						</>
					) : (
						newLocationType &&
						map(
							get(locationTypes, `${newLocationType}.fields`, {}),
							(field: LocationField, fieldKey) => (
								<Form.Item
									key={fieldKey}
									name={fieldKey}
									{...(field.type === 'checkbox'
										? { valuePropName: 'checked' } // only for checkbox
										: {
												label: (
													<div className="text-[#09090B] text-[16px]">
														{field.label}
														<span className="text-red-500">
															*
														</span>
														{field.label ===
															'Person Phone' && (
															<span className="text-[#afb9c4] text-sm ml-2">
																(with country
																code)
															</span>
														)}
													</div>
												),
											})}
									rules={[
										{
											required: field.required,
											message: sprintf(
												__(
													'Please enter %s',
													'quillbooking'
												),
												field.label
											),
										},
									]}
								>
									{field.type === 'checkbox' ? (
										<Checkbox className="custom-check text-[#3F4254] font-semibold">
											{field.label}
										</Checkbox>
									) : (
										<Input
											type={field.type}
											placeholder={sprintf(
												__('%s', 'quillbooking'),
												field.label
											)}
											className="rounded-lg h-[48px]"
										/>
									)}
								</Form.Item>
							)
						)
					)}

					<Form.Item>
						<Button
							htmlType="submit"
							className="w-full bg-color-primary text-white font-semibold rounded-lg transition-all"
							onClick={handleModalOk}
						>
							{__('Submit', 'quillbooking')}
						</Button>
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
};

export default Locations;
