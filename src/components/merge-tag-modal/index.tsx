import React, { useState } from "react";
import { __ } from "@wordpress/i18n";
import { Card, Flex } from "antd";
import { 
  MergeTagAttIcon, 
  MergeTagBookingIcon, 
  MergeTagOtherIcon, 
  MergeTagPaymentIcon 
} from "@quillbooking/components";

// Categories data structure
const DATA_CATEGORIES = [
  { 
    key: "attendee", 
    icon: <MergeTagAttIcon />, 
    title: __('Attendee Data', 'quillbooking'), 
    description: __("Select one of Merge tags that related to your input.", 'quillbooking') 
  },
  { 
    key: "booking", 
    icon: <MergeTagBookingIcon />, 
    title: __("Booking Data", 'quillbooking'), 
    description: __("Select one of Merge tags that related to your input.", "quillbooking") 
  },
  { 
    key: "host", 
    icon: <MergeTagAttIcon />, 
    title: __("Host Data", 'quillbooking'), 
    description: __("Select one of Merge tags that related to your input.", "quillbooking") 
  },
  { 
    key: "other", 
    icon: <MergeTagOtherIcon />, 
    title: __("Other", 'quillbooking'), 
    description: __("Select one of Merge tags that related to your input.", 'quillbooking') 
  },
  { 
    key: "payment", 
    icon: <MergeTagPaymentIcon />, 
    title: __("Payment Data", 'quillbooking'), 
    description: __("Select one of Merge tags that related to your input.", 'quillbooking') 
  },
];

// Merge tags data by category
const MERGE_TAGS = {
  attendee: [
    { title: __("Guest First Name", "quillbooking"), value: "{{guest.first.name}}" },
    { title: __("Guest Last Name", "quillbooking"), value: "{{guest.last.name}}" },
    { title: __("Guest Full Name", "quillbooking"), value: "{{guest.full.name}}" },
    { title: __("Guest Email", "quillbooking"), value: "{{guest.email}}" },
    { title: __("Guest Note", "quillbooking"), value: "{{guest.note}}" },
    { title: __("Guest Main Phone Number (If Provided)", "quillbooking"), value: "{{booking.phone}}" },
  ],
  booking: [
    { title: __("Event Name", "quillbooking"), value: "{{booking.event_name}}" },
    { title: __("Event Description", "quillbooking"), value: "{{booking.description}}" },
    { title: __("Booking Title", "quillbooking"), value: "{{booking.booking_title}}" },
    { title: __("Additional Guests", "quillbooking"), value: "{{booking.additional_guests}}" },
    { title: __("Full Start Date Time (with guest timezone)", "quillbooking"), value: "{{booking.full_start_end_guest_timezone}}" },
    { title: __("Full Start Date Time (with host timezone)", "quillbooking"), value: "{{booking.full_start_end_host_timezone}}" },
    { title: __("Full Start & End Date Time (with guest timezone)", "quillbooking"), value: "{{booking.full_start_and_end_guest_timezone}}" },
    { title: __("Full Start & End Date Time (with host timezone)", "quillbooking"), value: "{{booking.full_start_and_end_host_timezone}}" },
    { title: __("Event Date Time (UTC)", "quillbooking"), value: "{{booking.start_date_time}}" },
    { title: __("Event Date Time (with guest timezone)", "quillbooking"), value: "{{booking.start_date_time_for_attendee}}" },
    { title: __("Event Date Time (with host timezone)", "quillbooking"), value: "{{booking.start_date_time_for_host}}" },
    { title: __("Event Date Time (with attendee timezone) (Ex: 2024-05-20)", "quillbooking"), value: "{{booking.start_date_time_for_attendee.format.Y-m-d}}" },
    { title: __("Event Date Time (with host timezone) (Ex: 2024-05-20)", "quillbooking"), value: "{{booking.start_date_time_for_host.format.Y-m-d}}" },
    { title: __("Event Location Details (HTML)", "quillbooking"), value: "{{booking.location_details_html}}" },
    { title: __("Event Cancel Reason", "quillbooking"), value: "{{booking.cancel_reason}}" },
    { title: __("Event Start Time (ex: 2 hours from now)", "quillbooking"), value: "{{booking.start_time_human_format}}" },
    { title: __("Booking Cancellation URL", "quillbooking"), value: "{{booking.cancelation_url}}" },
    { title: __("Booking Reschedule URL", "quillbooking"), value: "{{booking.reschedule_url}}" },
    { title: __("Booking Details Admin URL", "quillbooking"), value: "{{booking.admin_booking_url}}" },
    { title: __("Unique Booking Hash", "quillbooking"), value: "{{booking.booking_hash}}" },
    { title: __("Event Reschedule Reason", "quillbooking"), value: "{{booking.reschedule_reason}}" },
  ],
  host: [
    { title: __("Host Name", "quillbooking"), value: "{{host.name}}" },
    { title: __("Host Email", "quillbooking"), value: "{{host.email}}" },
    { title: __("Host Timezone", "quillbooking"), value: "{{host.timezone}}" },
  ],
  other: [
    { title: __("Event ID", "quillbooking"), value: "{{event.id}}" },
    { title: __("Calendar ID", "quillbooking"), value: "{{event.calendar_id}}" },
    { title: __("Event Title", "quillbooking"), value: "{{event.title}}" },
    { title: __("Calendar Title", "quillbooking"), value: "{{calendar.title}}" },
    { title: __("Calendar Description", "quillbooking"), value: "{{calendar.description}}" },
    { title: __("Add Booking to Calendar", "quillbooking"), value: "{{add_booking_to_calendar}}" },
  ],
  payment: [
    { title: __("Payment Total", "quillbooking"), value: "{{payment.payment_total}}" },
    { title: __("Payment Status", "quillbooking"), value: "{{payment.payment_status}}" },
    { title: __("Payment Method", "quillbooking"), value: "{{payment.payment_method}}" },
    { title: __("Currency", "quillbooking"), value: "{{payment.currency}}" },
    { title: __("Payment Date", "quillbooking"), value: "{{payment.payment_date}}" },
    { title: __("Payment Receipt (HTML)", "quillbooking"), value: "{{payment.receipt_html}}" },
  ]
};

