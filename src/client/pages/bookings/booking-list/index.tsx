import { Divider, List } from 'antd';
import { Booking } from 'client/types';

interface BookingListProps {
  bookings: Record<string, Booking[]>;
}

const BookingList: React.FC<BookingListProps> = ({ bookings }) => {
  console.log(bookings);
  return (
    <>
    {Object.entries(bookings).map(([groupKey, groupBookings]) => (
      <div key={groupKey}>
        <Divider orientation="left">{groupKey}</Divider>
        <List
          itemLayout="horizontal"
          dataSource={groupBookings}
          renderItem={(booking) => (
            <List.Item key={booking.id}>
              <List.Item.Meta
                title={`Booking ID: ${booking.id}`}
                description={`Time: ${booking.time_span}`}
              />
            </List.Item>
          )}
        />
      </div>
    ))}
  </>
  );
};

export default BookingList;