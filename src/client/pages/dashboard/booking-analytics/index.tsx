/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Card, Flex } from 'antd';
import { ShimmerThumbnail } from 'react-shimmer-effects';

/**
 * Internal dependencies
 */
import {
	AllCalendarIcon,
	CalendarNoshowIcon,
	CancelledCalendarIcon,
	CompletedCalendarIcon,
	PendingCalendarIcon,
	UpcomingCalendarIcon,
} from '@quillbooking/components';
import './style.scss';
import { useApi } from '@quillbooking/hooks';
import StateCard from './state-card';

const BookingAnalytics: React.FC<{ canManageAllCalendars: boolean }> = ({
	canManageAllCalendars,
}) => {
	const [counts, setCounts] = useState({
		total: 0,
		upcoming: 0,
		completed: 0,
		pending: 0,
		cancelled: 0,
		no_show: 0,
	});
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const { callApi } = useApi();

	useEffect(() => {
		fetchBookingCounts();
	}, []);

	const fetchBookingCounts = () => {
		setLoading(true);
		callApi({
			path: addQueryArgs('bookings/counts', {
				user: canManageAllCalendars ? 'all' : 'own',
			}),
			method: 'GET',
			onSuccess: (res) => {
				setCounts({
					total: res.total ?? 0,
					upcoming: res.upcoming ?? 0,
					completed: res.completed ?? 0,
					pending: res.pending_ ?? 0,
					cancelled: res.cancelled ?? 0,
					no_show: res.noshow ?? 0,
				});
				setError(null);
				setLoading(false);
			},
			onError: () => {
				console.error('Error fetching booking counts');
				setError(
					__('Failed to load booking statistics', 'quillbooking')
				);
				setLoading(false);
			},
		});
	};

	return (
		<Card className="h-[570px] relative p-0 rounded-xl booking-analytics">
			<div className="font-semibold h-[285px] pt-16 pl-8 bg-gradient-to-r from-color-primary to-[#C497EC] relative rounded-xl">
				<div className="absolute top-0 right-0">
					<svg
						width="221"
						height="227"
						viewBox="0 0 221 227"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M95.7198 -51.3882C103.315 -52.9164 111.187 -53.75 119.245 -53.75C184.82 -53.75 237.983 -0.586472 237.983 64.9881C237.983 85.5033 233.399 104.212 222.655 124.311C226.869 135.796 230.713 148.068 233.074 163.165C233.074 163.165 220.617 131.165 203.807 115.466C211.263 102.128 215.569 86.7536 215.569 70.4063C215.569 19.3267 174.168 -22.0742 123.089 -22.0742C104.982 -22.0742 88.0324 -16.7486 73.6764 -7.67186C47.604 8.86071 30.2379 37.8969 30.5621 70.4063C31.2567 131.396 75.1583 156.589 96.646 166.267C109.659 171.825 126.933 177.567 155.645 178.03C144.16 181.735 131.934 183.772 119.245 183.772C53.6706 183.772 0.50708 130.609 0.50708 64.9881C0.50708 7.47142 41.3986 -40.5054 95.7198 -51.3882Z"
							fill="#bd88ec"
						/>
						<path
							d="M250.552 226.835C236.335 199.929 210.402 172.652 185.302 172.652C121.163 172.652 92.1268 150.609 92.1268 150.609C134.361 160.473 145.337 144.172 145.337 144.172C53.4582 152.785 48.7346 90.4988 48.7346 90.4988C57.6261 112.542 79.5769 119.303 79.5769 119.303C32.4799 60.3512 71.1948 13.0227 71.1948 13.0227C52.5783 73.2253 94.0718 114.534 150.709 130.186C214.199 149.266 240.086 192.01 250.552 226.835ZM155.942 72.3454C155.942 72.3454 161.082 93.0458 203.224 128.241C231.334 151.72 244.902 199.743 244.902 199.743C210.078 133.798 177.059 135.049 122.784 110.875C55.079 80.6811 76.3815 6.40039 76.3815 6.40039C76.3815 6.40039 84.9951 67.6681 115.791 83.645C115.791 83.645 109.91 63.0371 116.347 42.6146C116.347 42.6146 116.717 81.4684 160.758 107.263C160.758 107.263 148.949 88.2759 155.942 72.3454Z"
							fill="#bd88ec"
						/>
					</svg>
				</div>
				<div className="text-2xl text-white">
					{__('Booking Analytics', 'quillbooking')}
				</div>
				<div className="text-base text-[#E1E3EA] relative">
					{__(
						'Statistics and analysis for this month',
						'quillbooking'
					)}
				</div>
				<div className="border-[#F9F9F9] border-2 w-[58px] mt-1 ml-[75px]"></div>
			</div>
			<Flex
				vertical
				gap={16}
				className="absolute top-44 left-0 right-0 px-6"
			>
				{loading ? (
					<>
						<Flex gap={16} justify="center" className="w-full">
							{[1, 2, 3].map((i) => (
								<div key={`top-${i}`} className="w-full">
									<ShimmerThumbnail
										height={120}
										className="rounded-xl"
									/>
								</div>
							))}
						</Flex>
						<Flex gap={16} justify="center" className="w-full">
							{[1, 2, 3].map((i) => (
								<div key={`bottom-${i}`} className="w-full">
									<ShimmerThumbnail
										height={120}
										className="rounded-xl"
									/>
								</div>
							))}
						</Flex>
					</>
				) : (
					<>
						<Flex gap={16} justify="center" className="w-full">
							<StateCard
								icon={
									<AllCalendarIcon width={24} height={24} />
								}
								count={counts.total}
								label={__('Total Bookings', 'quillbooking')}
							/>
							<StateCard
								icon={
									<UpcomingCalendarIcon
										width={24}
										height={24}
									/>
								}
								count={counts.upcoming}
								label={__('Upcoming', 'quillbooking')}
							/>
							<StateCard
								icon={
									<CompletedCalendarIcon
										width={24}
										height={24}
									/>
								}
								count={counts.completed}
								label={__('Completed', 'quillbooking')}
							/>
						</Flex>
						<Flex gap={16} justify="center" className="w-full">
							<StateCard
								icon={
									<PendingCalendarIcon
										width={24}
										height={24}
									/>
								}
								count={counts.pending}
								label={__('Pending', 'quillbooking')}
							/>
							<StateCard
								icon={
									<CancelledCalendarIcon
										width={24}
										height={24}
									/>
								}
								count={counts.cancelled}
								label={__('Cancelled', 'quillbooking')}
							/>
							<StateCard
								icon={
									<CalendarNoshowIcon
										width={24}
										height={24}
									/>
								}
								count={counts.no_show}
								label={__('No Show', 'quillbooking')}
							/>
						</Flex>
					</>
				)}
			</Flex>
		</Card>
	);
};

export default BookingAnalytics;
