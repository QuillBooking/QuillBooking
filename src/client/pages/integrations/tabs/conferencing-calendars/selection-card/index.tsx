/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
import { NoticeComponent } from '@quillbooking/components';
import type { Integration } from '@quillbooking/config';

export interface SelectionCardProps {
    integrations: Integration[];
    activeTab: string | null;
    setActiveTab: (tab: string) => void;
    isLoading?: boolean;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
    integrations,
    activeTab,
    setActiveTab,
    isLoading = false,
}) => {
    const [isNoticeVisible, setNoticeVisible] = useState(true);

    return (
        <Card className="rounded-lg mb-6 w-full">
            <Flex vertical gap={15}>
                <NoticeComponent
                    isNoticeVisible={isNoticeVisible}
                    setNoticeVisible={setNoticeVisible}
                />
                {isLoading ? (
                    <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                    integrations.map((integration) => (
                        <Card
                            key={integration.id}
                            className={`w-full cursor-pointer ${activeTab === integration.id ? 'bg-color-secondary border-color-primary' : ''}`}
                            onClick={() => {
                                if (activeTab !== integration.id) {
                                    setActiveTab(integration.id);
                                }
                            }}
                        >
                            <Flex gap={18} align="center">
                                <img
                                    src={integration.icon}
                                    alt={`${integration.id}.png`}
                                    className="size-12"
                                />
                                <Flex vertical gap={2}>
                                    <div
                                        className={`text-base font-semibold ${activeTab === integration.id ? 'text-color-primary' : 'text-[#3F4254]'}`}
                                    >
                                        {integration.title ||
                                            __(
                                                integration.id
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    integration.id.slice(1),
                                                'quillbooking'
                                            )}
                                    </div>
                                    <div
                                        className={`text-xs ${activeTab === integration.id ? 'text-color-primary' : 'text-[#9197A4]'}`}
                                    >
                                        {integration.description ||
                                            __(
                                                'Connect your calendar for scheduling.',
                                                'quillbooking'
                                            )}
                                    </div>
                                </Flex>
                            </Flex>
                        </Card>
                    ))
                )}
            </Flex>
        </Card>
    );
};

export default SelectionCard;