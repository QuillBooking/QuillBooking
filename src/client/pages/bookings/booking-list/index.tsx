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
import { Booking } from 'client/types';
import { CompletedCalendarIcon } from '@quillbooking/components';
import CardDetails from '../card-details';
import { NavLink as Link } from '@quillbooking/navigation';
import BookingActions from './booking-actions';

/**
 * Main Bookings List Component.
 */
interface BookingListProps {
	bookings: Record<string, Booking[]>;
	period: string;
	onStatusUpdated: () => void;
}

const BookingList: React.FC<BookingListProps> = ({
	bookings,
	period,
	onStatusUpdated,
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
								<Timeline>
									{bookings.map((booking) => (
										<Timeline.Item
											dot={
												<CompletedCalendarIcon
													width={24}
													height={25}
												/>
											}
											key={booking.id}
											color="#953AE4"
										>
											<Flex
												justify="space-between"
												align="center"
												key={booking.id}
												className="border-b border-dashed border-[#DEE1E6] pb-8"
											>
												<Link
													to={`bookings/${booking.id}/${period}`}
												>
													<CardDetails
														booking={booking}
													/>
												</Link>
												<BookingActions
													booking={booking}
													onStatusUpdated={
														onStatusUpdated
													}
												/>
											</Flex>
										</Timeline.Item>
									))}
								</Timeline>
							)}

							{bookings.length === 1 &&
								bookings.map((booking: Booking) => (
									<Flex
										justify="space-between"
										align="center"
										key={booking.id}
									>
										<Link
											to={`bookings/${booking.id}/${period}`}
										>
											<CardDetails booking={booking} />
										</Link>
										<BookingActions
											booking={booking}
											onStatusUpdated={onStatusUpdated}
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
