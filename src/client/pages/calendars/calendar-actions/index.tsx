/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState } from "react";
import { Button, Flex, Modal } from "antd";
/**
 * Internal dependencies
 */
import { EditIcon, TrashIcon, CalendarDeleteIcon, CloneIcon } from "@quillbooking/components"
import type { Calendar } from '@quillbooking/client';
import ConfigAPI from '@quillbooking/config';
import { useCopyToClipboard } from "@quillbooking/hooks";

// Define the props type
interface CalendarActionsProps {
    calendar: Calendar; // Ensure this matches your actual Calendar type
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

const CalendarActions: React.FC<CalendarActionsProps> = ({
    calendar,
    onEdit,
    onDelete
}) => {
    const copyToClipboard = useCopyToClipboard();
    const siteUrl = ConfigAPI.getSiteUrl();
    const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);

    const showDeleteModal = () => {
        setIsModalDeleteOpen(true);
    };

    const handleDelete = () => {
        onDelete(calendar.id);
        setIsModalDeleteOpen(false);
    };

    const handleDeleteCancel = () => {
        setIsModalDeleteOpen(false);
    };

    return (
        <Flex vertical gap={10} className="items-start text-color-primary-text w-full">
            <Button type="text" icon={<EditIcon />} onClick={() => onEdit(calendar.id)} className="w-full flex justify-start">
                {__('Edit', 'quillbooking')}
            </Button>

            <Button icon={<CloneIcon />} type="text" onClick={() => copyToClipboard(`${siteUrl}?quillbooking_calendar=${calendar.slug}`, __('Link copied', 'quillbooking'))}>
                {__('Copy Link', 'quillbooking')}
            </Button>

            <Button type="text" icon={<TrashIcon />} onClick={showDeleteModal} className="w-full flex justify-start">
                {__('Delete', 'quillbooking')}
            </Button>
            <Modal
                open={isModalDeleteOpen}
                onOk={handleDelete}
                onCancel={handleDeleteCancel}
                okText={__('Yes', 'quillbooking')}
                cancelText={__('No', 'quillbooking')}
                footer={[
                    <Flex className="w-full mt-5 items-center justify-center" gap={10}>
                        <Button key="cancel" onClick={handleDeleteCancel} className="border rounded-lg text-[#71717A] font-semibold w-full">
                            {__('Back', 'quillbooking')}
                        </Button>
                        <Button key="save" type="primary" onClick={handleDelete} className="bg-[#EF4444] rounded-lg font-semibold w-full">
                            {__('Yes, Delete', 'quillbooking')}
                        </Button>
                    </Flex>
                ]}
            >
                <Flex vertical justify="center" align="center" className="rounded-lg">
                    <div className="bg-[#EF44441F] p-4 rounded-lg">
                        <CalendarDeleteIcon />
                    </div>
                    <p className="text-[#09090B] text-[20px] font-[700] mt-5">{__('Do you really you want to delete this event?', 'quillbooking')}</p>
                    <span className="text-[#71717A]">{__('by deleting this event you will not be able to restore it again!', 'quillbooking')}</span>
                </Flex>
            </Modal>
        </Flex>
    );
};

export default CalendarActions;
