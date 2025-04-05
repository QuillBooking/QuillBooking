import React, { useState } from "react";
import { __ } from '@wordpress/i18n';
import { Button, Popconfirm, Flex, Modal } from "antd";
import { EditIcon, DisableIcon, CloneIcon, TrashIcon, CalendarDeleteIcon, CalendarDisableIcon } from "@quillbooking/components"
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
    const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
    const [isModalDisableOpen, setIsModalDisableOpen] = useState(false);

    const showDisableModal = () => {
        setIsModalDisableOpen(true);
    };

    const handleDisable = () => {
        onDisable(calendar.id);
        setIsModalDisableOpen(false);
    };

    const handleDisableCancel = () => {
        setIsModalDisableOpen(false);
    };

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
        <Flex vertical gap={10} className="items-start text-color-primary-text">
            <Button type="text" icon={<EditIcon />} onClick={() => onEdit(calendar.id)}>
                {__('Edit', 'quillbooking')}
            </Button>

            <Button type="text" onClick={showDisableModal} icon={<DisableIcon />}>
                {isDisabled ? __('Enable', 'quillbooking') : __('Disable', 'quillbooking')}
            </Button>

            <Button type="text" icon={<CloneIcon />} onClick={() => onClone(calendar)}>
                {__('Clone Events', 'quillbooking')}
            </Button>
            <Button type="text" icon={<TrashIcon />} onClick={showDeleteModal}>
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
                        <Button key="cancel" onClick={handleDeleteCancel} className="border rounded-lg py-6 text-[#71717A] font-semibold w-full">
                            {__('Back', 'quillbooking')}
                        </Button>
                        <Button key="save" type="primary" onClick={handleDelete} className="bg-[#EF4444] rounded-lg py-6 font-semibold w-full">
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
            <Modal
                open={isModalDisableOpen}
                onOk={handleDisable}
                onCancel={handleDisableCancel}
                okText={__('Yes', 'quillbooking')}
                cancelText={__('No', 'quillbooking')}
                footer={[
                    <Flex className="w-full mt-5 items-center justify-center" gap={10}>
                        <Button key="cancel" onClick={handleDisableCancel} className="border rounded-lg py-6 text-[#71717A] font-semibold w-full">
                            {__('Back', 'quillbooking')}
                        </Button>
                        <Button key="save" type="primary" onClick={handleDisable} className="bg-[#EF4444] rounded-lg py-6 font-semibold w-full">
                            {__('Yes, Disable', 'quillbooking')}
                        </Button>
                    </Flex>
                ]}
            >
                <Flex vertical justify="center" align="center" className="rounded-lg">
                    <div className="bg-[#EF44441F] p-4 rounded-lg">
                        <CalendarDisableIcon />
                    </div>
                    <p className="text-[#09090B] text-[20px] font-[700] mt-5">{__('Do you really you want to disable this event?', 'quillbooking')}</p>
                    <span className="text-[#71717A] text-center">{__('by Disable this event you will not be able to Share or edit event untiled you Enable it again!', 'quillbooking')}</span>
                </Flex>
            </Modal>
        </Flex>
    );
};

export default CalendarActions;
