import { Event } from '../../../../types';
import ClockIcon from '../../../../icons/clock-icon';
import LocationIcon from '../../../../icons/location-icon';
import './style.scss';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs'; // import dayjs
import { __ } from '@wordpress/i18n';
import CalendarIcon from '../../../../icons/calendar-icon';
import { PriceIcon } from '../../../../../components/icons';
import { get } from 'lodash';

interface EventDetailsProps {
	event: Event;
	setSelectedDuration: (duration: number) => void;
	selectedDuration: number;
	step: number;
	selectedDate: Dayjs | null;
	selectedTime: string | null; // time string like '14:30'
	booking?: any; // Optional booking data, if needed
}
interface PaymentItem {
	item: string;
	price: number;
}

const EventDetails: React.FC<EventDetailsProps> = ({
	event,
	setSelectedDuration,
	selectedDuration,
	step,
	selectedDate,
	selectedTime,
	booking, // Optional booking data, if needed
}) => {
	const isMultiDurations =
		event.additional_settings.allow_attendees_to_select_duration;

	let timeRangeText = '';
	if (selectedDate && selectedTime) {
		const time = dayjs(selectedTime, 'HH:mm'); // parse string
		const endTime = time.add(selectedDuration, 'minute');
		timeRangeText = `${time.format('HH:mm')} - ${endTime.format(
			'HH:mm'
		)}, ${selectedDate.format('dddd, MMMM DD, YYYY')}`;
	}
	// Get currency symbol based on currency code
	const getCurrencySymbol = (currencyCode: string) => {
		const symbols: { [key: string]: string } = {
			USD: '$',
			EUR: '€',
			GBP: '£',
			JPY: '¥',
			AUD: 'A$',
			CAD: 'C$',
			CHF: 'CHF',
			CNY: '¥',
			INR: '₹',
			BRL: 'R$',
		};
		return symbols[currencyCode] || currencyCode;
	};

	// Format price with currency symbol
	const formatPrice = (price: number, currencyCode: string) => {
		const symbol = getCurrencySymbol(currencyCode);
		return `${symbol}${price}`;
	};

	// Get price based on whether it's multi-duration or not
	const getPrice = () => {
		const paymentSettings = get(event, 'payments_settings', {});
		const isPaymentEnabled = get(paymentSettings, 'enable_payment', false);

		if (!isPaymentEnabled) return null;

		if (isMultiDurations) {
			const durationStr = selectedDuration.toString();
			return get(
				paymentSettings,
				['multi_duration_items', durationStr, 'price'],
				0
			);
		} else {
			const items = get(paymentSettings, 'items', []) as PaymentItem[];
			if (items.length > 0) {
				return items[0].price;
			}
		}

		return 0;
	};

	const price = getPrice();
	const currency = get(event, 'currency', 'USD');

	return (
		<div className="event-details-container">
			<h1 className="event-header">{event.name}</h1>
			<div className="event-details">
				<div className="detail-row">
					<ClockIcon width={20} height={20} />
					{isMultiDurations && step === 1 ? (
						<div className="event-duration-multi">
							{event.additional_settings.selectable_durations.map(
								(duration, index) => (
									<button
										key={index}
										onClick={() =>
											setSelectedDuration(duration)
										}
										className={`duration-btn ${selectedDuration === duration ? 'selected' : ''}`}
									>
										{duration} Minutes
									</button>
								)
							)}
						</div>
					) : (
						<p>
							{selectedDuration} {__('min', '@quillbooking')}
						</p>
					)}
				</div>
				{/* price */}
				{price !== null && price > 0 && (
					<div className="detail-row">
						<PriceIcon width={20} height={20} rectFill={false} />
						<p>{formatPrice(price, currency)}</p>
					</div>
				)}
				{/* location */}
				{event.location.length === 1 && (
					<div className="detail-row">
						<LocationIcon height={20} width={20} />
						<p>{event.location[0].type.split('_').join(' ')}</p>
					</div>
				)}

				{booking?.location && (
					<div className="detail-row">
						<LocationIcon height={20} width={20} />
						<p>
							{booking.location['label']}
							{[
								'online',
								'zoom',
								'ms-teams',
								'google-meet',
							].includes(booking.location['type']) ? (
								<>
									:{' '}
									<a
										href={booking.location['value']}
										target="_blank"
										rel="noopener noreferrer"
										className="link"
									>
										{booking.location['value']}
									</a>
								</>
							) : (
								<>: {booking.location['value']}</>
							)}
						</p>
					</div>
				)}

				{timeRangeText && (
					<div className="detail-row">
						<CalendarIcon height={20} width={20} />
						<p>{timeRangeText}</p>
					</div>
				)}
			</div>
			<p className="event-description">{event.description}</p>
		</div>
	);
};

export default EventDetails;
