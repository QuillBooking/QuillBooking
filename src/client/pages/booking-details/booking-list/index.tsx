/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/types';
import { CardHeader } from '@quillbooking/components';
import { LatestCalendarIcon } from '@quillbooking/components';

/*
 * Main Booking List Component (Details Page)
 */
interface BookingListProps {
	bookings: Booking[];
	days: {
		weekday: string;
		dayOfMonth: string;
		month: number;
		year: number;
	}[];
	selectedDate: number;
	setSelectedDate: (date: number) => void;
	setBookingId: (id: string | number) => void;
}
const BookingList: React.FC<BookingListProps> = ({
	bookings,
	days,
	setSelectedDate,
	selectedDate,
	setBookingId,
}) => {
	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5 max-h-[500px] overflow-y-auto">
			<CardHeader
				title={__('Upcoming Booking', 'quillbooking')}
				description={__(
					'Timeline about all Booking Activities',
					'quillbooking'
				)}
				icon={<LatestCalendarIcon width={24} height={24} />}
			/>
			<div className="flex justify-between items-center">
				{days.map((day, index) => (
					<div
						className={`flex flex-col text-center cursor-pointer ${index == selectedDate ? 'bg-color-primary rounded-full px-3 py-4 text-white' : ''}`}
						key={day.dayOfMonth}
						onClick={() => setSelectedDate(index)}
					>
						<p>{day.weekday}</p>
						<p
							className={`font-semibold text-[#3F4254] text-base ${index == selectedDate ? 'text-white' : ''}`}
						>
							{day.dayOfMonth}
						</p>
					</div>
				))}
			</div>

			<div>
				{bookings.length > 0 &&
					bookings.map((booking) => {
						const eventTitle =
							booking.booking_title || booking.event?.name || '';
						return (
							<div className="flex justify-between items-center my-4">
								<div className="flex gap-2 font-semibold">
									<div className="border-2 'border-[#A5E0B5]' rounded-3xl"></div>
									<div>
										<p>{booking.time_span}</p>
										<p className="text-[#3F4254]">
											{eventTitle}
										</p>
										<p>
											{__('Hosted by')}{' '}
											<span className="text-color-primary">
												{
													booking.calendar?.user
														?.display_name
												}{' '}
											</span>
										</p>
									</div>
								</div>

								<div
									className="px-4 py-2 bg-[#F1F1F2] rounded-md text-[#5E6278] cursor-pointer"
									onClick={() => setBookingId(booking.id)}
								>
									{__('View', 'quillbooking')}
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default BookingList;
