/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { PlusOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { Button, Flex, Segmented, Typography } from 'antd';
import AddAvailabilitySechduleModal from './add-schedule-modal';
import AvailabilityList from './availability-list';
import { ClockIcon, Header } from '../../../components';

/**
 * Main Calendars Component.
 */
const Availability: React.FC = () => {
	const [open, setOpen] = useState<boolean>(false);
	const [isFiltered, setIsFiltered] = useState<boolean>(false);
	return (
		<>
			<Flex justify="space-between" align="center">
				<Header
					header={__('Availability', 'quillbooking')}
					subHeader={__(
						'Configure times when you are available for bookings.',
						'quillbooking'
					)}
				/>

				<Button
					className="px-8"
					type="primary"
					icon={<PlusOutlined />}
					size="middle"
					onClick={() => {
						setOpen(true);
					}}
				>
					{__('Add New', 'quillbooking')}
				</Button>
			</Flex>

			<div className="my-4 p-4 rounded-md border border-gray-200">
				<Flex align="center" gap={10}>
					<div className='text-color-primary' >
						<ClockIcon />
						<p>{__('All Schedule', 'quillbooking')}</p>
					</div>
					<div>
						<ClockIcon />
						<p>{__('My Schedule', 'quillbooking')}</p>
					</div>
						{/* onChange={() => {
							setIsFiltered((prev) => !prev);
						}}
					/> */}
				</Flex>
			</div>

			<AvailabilityList isFiltered={isFiltered} />

			{open && (
				<AddAvailabilitySechduleModal
					open={open}
					onClose={() => setOpen(false)}
					onSaved={() => setOpen(false)}
				/>
			)}
		</>
	);
};

export default Availability;
