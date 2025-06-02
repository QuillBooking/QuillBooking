import { Card } from 'antd';
import { CardHeader, ProVersion } from '@quillbooking/components';
const ProIntegration: React.FC<{
	title: string;
	description: string;
	icon: React.ReactNode;
}> = ({ title, description, icon }) => {
	return (
		<Card>
			<CardHeader title={title} description={description} icon={icon} />
			<div className="py-8">
				<ProVersion />
			</div>
		</Card>
	);
};

export default ProIntegration;
