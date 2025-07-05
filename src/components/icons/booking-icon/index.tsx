import { IconProps } from '@quillbooking/types';
const BookingIcon: React.FC<IconProps> = ({ width = 18, height = 18 }) => {

    return (
        <svg width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.4" d="M16.24 3.6499H7.76004C5.29004 3.6499 3.29004 5.6599 3.29004 8.1199V17.5299C3.29004 19.9899 5.30004 21.9999 7.76004 21.9999H16.23C18.7 21.9999 20.7 19.9899 20.7 17.5299V8.1199C20.71 5.6499 18.7 3.6499 16.24 3.6499Z"
                fill="currentColor" />
            <path d="M14.35 2H9.65001C8.61001 2 7.76001 2.84 7.76001 3.88V4.82C7.76001 5.86 8.60001 6.7 9.64001 6.7H14.35C15.39 6.7 16.23 5.86 16.23 4.82V3.88C16.24 2.84 15.39 2 14.35 2Z"
                fill="currentColor" />
            <path d="M15 12.95H8C7.59 12.95 7.25 12.61 7.25 12.2C7.25 11.79 7.59 11.45 8 11.45H15C15.41 11.45 15.75 11.79 15.75 12.2C15.75 12.61 15.41 12.95 15 12.95Z"
                fill="currentColor" />
            <path d="M12.38 16.95H8C7.59 16.95 7.25 16.61 7.25 16.2C7.25 15.79 7.59 15.45 8 15.45H12.38C12.79 15.45 13.13 15.79 13.13 16.2C13.13 16.61 12.79 16.95 12.38 16.95Z"
                fill="currentColor" />
        </svg>
    );
};

export default BookingIcon;