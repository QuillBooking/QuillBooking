import { Card } from 'antd';
import ProVersion from '../pro-version';

interface ProGlobalIntegrationsProps {
	list: Record<string, string[]>;
}

const ProGlobalIntegrations: React.FC<ProGlobalIntegrationsProps> = ({
	list,
}) => {
	return (
		<div className="flex flex-col gap-4">
			<Card>
				<ProVersion />
			</Card>
			<Card>
				{Object.entries(list).map(([key, values]) => (
					<div key={key} style={{ marginBottom: 16 }}>
						<h3 className="font-bold text-xl">{key}</h3>
						<ul className="list-disc list-inside">
							{values.map((item, idx) => (
								<li className="text-base" key={idx}>
									{item}
								</li>
							))}
						</ul>
					</div>
				))}
			</Card>
		</div>
	);
};

export default ProGlobalIntegrations;
