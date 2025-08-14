import { __ } from '@wordpress/i18n';
import { message } from 'antd';
import { get, isEmpty, uniqueId } from 'lodash';
import { useNavigate } from '@quillbooking/hooks';
import { ACTIVE_PRO_URL } from '@quillbooking/constants';
import type {
    ExtendedLocation,
    CustomLocationState,
    IntegrationType,
    LocationsProps,
} from '../types';
import { IntegrationHelper } from '../helpers';

export const useLocationHandlers = (
    locations: ExtendedLocation[],
    onChange: (locations: ExtendedLocation[]) => void,
    connected_integrations: LocationsProps['connected_integrations'],
    calendar: any,
    handleSubmit: (redirect: boolean) => Promise<any>,
    locationTypes: any,
    cachedLocationData: Record<string, any>,
    setCachedLocationData: React.Dispatch<React.SetStateAction<Record<string, any>>>,
    customLocations: CustomLocationState[],
    setCustomLocations: React.Dispatch<React.SetStateAction<CustomLocationState[]>>
) => {
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();
    const integrationHelper = new IntegrationHelper(connected_integrations);

    // Navigate to integration settings page
    const navigateToIntegrations = async (
        integrationType: string,
        hasSettings = false,
        hasAccounts = false
    ) => {
        if (!integrationHelper.hasProVersion(integrationType as IntegrationType)) {
            window.location.href = ACTIVE_PRO_URL;
            return;
        }

        if (
            integrationHelper.hasProVersion(integrationType as IntegrationType) &&
            integrationHelper.hasGetStarted(integrationType as IntegrationType)
        ) {
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
                    messageApi.error(__('Failed to create calendar', 'quillbooking'));
                    return;
                }

                const path = `calendars/${response.id}`;

                if (!hasSettings) {
                    navigate(
                        `integrations&tab=conferencing-calendars&subtab=${integrationHelper.convertToSlug(
                            integrationType as IntegrationType
                        )}`
                    );
                } else if (!hasAccounts) {
                    navigate(
                        `${encodeURIComponent(path)}&tab=integrations&subtab=${integrationHelper.convertToSlug(
                            integrationType as IntegrationType
                        )}`
                    );
                } else {
                    navigate(
                        `${encodeURIComponent(path)}&tab=integrations&subtab=${integrationHelper.convertToSlug(
                            integrationType as IntegrationType
                        )}`
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
                `integrations&tab=conferencing-calendars&subtab=${integrationHelper.convertToSlug(
                    integrationType as IntegrationType
                )}`
            );
        } else if (!hasAccounts) {
            navigate(
                `${encodeURIComponent(path)}&tab=integrations&subtab=${integrationHelper.convertToSlug(
                    integrationType as IntegrationType
                )}`
            );
        } else {
            navigate(
                `${encodeURIComponent(path)}&tab=integrations&subtab=${integrationHelper.convertToSlug(
                    integrationType as IntegrationType
                )}`
            );
        }
    };

    // Modified handleCheckboxChange to check has_pro_version first
    const handleCheckboxChange = async (type: string, checked: boolean) => {
        // First priority: Check if user has Pro version for this integration
        if (
            checked &&
            !integrationHelper.hasProVersion(type as IntegrationType) &&
            !integrationHelper.isIntegrationConnected(type as IntegrationType) &&
            !integrationHelper.hasGetStarted(type as IntegrationType) &&
            !integrationHelper.isIntegrationGlobalConnected(type as IntegrationType)
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
                    if (!integrationHelper.isTeamsEnabled()) {
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
                    fields: Object.keys(savedFields).length > 0 ? savedFields : {},
                };
                onChange(updatedLocations);
            } else {
                const updatedLocations = [...locations];
                updatedLocations.push({
                    type,
                    fields: Object.keys(savedFields).length > 0 ? savedFields : {},
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

            const updatedLocations = locations.filter((loc) => loc.type !== type);
            onChange(updatedLocations);
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
        // This would need to be handled by the parent component
        // setEditingLocationIndex(index);
        // setNewLocationType(newType);
        // setIsModalVisible(true);
    };

    // Toggle custom location checkbox
    const handleCustomCheckboxChange = (customId: string, checked: boolean) => {
        // Update the customLocations visibility state
        setCustomLocations((prev) =>
            prev.map((custom) =>
                custom.id === customId ? { ...custom, visible: checked } : custom
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
                        // This would need to be handled by the parent component
                        // setNewLocationType('custom');
                        // setEditingCustomId(customId);
                        // setIsModalVisible(true);
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
        // This would need to be handled by the parent component
        // setNewLocationType('custom');
        // setEditingCustomId(newCustomId);
        // form.resetFields();
        // setIsModalVisible(true);

        return newCustomId;
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

    return {
        integrationHelper,
        messageApi,
        contextHolder,
        navigateToIntegrations,
        handleCheckboxChange,
        handleLocationTypeChange,
        handleCustomCheckboxChange,
        addCustomLocation,
        removeCustomLocation,
    };
};
