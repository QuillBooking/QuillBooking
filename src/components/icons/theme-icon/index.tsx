import { IconProps } from '@quillbooking/types';

const ThemeIcon: React.FC<IconProps> = ({ width = 28, height = 28 }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H15C20.43 1.25 22.75 3.57 22.75 9V15C22.75 20.43 20.43 22.75 15 22.75ZM9 2.75C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V9C21.25 4.39 19.61 2.75 15 2.75H9Z" fill="currentColor" />
            <path d="M9 22.75C8.59 22.75 8.25 22.41 8.25 22V2C8.25 1.59 8.59 1.25 9 1.25C9.41 1.25 9.75 1.59 9.75 2V22C9.75 22.41 9.41 22.75 9 22.75Z" fill="currentColor" />
        </svg>
    );
};

export default ThemeIcon;