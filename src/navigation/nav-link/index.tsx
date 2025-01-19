/**
 * External dependencies
 */
import { useNavigate } from 'react-router-dom';

let forceReload = false;

interface Props {
	to: string;
	children: React.ReactNode;
}

import { getToLink } from '..';

const CustomNavLink: React.FC<Props> = (props) => {
	const navigate = useNavigate();

	return (
		<a
			href={props.to}
			onClick={(e) => {
				e.preventDefault();
				if (forceReload) {
					const parts = window.location.href.split('/');
					parts.pop();
					const url = parts.join('/') + props.to;
					window.location.href = url;
				} else {
					const path = getToLink(props.to);
					navigate(path);
				}
			}}
		>
			{props.children}
		</a>
	);
};

const setForceReload = (value: boolean) => {
	forceReload = value;
};

export { CustomNavLink as NavLink, setForceReload };
