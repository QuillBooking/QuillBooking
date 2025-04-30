import { __ } from '@wordpress/i18n';

interface CardHeaderProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	inviteeNumber?: number;
	border?: boolean;
	[key: string]: any;
}

// TODO: add inviteeNumber prop to display the number of invitees
const CardHeader: React.FC<CardHeaderProps> = ({
	title,
	description,
	icon,
	inviteeNumber,
	border = true,
	...rest
}) => {
	return (
		<div
			className={`flex items-center gap-4 p-0 text-color-primary-text ${border ? 'border-b' : ''} pb-5`}
			{...rest}
		>
			{icon && <span className="bg-[#EDEDED] p-2 rounded">{icon}</span>}

			<div>
				<p className="text-[#09090B] font-bold text-2xl">{title}</p>
				<p className="text-[#71717A] font-medium text-sm">
					{description}
				</p>
			</div>
		</div>
	);
};

export default CardHeader;
