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

interface MentionsProps {
    onMentionClick: (mention: string, category: string) => void;
  }

const Mentions: React.FC<MentionsProps> = ({ onMentionClick }) => {
    if (!open) return null;
    const [selectedKey, setSelectedKey] = useState("attendee");
    const selectedOption = DataOptions.find(item => item.key === selectedKey);

    const renderCardContent = () => {
        switch (selectedKey) {
            case "attendee":
                return (
                    <Flex vertical gap={15}>
                        <Card onClick={() => onMentionClick("Guest First Name",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest First Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.first.name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Guest Last Name",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Last Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.last.name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Guest Full Name",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Full Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.full.name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Guest Email",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Email","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.email}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Guest Note",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Guest Note","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{guest.note}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Guest Main Phone Number",selectedKey)} className="cursor-pointer">
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
                        <Card onClick={() => onMentionClick("Event Name",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.event_name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Description",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Description","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.description}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Booking Title",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Booking Title","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.booking_title}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Additional Guests",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Additional Guests","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.additional_guests}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Full Start Date Time (with guest timezone)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Full Start Date Time (with guest timezone)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.full_start_end_guest_timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Full Start Date Time (with host timezone)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Full Start Date Time (with host timezone)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.full_start_end_host_timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Full Start & End Date Time (with guest timezone)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Full Start & End Date Time (with guest timezone))","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.full_start_and_end_host_timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Full Start & End Date Time (with host timezone)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Full Start & End Date Time (with host timezone))","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.full_start_and_end_host_timezone}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Date Time (UTC)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (UTC)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Date Time (with guest timezone)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (with guest timezone)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time_for_attendee}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Date Time (with host timezone)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (with host timezone)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time_for_host}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Date Time (with attendee timezone)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (with attendee timezone) (Ex: 2024-05-20)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time_for_attendee.format.Y-m-d}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Date Time (with host timezone)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Date Time (with host timezone) (Ex: 2024-05-20)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_date_time_for_host.format.Y-m-d}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Location Deatils (HTML)",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Location Deatils (HTML)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.location_details_html}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Cancel Reason",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Cancel Reason","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.cancel_reason}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Start Time",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Start Time (ex: 2 hours from now)","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.start_time_human_format}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Booking Cancellation URL",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Booking Cancellation URL","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.cancelation_url}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Booking Reschedule URL",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Booking Reschedule URL","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.reschedule_url}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Booking Details Admin URL",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Booking Details Admin URL","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.admin_booking_url}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Unique Booking Hash",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Unique Booking Hash","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{booking.booking_hash}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Reschedule Reason",selectedKey)} className="cursor-pointer">
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
                        <Card onClick={() => onMentionClick("Host Name",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Host Name","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{host.name}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Host Email",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Host Email","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{host.email}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Host Timezone",selectedKey)} className="cursor-pointer">
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
                        <Card onClick={() => onMentionClick("Event ID",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event ID","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{event.id}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Calendar ID",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Calendar ID","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{event.calendar_id}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Event Title",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Event Title","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{event.title}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Calendar Title",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Calendar Title","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{calendar.title}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Calendar Description",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Calendar Description","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{calendar.description}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Add Booking to Calendar",selectedKey)} className="cursor-pointer">
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
                        <Card onClick={() => onMentionClick("Payment Total",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Total","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.payment_total}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Payment Status",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Status","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.payment_status}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Payment Method",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Method","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.payment_method}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Currency",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Currency","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.currency}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Payment Date",selectedKey)} className="cursor-pointer">
                            <Flex vertical gap={3}>
                                <span className="italic text-[#3F4254] text-[16px] font-semibold">{__("Payment Date","quillbooking")}</span>
                                <span className="text-[#505255] text-[12px] italic">{__("{{payment.payment_date}}","quillbooking")}</span>
                            </Flex>
                        </Card>
                        <Card onClick={() => onMentionClick("Payment Receipt (HTML)",selectedKey)} className="cursor-pointer">
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

export default Mentions;

