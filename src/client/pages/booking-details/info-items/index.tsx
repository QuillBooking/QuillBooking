/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { useCopyToClipboard } from '@quillbooking/hooks';
import { CopyWhiteIcon } from '@quillbooking/components';

interface InfoItemProps {
	icon: React.ReactNode;
	title: string;
	content: string | number | undefined;
	className?: string;
	link?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({
	icon,
	title,
	content,
	className,
	link = false,
}) => {
	const copyToClipboard = useCopyToClipboard();

	return (
		<div
			className={`flex gap-3 text-color-primary-text items-center ${className || ''}`}
		>
			<span>{icon}</span>
			<div>
				<p className="text-[#71717A] text-sm font-normal">{title}</p>
				{link == true ? (
					<div className="flex gap-1">
						<a
							target="__blank"
							href={content as string}
							className="text-[#09090B] text-lg leading-4 font-medium"
						>
							{content}
						</a>
						<span
							className="flex items-center gap-1 ml-2 text-color-primary cursor-pointer"
							onClick={() =>
								copyToClipboard(
									content as string,
									__('Event URL copied', 'quillbooking')
								)
							}
						>
							<CopyWhiteIcon width={16} height={16} />
							{__('Copy', 'quillbooking')}
						</span>
					</div>
				) : (
					<p className="text-[#09090B] text-lg leading-4 font-medium capitalize">
						{content}
					</p>
				)}
			</div>
		</div>
	);
};

export default InfoItem;
