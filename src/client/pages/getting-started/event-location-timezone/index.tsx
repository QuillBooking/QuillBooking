/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { Card, Flex } from 'antd';
import React from 'react';
/**
 * Internal dependencies
 */
import { Locations, SelectTimezone } from '@quillbooking/components';
import { GettingStartedComponentProps } from '@quillbooking/client';

const LocationTimezone: React.FC<GettingStartedComponentProps> = ({
    event,
    onEventChange = () => {},
}) => {
    return (
        <Flex vertical gap={20} className="">
            <Card className="bg-white px-[20px]">
                <Flex vertical gap={20}>
                    <Flex className="justify-between">
                        <div className="text-[#09090B] text-[16px] font-medium">
                            {__('How Will You Meet', 'quillbooking')}
                            <span className="text-red-500">*</span>
                        </div>
                        <div className="text-[#848484] italic">
                            {__('You Can Select More Than One', 'quillbooking')}
                        </div>
                    </Flex>
                    <Flex vertical gap={15}>
                        <Locations
                            locations={event.location || []}
                            onChange={(locations) => {
                                onEventChange('location', locations);
                            }}
                            connected_integrations={
                                event.connected_integrations || {
                                    apple: {
                                        name: 'apple',
                                        connected: false,
                                    },
                                    google: {
                                        name: 'google',
                                        connected: false,
                                    },
                                    outlook: {
                                        name: 'outlook',
                                        connected: false,
                                    },
                                    twilio: {
                                        name: 'twilio',
                                        connected: false,
                                    },
                                    zoom: {
                                        name: 'zoom',
                                        connected: false,
                                    },
                                }
                            }
                        />
                    </Flex>
                </Flex>
            </Card>
            <Card className="bg-white">
                <Flex vertical gap={8}>
                    <SelectTimezone
                        timezone={event.calendar?.timezone || ''}
                        handleChange={(value) => 
                            onEventChange('calendar', {
                                ...event.calendar,
                                timezone: value
                            })
                        }
                    />
                </Flex>
            </Card>
        </Flex>
    );
};

export default LocationTimezone;