/**
 * Wordpress dependencies
 */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { Flex, Button, Input, Modal, Form, Checkbox } from 'antd';
import { map, isEmpty, get, uniqueId } from 'lodash';
import { FaPlus } from 'react-icons/fa';
/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import type { LocationField } from '@quillbooking/config';
import type {
	ConnectedIntegrationsFields,
	Location,
} from '@quillbooking/client';
import { EditIcon, TrashIcon } from '@quillbooking/components';

import './style.scss';
import meet from '@quillbooking/assets/icons/google/google_meet.png';
import zoom from '@quillbooking/assets/icons/zoom/zoom_video.png';
import teams from '@quillbooking/assets/icons/teams/teams.png';
import { useNavigate } from '@quillbooking/hooks';
import TextArea from 'antd/es/input/TextArea';

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
		outlook: ConnectedIntegrationsFields;
		twilio: ConnectedIntegrationsFields;
		zoom: ConnectedIntegrationsFields;
	};
	calendar?: any;
}> = ({
	locations,
	onChange,
	onKeepDialogOpen,
	connected_integrations,
	calendar,
}) => {
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLocationIndex, setEditingLocationIndex] = useState<
		number | null
	>(null);
	const [newLocationType, setNewLocationType] = useState<string | null>(null);
	const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
	// Track custom locations separately
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
	// Cache for non-custom locations
	const [cachedLocationData, setCachedLocationData] = useState<
		Record<string, any>
	>({});
	const [form] = Form.useForm();
	const locationTypes = ConfigAPI.getLocations();

	console.log('Calendar', calendar);

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
	const navigateToIntegrations = (
		integrationType: string,
		hasSettings = false,
		hasAccounts = false
	) => {
		const adminUrl = ConfigAPI.getAdminUrl();
		const path = `calendars/${calendar?.id}`;
		if (!hasSettings) {
			window.location.href = `${adminUrl}?page=quillbooking&path=integrations&subtab=${integrationType}`;
		} else if (!hasAccounts) {
			window.location.href = `${adminUrl}?page=quillbooking&path=${encodeURIComponent(path)}&tab=integrations&subtab=${integrationType}`;
		} else {
			window.location.href = `${adminUrl}?page=quillbooking&path=${encodeURIComponent(path)}&tab=integrations&subtab=${integrationType}`;
		}
	};

	// Modified handleCheckboxChange to prevent checking if integration isn't connected
	const handleCheckboxChange = (type: string, checked: boolean) => {
		// First check if this is an integration-dependent location that requires connection
		if (
			checked &&
			!isIntegrationConnected(type) &&
			!isIntegrationGolbalConnected(type)
		) {
			console.log('Checking location checked1:', checked);
			// If trying to check but integration isn't connected, navigate to integration page
			switch (type) {
				case 'google-meet':
					navigateToIntegrations(
						'google',
						isIntegrationGolbalConnected(type),
						isIntegrationConnected(type)
					);
					break;
				case 'zoom':
					navigateToIntegrations(
						'zoom',
						isIntegrationGolbalConnected(type),
						isIntegrationConnected(type)
					);
					break;
				case 'ms-teams':
					navigateToIntegrations(
						'outlook',
						isIntegrationGolbalConnected(type),
						isIntegrationConnected(type)
					);
					break;
			}
			// Prevent checking the checkbox
			return;
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
			console.log('Form Values:', values);

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

	return (
		<>
			<Flex vertical gap={15}>
				<Flex vertical gap={10} className="justify-start items-start">
					<div className="text-[#09090B] text-[16px]">
						{__('Conferencing', 'quillbooking')}
					</div>
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
						disabled={
							(!connected_integrations.google.connected ||
								!connected_integrations.google.has_settings ||
								(connected_integrations.google.connected &&
									!connected_integrations.google
										.has_accounts)) &&
							!locations.some((loc) => loc.type === 'google-meet')
						}
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
								<Flex
									vertical
									className={`${connected_integrations.google.connected ? 'w-[415px]' : 'w-[480px]'}`}
								>
									<div className="text-[#3F4254] text-[16px] font-semibold">
										{__('Google Meet', 'quillbooking')}
									</div>
									<div className="text-[#9197A4] text-[12px] italic">
										{connected_integrations.google
											.has_settings
											? __('Connected', 'quillbooking')
											: __(
													'Need to be Connect First - Visit the Google Meet integration page from Settings.',
													'quillbooking'
												)}
									</div>
								</Flex>
							</Flex>
							{!connected_integrations.google.has_settings ? (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'google',
											false,
											false
										)
									}
									className="bg-transparent shadow-none border border-color-primary text-color-primary"
								>
									{__('Connect', 'quillbooking')}
								</Button>
							) : !connected_integrations.google.has_accounts ? (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'google',
											true,
											false
										)
									}
									className="bg-transparent shadow-none border border-color-primary text-color-primary"
								>
									{__('Add Account', 'quillbooking')}
								</Button>
							) : (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'google',
											true,
											true
										)
									}
									className="bg-transparent border-none text-[#3F4254] shadow-none"
								>
									<EditIcon />
									{__('Manage Accounts', 'quillbooking')}
								</Button>
							)}
						</Flex>
					</Checkbox>
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
						disabled={
							((!connected_integrations.zoom.has_settings &&
								!connected_integrations.zoom.has_accounts) ||
								(!connected_integrations.zoom.connected &&
									!connected_integrations.zoom
										.has_accounts)) &&
							!locations.some((loc) => loc.type === 'zoom')
						}
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
								<Flex
									vertical
									className={`${connected_integrations.zoom.connected ? 'w-[415px]' : 'w-[480px]'}`}
								>
									<div className="text-[#3F4254] text-[16px] font-semibold">
										{__('Zoom Video', 'quillbooking')}
									</div>
									<div className="text-[#9197A4] text-[12px] italic">
										{connected_integrations.zoom
											.has_settings
											? __('Connected', 'quillbooking')
											: __(
													'Need to be Connect First - Visit the Zoom integration page from Settings.',
													'quillbooking'
												)}
									</div>
								</Flex>
							</Flex>
							{!connected_integrations.zoom.has_settings &&
							!connected_integrations.zoom.has_accounts ? (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'zoom',
											false,
											false
										)
									}
									className="bg-transparent shadow-none border border-color-primary text-color-primary"
								>
									{__('Connect', 'quillbooking')}
								</Button>
							) : !connected_integrations.zoom.has_accounts ? (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'zoom',
											true,
											false
										)
									}
									className="bg-transparent shadow-none border border-color-primary text-color-primary"
								>
									{__('Add Account', 'quillbooking')}
								</Button>
							) : (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'zoom',
											true,
											true
										)
									}
									className="bg-transparent border-none text-[#3F4254] shadow-none"
								>
									<EditIcon />
									{__('Manage Accounts', 'quillbooking')}
								</Button>
							)}
						</Flex>
					</Checkbox>
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
						disabled={
							(!connected_integrations.outlook.connected ||
								!connected_integrations.outlook.has_settings ||
								(connected_integrations.outlook.connected &&
									!connected_integrations.outlook
										.has_accounts)) &&
							!locations.some((loc) => loc.type === 'ms-teams')
						}
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
								<Flex
									vertical
									className={`${connected_integrations.outlook.connected ? 'w-[415px]' : 'w-[480px]'}`}
								>
									<div className="text-[#3F4254] text-[16px] font-semibold">
										{__('MS Teams', 'quillbooking')}
									</div>
									<div className="text-[#9197A4] text-[12px] italic">
										{connected_integrations.outlook
											.has_settings
											? __('Connected', 'quillbooking')
											: __(
													'Need to be Connect First - Visit the MS Teams integration page from Settings.',
													'quillbooking'
												)}
									</div>
								</Flex>
							</Flex>
							{!connected_integrations.outlook.has_settings ? (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'outlook',
											false,
											false
										)
									}
									className="bg-transparent shadow-none border border-color-primary text-color-primary"
								>
									{__('Connect', 'quillbooking')}
								</Button>
							) : !connected_integrations.outlook.has_accounts ? (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'outlook',
											true,
											false
										)
									}
									className="bg-transparent shadow-none border border-color-primary text-color-primary"
								>
									{__('Add Account', 'quillbooking')}
								</Button>
							) : (
								<Button
									onClick={() =>
										navigateToIntegrations(
											'outlook',
											true,
											true
										)
									}
									className="bg-transparent border-none text-[#3F4254] shadow-none"
								>
									<EditIcon />
									{__('Manage Accounts', 'quillbooking')}
								</Button>
							)}
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
