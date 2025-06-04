import ConfigAPI from '@quillbooking/config';
import { __ } from '@wordpress/i18n';
import { CopyWhiteIcon } from '../icons';
import { useCopyToClipboard } from '@quillbooking/hooks';

const EventUrl: React.FC<{
	calendarSlug: string;
	eventSlug: string;
	className?: string;
}> = ({ calendarSlug, eventSlug, className }) => {
	const copyToClipboard = useCopyToClipboard();
	const siteUrl = ConfigAPI.getSiteUrl();
	const url = `${siteUrl}?quillbooking_calendar=${calendarSlug}&event=${eventSlug}`;
	return (
		<>
			<a target="_blank" href={url} className={`${className || ''}`}>
				{__('Event URL', 'quillbooking')}
			</a>
			<span
				className="flex items-center gap-1 ml-1 text-color-primary cursor-pointer flex-shrink-0 text-sm"
				onClick={() =>
					copyToClipboard(url, __('Event URL copied', 'quillbooking'))
				}
			>
				<CopyWhiteIcon width={14} height={14} />
				{__('Copy', 'quillbooking')}
			</span>
		</>
	);
};

export default EventUrl;