interface MergeTagProps {
  onMentionClick: (mention: string, category: string) => void;
}

const MergeTagModal: React.FC<MergeTagProps> = ({ onMentionClick }) => {
  const [selectedKey, setSelectedKey] = useState("attendee");

  // Tag card component to reduce repetition
  const TagCard = ({ title, value, category }) => (
    <Card 
      onClick={() => onMentionClick(value, category)} 
      className="cursor-pointer"
    >
      <Flex vertical gap={3}>
        <span className="italic text-[#3F4254] text-[16px] font-semibold">{title}</span>
        <span className="text-[#505255] text-[12px] italic">{value}</span>
      </Flex>
    </Card>
  );

  return (
    <Flex gap={30}>
      {/* Categories sidebar */}
      <Card className="w-[450px]">
        <Flex vertical gap={10}>
          {DATA_CATEGORIES.map(({ key, icon, title, description }) => (
            <Flex 
              gap={10}
              className={`flex items-center border p-4 rounded-lg cursor-pointer ${
                selectedKey === key 
                  ? "border-color-primary bg-color-secondary" 
                  : "border-[#E4E4E4]"
              }`}
              key={key} 
              onClick={() => setSelectedKey(key)}
            >
              <div className={`rounded-lg p-2 ${
                selectedKey === key 
                  ? "bg-[#D5B0F4]" 
                  : "border border-color-secondary"
              }`}>
                {icon}
              </div>
              <div className='flex flex-col'>
                <span className='text-[#3F4254] text-[16px] font-semibold'>{title}</span>
                <span className={`text-[12px] font-[400] ${
                  selectedKey === key 
                    ? "text-[#505255]" 
                    : "text-[#9197A4]"
                }`}>
                  {description}
                </span>
              </div>
            </Flex>
          ))}
        </Flex>
      </Card>

      {/* Tags content */}
      <Card className="w-[450px]">
        <Flex vertical gap={15}>
          {MERGE_TAGS[selectedKey]?.map((tag, index) => (
            <TagCard 
              key={index}
              title={tag.title}
              value={tag.value}
              category={selectedKey}
            />
          )) || <div>{__("Select a category to see details.", "quillbooking")}</div>}
        </Flex>
      </Card>
    </Flex>
  );
};

export default MergeTagModal;