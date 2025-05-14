/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AdvancedModulesCard from './advanced-modules-card';
import PluginsCard from './plugins-card';
import { Card, Flex } from 'antd';

const AdvancedModulesShimmer = () => {
	return (
		<div className="quillbooking-modules-settings grid grid-cols-2 gap-5 w-full">
			{[1, 2].map((i) => (
				<Card key={i}>
					<Flex vertical gap={20}>
						<Flex gap={12} className="items-center mb-4">
							<div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
							<Flex vertical gap={2}>
								<div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
								<div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
							</Flex>
						</Flex>
						<Flex vertical gap={12}>
							{[1, 2, 3].map((j) => (
								<div
									key={j}
									className="animate-pulse bg-gray-200 h-16 w-full rounded"
								/>
							))}
						</Flex>
					</Flex>
				</Card>
			))}
		</div>
	);
};

const AdvancedModulesTab: React.FC = () => {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Simulate loading for 1 second
		const timer = setTimeout(() => {
			setLoading(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	if (loading) {
		return <AdvancedModulesShimmer />;
	}

	return (
		<div className="quillbooking-modules-settings grid grid-cols-2 gap-5 w-full">
			<AdvancedModulesCard />
			<PluginsCard />
		</div>
	);
};

export default AdvancedModulesTab;
