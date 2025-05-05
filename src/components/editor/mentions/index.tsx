import React, { useState } from "react";
import { __ } from "@wordpress/i18n";
import { Card, Flex } from "antd";
import { 
  MergeTagAttIcon, 
  MergeTagBookingIcon, 
  MergeTagOtherIcon, 
  MergeTagPaymentIcon 
} from "@quillbooking/components";


// Category definitions
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

// Merge tag data organized by category
const MERGE_TAGS = {
  attendee: [
    { 
      title: __("Guest First Name", "quillbooking"), 
      displayName: "Guest First Name",
      tag: "{{guest.first.name}}" 
    },
    { 
      title: __("Guest Last Name", "quillbooking"), 
      displayName: "Guest Last Name",
      tag: "{{guest.last.name}}" 
    },
    { 
      title: __("Guest Full Name", "quillbooking"), 
      displayName: "Guest Full Name",
      tag: "{{guest.full.name}}" 
    },
    { 
      title: __("Guest Email", "quillbooking"), 
      displayName: "Guest Email",
      tag: "{{guest.email}}" 
    },
    { 
      title: __("Guest Note", "quillbooking"), 
      displayName: "Guest Note",
      tag: "{{guest.note}}" 
    },
    { 
      title: __("Guest Main Phone Number (If Provided)", "quillbooking"), 
      displayName: "Guest Main Phone Number",
      tag: "{{booking.phone}}" 
    },
  ],
  booking: [
    { 
      title: __("Event Name", "quillbooking"), 
      displayName: "Event Name",
      tag: "{{booking.event_name}}" 
    },
    { 
      title: __("Event Description", "quillbooking"), 
      displayName: "Event Description",
      tag: "{{booking.description}}" 
    },
    { 
      title: __("Booking Title", "quillbooking"), 
      displayName: "Booking Title",
      tag: "{{booking.booking_title}}" 
    },
    { 
      title: __("Additional Guests", "quillbooking"), 
      displayName: "Additional Guests",
      tag: "{{booking.additional_guests}}" 
    },
    { 
      title: __("Full Start Date Time (with guest timezone)", "quillbooking"), 
      displayName: "Full Start Date Time (with guest timezone)",
      tag: "{{booking.full_start_end_guest_timezone}}" 
    },
    { 
      title: __("Full Start Date Time (with host timezone)", "quillbooking"), 
      displayName: "Full Start Date Time (with host timezone)",
      tag: "{{booking.full_start_end_host_timezone}}" 
    },
    { 
      title: __("Full Start & End Date Time (with guest timezone))", "quillbooking"), 
      displayName: "Full Start & End Date Time (with guest timezone)",
      tag: "{{booking.full_start_and_end_host_timezone}}" 
    },
    { 
      title: __("Full Start & End Date Time (with host timezone))", "quillbooking"), 
      displayName: "Full Start & End Date Time (with host timezone)",
      tag: "{{booking.full_start_and_end_host_timezone}}" 
    },
    { 
      title: __("Event Date Time (UTC)", "quillbooking"), 
      displayName: "Event Date Time (UTC)",
      tag: "{{booking.start_date_time}}" 
    },
    { 
      title: __("Event Date Time (with guest timezone)", "quillbooking"), 
      displayName: "Event Date Time (with guest timezone)",
      tag: "{{booking.start_date_time_for_attendee}}" 
    },
    { 
      title: __("Event Date Time (with host timezone)", "quillbooking"), 
      displayName: "Event Date Time (with host timezone)",
      tag: "{{booking.start_date_time_for_host}}" 
    },
    { 
      title: __("Event Date Time (with attendee timezone) (Ex: 2024-05-20)", "quillbooking"), 
      displayName: "Event Date Time (with attendee timezone)",
      tag: "{{booking.start_date_time_for_attendee.format.Y-m-d}}" 
    },
    { 
      title: __("Event Date Time (with host timezone) (Ex: 2024-05-20)", "quillbooking"), 
      displayName: "Event Date Time (with host timezone)",
      tag: "{{booking.start_date_time_for_host.format.Y-m-d}}" 
    },
    { 
      title: __("Event Location Deatils (HTML)", "quillbooking"), 
      displayName: "Event Location Deatils (HTML)",
      tag: "{{booking.location_details_html}}" 
    },
    { 
      title: __("Event Cancel Reason", "quillbooking"), 
      displayName: "Event Cancel Reason",
      tag: "{{booking.cancel_reason}}" 
    },
    { 
      title: __("Event Start Time (ex: 2 hours from now)", "quillbooking"), 
      displayName: "Event Start Time",
      tag: "{{booking.start_time_human_format}}" 
    },
    { 
      title: __("Booking Cancellation URL", "quillbooking"), 
      displayName: "Booking Cancellation URL",
      tag: "{{booking.cancelation_url}}" 
    },
    { 
      title: __("Booking Reschedule URL", "quillbooking"), 
      displayName: "Booking Reschedule URL",
      tag: "{{booking.reschedule_url}}" 
    },
    { 
      title: __("Booking Details Admin URL", "quillbooking"), 
      displayName: "Booking Details Admin URL",
      tag: "{{booking.admin_booking_url}}" 
    },
    { 
      title: __("Unique Booking Hash", "quillbooking"), 
      displayName: "Unique Booking Hash",
      tag: "{{booking.booking_hash}}" 
    },
    { 
      title: __("Event Reschedule Reason", "quillbooking"), 
      displayName: "Event Reschedule Reason",
      tag: "{{booking.reschedule_reason}}" 
    },
  ],
  host: [
    { 
      title: __("Host Name", "quillbooking"), 
      displayName: "Host Name",
      tag: "{{host.name}}" 
    },
    { 
      title: __("Host Email", "quillbooking"), 
      displayName: "Host Email",
      tag: "{{host.email}}" 
    },
    { 
      title: __("Host Timezone", "quillbooking"), 
      displayName: "Host Timezone",
      tag: "{{host.timezone}}" 
    },
  ],
  other: [
    { 
      title: __("Event ID", "quillbooking"), 
      displayName: "Event ID",
      tag: "{{event.id}}" 
    },
    { 
      title: __("Calendar ID", "quillbooking"), 
      displayName: "Calendar ID",
      tag: "{{event.calendar_id}}" 
    },
    { 
      title: __("Event Title", "quillbooking"), 
      displayName: "Event Title",
      tag: "{{event.title}}" 
    },
    { 
      title: __("Calendar Title", "quillbooking"), 
      displayName: "Calendar Title",
      tag: "{{calendar.title}}" 
    },
    { 
      title: __("Calendar Description", "quillbooking"), 
      displayName: "Calendar Description",
      tag: "{{calendar.description}}" 
    },
    { 
      title: __("Add Booking to Calendar", "quillbooking"), 
      displayName: "Add Booking to Calendar",
      tag: "{{add_booking_to_calendar}}" 
    },
  ],
  payment: [
    { 
      title: __("Payment Total", "quillbooking"), 
      displayName: "Payment Total",
      tag: "{{payment.payment_total}}" 
    },
    { 
      title: __("Payment Status", "quillbooking"), 
      displayName: "Payment Status",
      tag: "{{payment.payment_status}}" 
    },
    { 
      title: __("Payment Method", "quillbooking"), 
      displayName: "Payment Method",
      tag: "{{payment.payment_method}}" 
    },
    { 
      title: __("Currency", "quillbooking"), 
      displayName: "Currency",
      tag: "{{payment.currency}}" 
    },
    { 
      title: __("Payment Date", "quillbooking"), 
      displayName: "Payment Date",
      tag: "{{payment.payment_date}}" 
    },
    { 
      title: __("Payment Receipt (HTML)", "quillbooking"), 
      displayName: "Payment Receipt (HTML)",
      tag: "{{payment.receipt_html}}" 
    },
  ],
};

interface MentionsProps {
  onMentionClick: (mention: string, category: string) => void;
}

const Mentions: React.FC<MentionsProps> = ({ onMentionClick }) => {
  const [selectedKey, setSelectedKey] = useState("attendee");

  // Reusable tag card component
  const TagCard = ({ title, tag, displayName, category }) => (
    <Card 
      onClick={() => onMentionClick(displayName, category)} 
      className="cursor-pointer"
    >
      <Flex vertical gap={3}>
        <span className="italic text-[#3F4254] text-[16px] font-semibold">{title}</span>
        <span className="text-[#505255] text-[12px] italic">{tag}</span>
      </Flex>
    </Card>
  );

  return (
    <Flex gap={30}>
      {/* Category sidebar */}
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

      {/* Tags content area */}
      <Card className="w-[450px]">
        <Flex vertical gap={15}>
          {MERGE_TAGS[selectedKey]?.map((tag, index) => (
            <TagCard 
              key={index}
              title={tag.title}
              tag={tag.tag}
              displayName={tag.displayName}
              category={selectedKey}
            />
          )) || <div>{__("Select a category to see details.", "quillbooking")}</div>}
        </Flex>
      </Card>
    </Flex>
  );
};

export default Mentions;