import { IconProps } from '@quillbooking/types';

const MarkIcon: React.FC<IconProps> = ({ width = 16, height = 16 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M12.4668 4.79961C12.2002 4.53294 11.8002 4.53294 11.5335 4.79961L6.5335 9.79961L4.46683 7.73294C4.20016 7.46628 3.80016 7.46628 3.5335 7.73294C3.26683 7.99961 3.26683 8.39961 3.5335 8.66628L6.06683 11.1996C6.20016 11.3329 6.3335 11.3996 6.5335 11.3996C6.7335 11.3996 6.86683 11.3329 7.00016 11.1996L12.4668 5.73294C12.7335 5.46628 12.7335 5.06628 12.4668 4.79961Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default MarkIcon;
