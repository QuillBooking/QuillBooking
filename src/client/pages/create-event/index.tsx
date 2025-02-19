/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Typography } from 'antd';

/**
 * Internal dependencies
 */
// import './style.scss';
import type { Event } from '@quillbooking/client';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';

/**
 * Main Calendars Component.
 */
const CreateEvent: React.FC = () => {
    const { id, type } = useParams<{ id: string; type: string; }>();
    console.log(id, type);

    const { callApi } = useApi();
    const { errorNotice } = useNotice();
    const [event, setEvent] = useState<Partial<Event> | null>(null);

    return (
        <></>
    );
};

export default CreateEvent;