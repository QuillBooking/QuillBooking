/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import ConnectionCard from './connection-card';
import { NoticeBanner, SelectionCard } from '@quillbooking/components';
import type { NoticeMessage } from '@quillbooking/client';
import IntegrationsShimmerLoader from '../../shimmer-loader';


const ConferencingCalendars: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [integrations, setIntegrations] = useState(() =>
        Object.entries(ConfigAPI.getIntegrations())
            .filter(([key]) => key !== 'twilio')
            .map(([key, integration]) => ({
                id: key,
                ...integration
            }))
    );
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState<NoticeMessage | null>(null);

    useEffect(() => {
        if (integrations.length > 0 && !activeTab) {
            setActiveTab(integrations[0].id);
        }
    }, [integrations, activeTab]);

    if (isLoading) {
        return <IntegrationsShimmerLoader />;
    }

    return (
        <div className="quillbooking-conferencing-calendars grid grid-cols-2 gap-5 w-full">
            {notice && (
                <div className="col-span-2">
                    <NoticeBanner
                        notice={notice}
                        closeNotice={() => setNotice(null)}
                    />
                </div>
            )}
            <SelectionCard
                integrations={integrations}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isLoading={isLoading}
            />
            {activeTab && (
                <ConnectionCard
                    slug={activeTab}
                    integration={integrations.find(int => int.id === activeTab)}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default ConferencingCalendars;