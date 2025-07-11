/*
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Timeline } from 'antd';

/**
 * Internal dependencies
 */
import { Booking, NoticeMessage } from 'client/types';
import { CompletedCalendarIcon } from '@quillbooking/components';
import CardDetails from '../card-details';
import { BookingActions } from '@quillbooking/components';

/**
 * Main Bookings List Component.
 */
interface BookingListProps {
	bookings: Record<string, Booking[]>;
	period: string;
	onStatusUpdated: () => void;
	onNotice: (notice: NoticeMessage) => void;
}

const BookingList: React.FC<BookingListProps> = ({
	bookings,
	period,
	onStatusUpdated,
	onNotice,
}) => {
	return (
		<>
			{Object.entries(bookings).map(([dateLabel, bookings]) => {
				const [day, number] = dateLabel.split('-');
				return (
					<div
						className="flex gap-8 border-solid border border-[#DEE1E6] bottom-2 p-7 my-3 rounded-xl"
						key={dateLabel}
					>
						<div className="flex flex-col justify-center items-center bg-color-primary text-white rounded-2xl p-2 w-24 h-24">
							<span className="text-base">
								{day.charAt(0).toUpperCase() + day.slice(1)}
							</span>
							<span className="text-4xl font-bold">{number}</span>
						</div>

						<div className="w-full">
							{bookings.length > 1 && (
								<Timeline
									items={bookings.map((booking) => ({
										dot: (
											<CompletedCalendarIcon
												width={24}
												height={25}
											/>
										),
										color: '#953AE4',
										children: (
											<Flex
												justify="space-between"
												align="center"
												key={booking.id}
												className="border-b border-dashed border-[#DEE1E6] pb-8"
											>
												<CardDetails
													booking={booking}
													period={period}
												/>
												<BookingActions
													booking={booking}
													type="popover"
													onStatusUpdated={onStatusUpdated}
													onNotice={onNotice}
												/>
											</Flex>
										),
									}))}
								/>
							)}

							{bookings.length === 1 &&
								bookings.map((booking: Booking) => (
									<Flex
										justify="space-between"
										align="center"
										key={booking.id}
									>
										<CardDetails
											booking={booking}
											period={period}
										/>
										<BookingActions
											type="popover"
											booking={booking}
											onStatusUpdated={onStatusUpdated}
											onNotice={onNotice}
										/>
									</Flex>
								))}
						</div>
					</div>
				);
			})}
		</>
	);
};

export default BookingList;
