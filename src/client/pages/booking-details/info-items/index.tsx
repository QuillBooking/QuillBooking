interface InfoItemProps {
	icon: React.ReactNode;
	title: string;
	content: string | number | React.ReactNode | undefined;
	className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({
	icon,
	title,
	content,
	className,
}) => {
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
