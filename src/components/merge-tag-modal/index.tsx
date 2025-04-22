import React, { useState } from "react";
import { __ } from "@wordpress/i18n";
import { Card, Flex } from "antd";
import { MergeTagAttIcon, MergeTagBookingIcon, MergeTagOtherIcon, MergeTagPaymentIcon } from "@quillbooking/components";

const DataOptions = [
    { key: "attendee", icon: <MergeTagAttIcon />, title: __('Attendee Data', 'quillbooking'), description: __("Select one of Merge tags that related to your input.", 'quillbooking') },
    { key: "booking", icon: <MergeTagBookingIcon />, title: __("Booking Data", 'quillbooking'), description: __("Select one of Merge tags that related to your input.", "quillbooking") },
    { key: "host", icon: <MergeTagAttIcon />, title: __("Host Data", 'quillbooking'), description: __("Select one of Merge tags that related to your input.", "quillbooking") },
    { key: "other", icon: <MergeTagOtherIcon />, title: __("Other", 'quillbooking'), description: __("Select one of Merge tags that related to your input.", 'quillbooking') },
    { key: "payment", icon: <MergeTagPaymentIcon />, title: __("Payment Data", 'quillbooking'), description: __("Select one of Merge tags that related to your input.", 'quillbooking') },
];

interface MergeProps {
    onMentionClick: (mention: string) => void;
  }

const MergeTagModal: React.FC<MergeProps> = ({ onMentionClick }) => {
    if (!open) return null;
    const [selectedKey, setSelectedKey] = useState("attendee");

    const renderCardContent = () => {
        switch (selectedKey) {
            case "attendee":
                return (
                    <Flex vertical gap={15}>
                        <Card onClick={() => onMentionClick("{{guest.first.name}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest First Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.first.name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{guest.last.name}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Last Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.last.name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{guest.full.name}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Full Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.full.name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{guest.email}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Email","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.email}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{guest.note}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Note","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.note}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.phone}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Main Phone Number (If Provided)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.phone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                    </Flex>
                );
            case "booking":
                return (
                    <Flex vertical gap={15}>
                        <Card onClick={() => onMentionClick("{{booking.event_name}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.event_name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.description}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Description","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.description}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.booking_title}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Booking Title","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.booking_title}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.additional_guests}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Additional Guests","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.additional_guests}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.full_start_end_guest_timezone}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Full Start Date Time (with guest timezone)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.full_start_end_guest_timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.full_start_end_host_timezone}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Full Start Date Time (with host timezone)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.full_start_end_host_timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.full_start_and_end_guest_timezone}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Full Start & End Date Time (with guest timezone))","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.full_start_and_end_guest_timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.full_start_and_end_host_timezone}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Full Start & End Date Time (with host timezone))","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.full_start_and_end_host_timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.start_date_time}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (UTC)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.start_date_time_for_attendee}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (with guest timezone)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time_for_attendee}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.start_date_time_for_host}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (with host timezone)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time_for_host}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.start_date_time_for_attendee.format.Y-m-d}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (with attendee timezone) (Ex: 2024-05-20)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time_for_attendee.format.Y-m-d}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.start_date_time_for_host.format.Y-m-d}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (with host timezone) (Ex: 2024-05-20)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time_for_host.format.Y-m-d}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.location_details_html}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Location Deatils (HTML)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.location_details_html}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.cancel_reason}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Cancel Reason","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.cancel_reason}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.start_time_human_format}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Start Time (ex: 2 hours from now)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_time_human_format}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.cancelation_url}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Booking Cancellation URL","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.cancelation_url}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.reschedule_url}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Booking Reschedule URL","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.reschedule_url}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.admin_booking_url}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Booking Details Admin URL","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.admin_booking_url}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.booking_hash}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Unique Booking Hash","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.booking_hash}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{booking.reschedule_reason}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Reschedule Reason","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.reschedule_reason}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                    </Flex>
                );
            case "host":
                return (
                    <Flex vertical gap={15}>
                        <Card onClick={() => onMentionClick("{{host.name}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Host Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{host.name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{host.email}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Host Email","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{host.email}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{host.timezone}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Host Timezone","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{host.timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                    </Flex>
                );
            case "other":
                return (
                    <Flex vertical gap={15}>
                        <Card onClick={() => onMentionClick("{{event.id}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event ID","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{event.id}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{event.calendar_id}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Calendar ID","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{event.calendar_id}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{event.title}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Title","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{event.title}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{calendar.title}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Calendar Title","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{calendar.title}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{calendar.description}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Calendar Description","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{calendar.description}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{add_booking_to_calendar}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Add Booking to Calendar","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{add_booking_to_calendar}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                    </Flex>
                );
            case "payment":
                return (
                    <Flex vertical gap={15}>
                        <Card onClick={() => onMentionClick("{{payment.payment_total}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Total","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.payment_total}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{payment.payment_status}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Status","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.payment_status}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{payment.payment_method}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Method","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.payment_method}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{payment.currency}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Currency","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.currency}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{payment.payment_date}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Date","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.payment_date}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("{{payment.receipt_html}}")} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Receipt (HTML)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.receipt_html}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                    </Flex>
                );
            default:
                return <div>Select a category to see details.</div>;
        }
    };

    return (
        <Flex gap={30}>
            <Card className="w-[648px]">
                <Flex vertical gap={10}>
                    {DataOptions.map(({ key, icon, title, description }) => (
                        <Flex gap={10}
                            className={`flex items-center border p-4 rounded-lg cursor-pointer ${selectedKey === key ? "border-color-primary bg-color-secondary" : "border-[#E4E4E4]"
                                }`}
                            key={key} onClick={() => setSelectedKey(key)}>
                            <div className={`rounded-lg p-2 ${selectedKey === key ? "bg-[#D5B0F4]" : "border border-color-secondary"
                                }`}>
                                {icon}
                            </div>
                            <div className='flex flex-col'>
                                <span className='text-[#3F4254] text-[16px] font-semibold'>{title}</span>
                                <span className={`text-[12px] font-[400] ${selectedKey === key ? "text-[#505255]" : "text-[#9197A4]"
                                    }`}>{description}</span>
                            </div>
                        </Flex>
                    ))}
                </Flex>
            </Card>

            <Card className="w-[648px]">
                {renderCardContent()}
            </Card>
        </Flex>
    );
};

export default MergeTagModal;

