import React from "react";
import { __ } from '@wordpress/i18n';
import { Button, Popconfirm, Flex } from "antd";
import EditIcon from "../icons/edit-icon";
import DisableIcon from "../icons/disable-icon";
import CloneIcon from "../icons/clone-icon";
import TrashIcon from "../icons/trash-icon";
import type { Calendar } from '@quillbooking/client';


// Define the props type
interface CalendarActionsProps {
    calendar: Calendar; // Ensure this matches your actual Calendar type
    onEdit: (id: number) => void;
    onDisable: (id: number) => void;
    isDisabled: boolean;
    onClone: (calendar: Calendar) => void;
    onDelete: (id: number) => void;
}

const CalendarActions: React.FC<CalendarActionsProps> = ({
    calendar,
    onEdit,
    onDisable,
    isDisabled,
    onClone,
    onDelete
}) => {
    return (
        <Flex vertical gap={10} className="items-start text-[#292D32]">
            <Button type="text" icon={<EditIcon />} onClick={() => onEdit(calendar.id)}>
                {__('Edit', 'quillbooking')}
            </Button>

            <Button type="text" onClick={() => onDisable(calendar.id)} icon={<DisableIcon />}>
                {isDisabled ? __('Enable', 'quillbooking') : __('Disable', 'quillbooking')}
            </Button>

            <Button type="text" icon={<CloneIcon />} onClick={() => onClone(calendar)}>
                {__('Clone Events', 'quillbooking')}
            </Button>

            <Popconfirm
                title={__('Are you sure to delete this calendar?', 'quillbooking')}
                onConfirm={() => onDelete(calendar.id)}
                okText={__('Yes', 'quillbooking')}
                cancelText={__('No', 'quillbooking')}
            >
                <Button type="text" icon={<TrashIcon />}>
                    {__('Delete', 'quillbooking')}
                </Button>
            </Popconfirm>
        </Flex>
    );
};

export default CalendarActions;
