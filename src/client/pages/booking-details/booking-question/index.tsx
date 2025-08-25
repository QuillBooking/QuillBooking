/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

import { Booking } from '@quillbooking/types';
import { CardHeader } from '@quillbooking/components';
import { QuestionIcon, QuestionOutlineIcon } from '@quillbooking/components';
import { useApi } from '@quillbooking/hooks';

interface BookingQuestionProps {
	booking: Booking;
}

type FieldItem = {
	[key: string]: string;
};

const BookingQuestion: React.FC<BookingQuestionProps> = ({ booking }) => {
	const [fields, setFields] = useState<FieldItem>({});
	const { callApi } = useApi();
	const [eventFields, setEventFields] = useState<FieldItem>({});

	const getEventFields = (eventId: number) => {
		callApi({
			path: `events/${eventId}/fields`,
			method: 'GET',
			onSuccess: (response) => {
				setEventFields({ ...response.custom, ...response.system });
			},
			onError: (error) => {
				console.error(error);
			},
		});
	};

	useEffect(() => {
		if (booking && booking.fields) {
			setFields(booking.fields);
			getEventFields(booking.event.id);
		}
	}, [booking]);

	if (Object.entries(fields).length === 0) return null;

	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5 max-h-[600px] overflow-y-auto">
			<CardHeader
				title={__('Booking Questions', 'quillbooking')}
				description={__(
					'Booking Questions From Booking Guest.',
					'quillbooking'
				)}
				icon={<QuestionOutlineIcon width={24} height={24} />}
			/>

			<div>
				{Object.entries(fields).map(([key, value], index) => (
					<div key={key || index} className="mb-6">
						<div className="flex gap-3 items-center pb-2">
							<QuestionIcon />
							<p className="text-xl text-color-primary-text font-medium">
								{typeof eventFields[key] === 'object' &&
								eventFields[key] !== null &&
								'label' in eventFields[key]
									? (eventFields[key] as { label: string })
											.label
									: key}
							</p>
						</div>
						<div>
							<p className="text-[#71717A] text-base pl-9">
								{value}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default BookingQuestion;
