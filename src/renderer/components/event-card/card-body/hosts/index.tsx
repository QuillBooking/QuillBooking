import { Host } from '../../../../types';
import './style.scss';

interface HostsProps {
	hosts: Host[] | undefined;
}

const Hosts: React.FC<HostsProps> = ({ hosts }) => {
	return (
		<div className='hosts-container'>
			{hosts?.map((host) => (
				<div key={host.id} className="host-card">
					<img
						src={host.image}
						alt={host.name}
						className="host-image"
					/>
					<h3 className="host-name">{host.name}</h3>
				</div>
			))}
		</div>
	);
};

export default Hosts;
