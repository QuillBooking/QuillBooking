/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Form } from 'antd';
import { uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import type { LocationsProps, CustomLocationState } from './types';
import { useLocationHandlers } from './hooks/useLocationHandlers';
import {
	ConferencingSection,
	InPersonSection,
	PhoneOnlineSection,
	CustomLocationSection,
	LocationModal,
} from './components';

import './style.scss';

const Locations: React.FC<LocationsProps> = ({
	locations,
	onChange,
	onKeepDialogOpen,
	connected_integrations,
	calendar,
	handleSubmit = async () => {},
}) => {
	// State management
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLocationIndex, setEditingLocationIndex] = useState<
		number | null
	>(null);
	const [newLocationType, setNewLocationType] = useState<string | null>(null);
	const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
	const [customLocations, setCustomLocations] = useState<
		CustomLocationState[]
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

	// Use custom hook for location handlers
	const {
		integrationHelper,
		contextHolder,
		navigateToIntegrations,
		handleCheckboxChange,
		addCustomLocation: baseAddCustomLocation,
		removeCustomLocation,
		handleCustomCheckboxChange,
	} = useLocationHandlers(
		locations,
		onChange,
		connected_integrations,
		calendar,
		handleSubmit,
		locationTypes,
		cachedLocationData,
		setCachedLocationData,
		customLocations,
		setCustomLocations
	);

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

	// Add custom location wrapper
	const addCustomLocation = () => {
		const newCustomId = baseAddCustomLocation();

		// Open modal to edit the new custom location
		setNewLocationType('custom');
		setEditingCustomId(newCustomId);
		form.resetFields();
		setIsModalVisible(true);
	};

	return (
		<>
			{contextHolder}
			<div className="space-y-4">
				<ConferencingSection
					locations={locations}
					integrationHelper={integrationHelper}
					onCheckboxChange={handleCheckboxChange}
					onNavigateToIntegrations={navigateToIntegrations}
					calendar={calendar}
				/>

				<InPersonSection
					locations={locations}
					cachedLocationData={cachedLocationData}
					onCheckboxChange={handleCheckboxChange}
					onEditLocation={handleEditLocation}
				/>
			</div>

			<div className="space-y-4">
				<PhoneOnlineSection
					locations={locations}
					cachedLocationData={cachedLocationData}
					onCheckboxChange={handleCheckboxChange}
					onEditLocation={handleEditLocation}
				/>

				<CustomLocationSection
					locations={locations}
					customLocations={customLocations}
					onCustomCheckboxChange={handleCustomCheckboxChange}
					onEditLocation={handleEditLocation}
					onRemoveCustomLocation={removeCustomLocation}
					onAddCustomLocation={addCustomLocation}
				/>
			</div>

			<LocationModal
				isVisible={isModalVisible}
				newLocationType={newLocationType}
				locationTypes={locationTypes}
				onOk={handleModalOk}
				onCancel={handleModalCancel}
				form={form}
			/>
		</>
	);
};

export default Locations;
