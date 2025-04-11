import { IconProps } from '@quillbooking/client';

const RescheduleIcon: React.FC<IconProps> = ({ width = 16, height = 16 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M14.6668 7.99967C14.6668 11.6797 11.6802 14.6663 8.00016 14.6663C4.32016 14.6663 2.0735 10.9597 2.0735 10.9597M2.0735 10.9597H5.08683M2.0735 10.9597V14.293M1.3335 7.99967C1.3335 4.31967 4.2935 1.33301 8.00016 1.33301C12.4468 1.33301 14.6668 5.03967 14.6668 5.03967M14.6668 5.03967V1.70634M14.6668 5.03967H11.7068"
				stroke="#292D32"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
};

export default RescheduleIcon;
