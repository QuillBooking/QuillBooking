/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { PlusOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { Button, Flex, Segmented } from 'antd';
import AddAvailabilitySechduleModal from './add-availability-schedule-modal';
import AvailabilityList from './availability-list';

/**
 * Main Calendars Component.
 */
const Availability: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	return (
		<>
			<Flex justify="space-between" align="center">
				<div>
					<h1>{__('Availability', 'quillbooking')}</h1>
					<p>
						{__(
							'Configure times when you are available for bookings.',
							'quillbooking'
						)}
					</p>
				</div>

				<Flex justify="space-between" align="center" gap={10}>
					<Segmented<string>
						options={[
							__('My Schedule', 'quillbooking'),
							__('All Schedule', 'quillbooking'),
						]}
						onChange={(value) => {
							console.log(value);
						}}
					/>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						size="large"
						onClick={() => {
							setOpen(true);
						}}
					>
						{__('Add New', 'quillbooking')}
					</Button>
				</Flex>
			</Flex>

			<AvailabilityList />

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
