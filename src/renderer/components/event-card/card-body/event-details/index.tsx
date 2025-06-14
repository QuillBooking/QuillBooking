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
import { useEffect, useState } from 'react';
import { useApi } from '@quillbooking/hooks';
import { PaymentsSettings } from '../../../../../client/types';

interface EventDetailsProps {
	event: Event;
	setSelectedDuration: (duration: number) => void;
	selectedDuration: number;
	step: number;
	selectedDate: Dayjs | null;
	selectedTime: string | null; // time string like '14:30'
	booking?: any; // Optional booking data, if needed
	globalCurrency: string;
}

interface WooProductPrice {
	price: string;
	currency: string;
	product_id: number;
	product_name: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({
	event,
	setSelectedDuration,
	selectedDuration,
	step,
	selectedDate,
	selectedTime,
	booking, // Optional booking data, if needed
	globalCurrency,
}) => {
	const isMultiDurations =
		event.additional_settings.allow_attendees_to_select_duration;

	const [wooPrices, setWooPrices] = useState<{
		[key: string]: WooProductPrice | null;
	}>({});
	const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);
	const { callApi } = useApi();

	const isWooCommerceActive =
		(window as any).quillbooking?.config?.isWoocommerceActive || false;

	const getProductIdForDuration = (
		paymentSettings: PaymentsSettings,
		durationStr: string
	): number => {
		const multiDurationItems = paymentSettings.multi_duration_items;

		// If it's an object with duration keys (not an array)
		if (
			multiDurationItems &&
			typeof multiDurationItems === 'object' &&
			!Array.isArray(multiDurationItems)
		) {
			return get(multiDurationItems, [durationStr, 'woo_product'], 0);
		}

		// If it's an array of items
		if (Array.isArray(multiDurationItems)) {
			const item = multiDurationItems.find(
				(item) => item.duration === durationStr
			);
			return item?.woo_product || 0;
		}

		return 0;
	};

	// Helper function to get price from multi_duration_items regardless of format
	const getPriceForDuration = (
		paymentSettings: PaymentsSettings,
		durationStr: string
	): number => {
		const multiDurationItems = paymentSettings.multi_duration_items;

		// If it's an object with duration keys
		if (
			multiDurationItems &&
			typeof multiDurationItems === 'object' &&
			!Array.isArray(multiDurationItems)
		) {
			return get(multiDurationItems, [durationStr, 'price'], 0);
		}

		// If it's an array of items
		if (Array.isArray(multiDurationItems)) {
			const item = multiDurationItems.find(
				(item) => item.duration === durationStr
			);
			return item?.price || 0;
		}

		return 0;
	};

	useEffect(() => {
		// Check if the event uses WooCommerce for payments and if WooCommerce is active
		const paymentSettings = get(
			event,
			'payments_settings',
			{}
		) as PaymentsSettings;

		if (
			paymentSettings.enable_payment &&
			paymentSettings.type === 'woocommerce'
		) {
			if (!isWooCommerceActive) {
				setWooPrices({});
				return;
			}

			// For multi-duration events with different WooCommerce products
			if (
				isMultiDurations &&
				paymentSettings.enable_items_based_on_duration
			) {
				// We only need to fetch the price for the currently selected duration
				const durationStr = selectedDuration.toString();
				const productId = getProductIdForDuration(
					paymentSettings,
					durationStr
				);

				console.log(
					`Fetching price for selected duration ${durationStr} with product ID: ${productId}`
				);

				if (productId) {
					setIsLoadingPrices(true);
					callApi({
						path: `/quillbooking/v1/woocommerce/product-price/${event.id}?duration=${durationStr}`,
						method: 'GET',
						isCore: false, // Set isCore to false to use the full path
						onSuccess: (response) => {
							console.log(
								`Price response for duration ${durationStr}:`,
								response
							);
							setWooPrices((prev) => ({
								...prev,
								[durationStr]: response,
							}));
							setIsLoadingPrices(false);
						},
						onError: (error) => {
							console.error(
								`Error fetching WooCommerce price for duration ${durationStr}:`,
								error
							);
							setIsLoadingPrices(false);
						},
					});
				} else {
					// No product ID for this duration, use the default price
					console.log(
						`No product ID for duration ${durationStr}, using default price`
					);
					setIsLoadingPrices(false);
				}
			} else {
				// For single product events
				callApi({
					path: `/quillbooking/v1/woocommerce/product-price/${event.id}`,
					method: 'GET',
					onSuccess: (response) => {
						console.log('Single product price response:', response);
						setWooPrices({ default: response });
					},
					onError: (error) => {
						console.error(
							'Error fetching WooCommerce price:',
							error
						);
					},
					isCore: false, // Set isCore to false to use the full path
				});
			}
		}
	}, [event.id, selectedDuration, isWooCommerceActive]);

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
	const formatPrice = (price: number | undefined, currencyCode: string) => {
		if (price === undefined) return '';
		const symbol = getCurrencySymbol(currencyCode);
		return `${symbol}${price}`;
	};

