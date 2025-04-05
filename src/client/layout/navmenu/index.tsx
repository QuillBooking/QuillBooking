interface HeaderProps {
    icon: React.ReactNode;
    title: string;
}

const Navmenu: React.FC<HeaderProps> = ({ icon, title }) => {
    return (
        <div className="flex items-center text-color-primary-text font-[500] text-[16px]">
            <div className="mr-[15px]">
                {icon}
            </div>
            <span>{title}</span>
        </div>
    );
};

export default Navmenu;