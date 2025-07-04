import { IconProps } from "client/types";
const UpgradeIcon: React.FC<IconProps> = ({width=24, height=24}) => {

    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.4" d="M16.77 18.98H7.23C6.81 18.98 6.43 18.71 6.29 18.32L2.13 6.67004C1.8 5.74004 2.86 4.95004 3.65 5.52004L7.65 8.38004C8.18 8.76004 8.94 8.53004 9.17 7.92004L11.06 2.88004C11.38 2.01004 12.61 2.01004 12.93 2.88004L14.82 7.92004C15.05 8.54004 15.8 8.76004 16.34 8.38004L20.34 5.52004C21.14 4.95004 22.19 5.75004 21.86 6.67004L17.7 18.32C17.57 18.71 17.19 18.98 16.77 18.98Z" fill="currentColor" />
            <path d="M17 22H7C6.59 22 6.25 21.66 6.25 21.25C6.25 20.84 6.59 20.5 7 20.5H17C17.41 20.5 17.75 20.84 17.75 21.25C17.75 21.66 17.41 22 17 22Z" fill="currentColor" />
            <path d="M14.5 14.75H9.5C9.09 14.75 8.75 14.41 8.75 14C8.75 13.59 9.09 13.25 9.5 13.25H14.5C14.91 13.25 15.25 13.59 15.25 14C15.25 14.41 14.91 14.75 14.5 14.75Z" fill="currentColor" />
        </svg>

    );
};

export default UpgradeIcon;