import TagIcon from '../../../icons/tag-icon';
import { css } from '@emotion/css';
import './style.scss';

const Header: React.FC<{ color: string }> = ({ color }) => {
	return (
		<div
			className={
				'event-card-header ' +
				css`
					background-color: ${color};
				`
			}
		>
			<TagIcon />
		</div>
	);
};

export default Header;
