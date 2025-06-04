/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { useCopyToClipboard } from '@quillbooking/hooks';
import { CopyWhiteIcon } from '@quillbooking/components';

interface InfoItemProps {
	icon: React.ReactNode;
	title: string;
	content: string | number | React.ReactNode | undefined;
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
				<p className="text-[#09090B] text-lg leading-4 font-medium capitalize flex">
					{content}
				</p>
			</div>
		</div>
	);
};

export default InfoItem;