	// Get price based on whether it's multi-duration, WooCommerce, or regular pricing
	const getPrice = () => {
		const paymentSettings = get(
			event,
			'payments_settings',
			{}
		) as PaymentsSettings;
		const isPaymentEnabled = paymentSettings.enable_payment;

		if (!isPaymentEnabled) return null;

		if (paymentSettings.type === 'woocommerce' && !isWooCommerceActive) {
			return null;
		}

		if (paymentSettings.type === 'woocommerce' && isWooCommerceActive) {
			if (
				isMultiDurations &&
				paymentSettings.enable_items_based_on_duration
			) {
				const durationStr = selectedDuration.toString();
				console.log(
					`Getting price for duration ${durationStr}`,
					wooPrices
				);

				// Check if we have a WooCommerce price for this duration
				const wooPrice = wooPrices[durationStr];
				if (wooPrice) {
					console.log(
						`Found WooCommerce price for duration ${durationStr}:`,
						wooPrice
					);
					return parseFloat(wooPrice.price);
				}

				// If we're loading the price, return null to show loading state
				if (isLoadingPrices) {
					return null;
				}

				// If we have a product ID but no price data yet, show loading
				const productId = getProductIdForDuration(
					paymentSettings,
					durationStr
				);
				if (productId) {
					// Try to fetch the price again
					console.log(
						`No price data yet for duration ${durationStr} with product ID ${productId}`
					);
					return null;
				}

				// Fall back to the configured price in the duration item if no WooCommerce product
				return getPriceForDuration(paymentSettings, durationStr);
			} else {
				// For single product
				const wooPrice = wooPrices.default;
				if (wooPrice) {
					return parseFloat(wooPrice.price);
				}

				// If we're loading the price, return null
				if (isLoadingPrices) {
					return null;
				}
			}

			return null;
		}

		// For non-WooCommerce payment methods, use standard pricing logic
		if (paymentSettings.type !== 'woocommerce') {
			if (
				isMultiDurations &&
				paymentSettings.enable_items_based_on_duration
			) {
				const durationStr = selectedDuration.toString();
				return getPriceForDuration(paymentSettings, durationStr);
			} else {
				const items = paymentSettings.items || [];
				if (items.length > 0) {
					return items[0].price || 0;
				}
			}
		}

		return 0;
	};

	const price = getPrice();
	// Get the appropriate currency based on the selected duration for WooCommerce
	const getCurrency = () => {
		const paymentSettings = get(
			event,
			'payments_settings',
			{}
		) as PaymentsSettings;

		// Only use WooCommerce currency if WooCommerce is active
		if (paymentSettings.type === 'woocommerce' && isWooCommerceActive) {
			if (
				isMultiDurations &&
				paymentSettings.enable_items_based_on_duration
			) {
				const durationStr = selectedDuration.toString();
				const wooPrice = wooPrices[durationStr];
				if (wooPrice) {
					return wooPrice.currency;
				}
			} else {
				const wooPrice = wooPrices.default;
				if (wooPrice) {
					return wooPrice.currency;
				}
			}
		}

		// For non-WooCommerce payment methods or if WooCommerce price not found
		return get(event, 'currency', globalCurrency);
	};

	const currency = getCurrency();

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
										{duration} {__('min', '@quillbooking')}
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
				{isLoadingPrices ? (
					<div className="detail-row">
						<PriceIcon width={20} height={20} rectFill={false} />
						<p>{__('Loading price...', '@quillbooking')}</p>
					</div>
				) : price !== null &&
				  price > 0 &&
				  event.payments_settings?.enable_payment &&
				  (window as any).quillbooking?.pro_active === true ? (
					<div className="detail-row">
						<PriceIcon width={20} height={20} rectFill={false} />
						<p>{formatPrice(price, currency)}</p>
					</div>
				) : null}
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
