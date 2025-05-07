/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Card, Flex } from 'antd';

/**
 * Internal dependencies
 */
import {Header} from '@quillbooking/components'

const BookingAnalyticsChart: React.FC = () => {

    return (
        <Flex vertical gap={20}>
            <Flex gap={20} className='w-full'>
                <Card className='w-full'>Total Revenue</Card>
                <Card className='w-full'>Total guests</Card>
            </Flex>
            <Card>Chart</Card>
        </Flex>
    );
};

export default BookingAnalyticsChart;