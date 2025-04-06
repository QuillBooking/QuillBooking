/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

import { Booking } from 'client/types';
import CardHeader from '../card-header';
import { QuestionIcon, QuestionOutlineIcon } from '@quillbooking/components';

interface BookingQuestionProps {
	booking: Booking;
}

type FieldItem = {
	label: string;
	value: string;
};

const BookingQuestion: React.FC<BookingQuestionProps> = ({ booking }) => {
	const [fields, setFields] = useState<FieldItem[]>([]);

	useEffect(() => {
		if (booking && booking.fields) setFields(booking.fields);
	}, [booking]);
	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5">
			<CardHeader
				title={__('Booking Questions', 'quillbooking')}
				description={__(
					'Booking Questions From Booking Guest.',
					'quillbooking'
				)}
				icon={<QuestionOutlineIcon width={24} height={24} />}
			/>

			<div>
				{fields.map((field: FieldItem, index) => (
					<div key={index}>
						<div className="flex gap-3 items-center pb-2">
							<QuestionIcon />
							<p className="text-xl text-color-primary-text font-medium">
								{field.label}
							</p>
						</div>
						<div>
							<p className="text-[#71717A] text-base pl-9">
								{field.value}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default BookingQuestion;
