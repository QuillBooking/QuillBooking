import { IconProps } from '@quillbooking/types';

const HomeIcon: React.FC<IconProps> = ({ width = 18, height = 18 }) => {

    return (
        <svg width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.4" d="M20.04 6.82018L14.28 2.79018C12.71 1.69018 10.3 1.75018 8.78999 2.92018L3.77999 6.83018C2.77999 7.61018 1.98999 9.21018 1.98999 10.4702V17.3702C1.98999 19.9202 4.05999 22.0002 6.60999 22.0002H17.39C19.94 22.0002 22.01 19.9302 22.01 17.3802V10.6002C22.01 9.25018 21.14 7.59018 20.04 6.82018Z"
                fill="currentColor" />
            <path d="M12 18.75C11.59 18.75 11.25 18.41 11.25 18V15C11.25 14.59 11.59 14.25 12 14.25C12.41 14.25 12.75 14.59 12.75 15V18C12.75 18.41 12.41 18.75 12 18.75Z"
                fill="currentColor" />
        </svg>
    );
};

export default HomeIcon;