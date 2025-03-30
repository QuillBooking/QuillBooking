import { __ } from '@wordpress/i18n';

interface CardHeaderProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	inviteeNumber?: number;
}

const CardHeader: React.FC<CardHeaderProps> = ({
	title,
	description,
	icon,
	inviteeNumber,
}) => {
	return (
		<div className="flex items-center gap-4 p-0 text-color-primary-text border-b pb-5">
			<span className="bg-[#EDEDED] p-2 rounded">{icon}</span>

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
