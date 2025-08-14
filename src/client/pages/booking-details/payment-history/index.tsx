/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/*
 * External dependencies
 */
import { Flex } from 'antd';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/types';
import { CardHeader, PaymentHistoryIcon } from '@quillbooking/components';

/*
 * Main Meeting Information Component
 */
interface PaymentHistoryProps {
	booking: Booking;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ booking }) => {
	if (booking.order === undefined || booking.order === null) {
		return;
	}
	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5">
			<CardHeader
				title={__('Payment History', 'quillbooking')}
				description={__(
					'your payment history and transaction details.',
					'quillbooking'
				)}
				icon={<PaymentHistoryIcon />}
			/>
			<Flex vertical gap={10} className="pb-4 border-b mb-4">
				<Flex
					justify="space-between"
					align="center"
					className="text-[#09090B] font-medium text-[18px]"
				>
					<div>{booking?.order?.updated_at}</div>
				</Flex>
				<Flex
					align="flex-start"
					className="text-[#71717A] text-base gap-48"
				>
					<Flex vertical>
						<div>
							{__(
								`Payment Total: ${booking?.order?.total}`,
								'quillbooking'
							)}
						</div>
						<div>
							{__(
								`Payment Method: ${booking?.order?.payment_method}`,
								'quillbooking'
							)}
						</div>
					</Flex>
					<Flex vertical>
						<div>
							{__(
								`Payment Status: ${booking?.order?.status}`,
								'quillbooking'
							)}
						</div>
						<div>
							{__(
								`Transaction ID: ${booking?.order?.transaction_id}`,
								'quillbooking'
							)}
						</div>
					</Flex>
				</Flex>
			</Flex>
			<div className="">
				<table className="w-full text-left text-gray-700">
					<thead className="bg-[#F3F4F6] text-[#09090B] font-medium">
						<tr>
							<th className="pl-5 pr-4 py-5 w-2/3">
								{__('Name', 'quillbooking')}
							</th>
							<th className="pl-2 py-5 w-1/3">
								{__('Price', 'quillbooking')}
							</th>
						</tr>
					</thead>
					<tbody>
						{booking?.order?.items?.map((item, index) => (
							<tr key={index} className="bg-white">
								<td className="py-4 pl-5 pr-4 w-2/3">
									{item.item}
								</td>
								<td className="pl-2 py-5 w-1/3 flex">
									{booking?.order?.currency} {item.price}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* Total aligned to the right under the Price column */}
				<div className="flex justify-end mt-2">
					<div className="w-2/5 text-right pl-1 pr-56 flex">
						<span className="text-gray-700 mr-8">Total</span>
						<span className="font-medium text-[#0EAD69] flex">
							{booking?.order?.currency} {booking?.order?.total}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PaymentHistory;
