/**
 * Main header component.
 */
interface HeaderProps {
	header: string;
	subHeader?: string;
}

const Header: React.FC<HeaderProps> = ({ header, subHeader }) => {
	return (
		<div>
			<h1
				className='text-3xl font-bold'
			>
				{header}
			</h1>
			{subHeader && <p className='text-sm font-medium'>{subHeader}</p>}
		</div>
	);
};

export default Header;
