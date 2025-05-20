/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/*
 * External dependencies
 */
import { Flex, Table, TableColumnsType } from 'antd';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/client';
import {
	CardHeader,
	PaymentHistoryIcon
} from '@quillbooking/components';

/*
 * Main Meeting Information Component
 */
interface PaymentHistoryProps {
	booking: Booking;
}

interface DataType {
	key: string;
	name: string;
	quantity: number;
	price: number;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ booking }) => {
	const columns: TableColumnsType<DataType> = [
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
			width: '40%',
		},
		{
			title: 'Quantity',
			dataIndex: 'quantity',
			key: 'quantity',
			width: '30%',
			align: 'center',
		},
		{
			title: 'Price',
			dataIndex: 'price',
			key: 'price',
			width: '30%',
			align: 'right',
			render: (text) => `$ ${text}`,
		},
	];

	const data: DataType[] = [
		{
			key: '1',
			name: 'Booking Fee',
			quantity: 1,
			price: 100,
		},
	];

	// Define the footer to display the total
	const footer = () => (
		<div className="flex justify-between">
			<div className="font-medium">Total</div>
			<div className="text-green-500 font-medium">$ 100</div>
		</div>
	);

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
			<Flex vertical gap={10} className='pb-4 border-b mb-4'>
				<Flex justify='space-between' align='center' className='text-[#09090B] font-medium text-[18px]'>
					<div>Feb 12, 2025</div>
					<div>Invoice (#004b5)</div>
				</Flex>
				<Flex align='flex-start' className='text-[#71717A] text-base gap-48'>
					<Flex vertical>
						<div>{__('Payment Total: $100', 'quillbooking')}</div>
						<div>{__('Payment Method: Stripe', 'quillbooking')}</div>
						<div>{__('Payment Status: Paid', 'quillbooking')}</div>
					</Flex>
					<Flex vertical>
						<div>{__('Ordered By: Omar Adel | omar.adel2025@gmail.com', 'quillbooking')}</div>
						<div>{__('Transaction ID: v=CqJ7nCioctw&ab_c', 'quillbooking')}</div>
					</Flex>
				</Flex>
			</Flex>
			<div className="">
				<table className="w-full text-left text-gray-700">
					<thead className="bg-[#F3F4F6] text-[#09090B] font-medium">
						<tr>
							<th className="pl-5 pr-4 py-5 w-1/5">{__("Name", "quillbooking")}</th>
							<th className="px-4 py-5 text-center w-2/5">{__("Quantity", "quillbooking")}</th>
							<th className="pl-1 pr-60 py-5 text-right w-2/5">{__("Price", "quillbooking")}</th>
						</tr>
					</thead>
					<tbody>
						<tr className="bg-white">
							<td className="py-4 pl-5 pr-4 w-1/5">Booking Fee</td>
							<td className="p-4 text-center w-2/5">1</td>
							<td className="pl-1 pr-60 text-right w-2/5">$100</td>
						</tr>
					</tbody>
				</table>

				{/* Total aligned to the right under the Price column */}
				<div className="flex justify-end mt-2">
					<div className="w-2/5 text-right pl-1 pr-60">
						<span className="text-gray-700 mr-8">Total</span>
						<span className="font-medium text-[#0EAD69]">$100</span>
					</div>
				</div>
			</div>


		</div>
	);
};

export default PaymentHistory;
