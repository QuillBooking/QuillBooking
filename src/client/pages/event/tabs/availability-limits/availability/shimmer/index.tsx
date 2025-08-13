import { Card, Flex } from 'antd';

const AvailabilityShimmer = () => {
	return (
		<Card className="rounded-lg">
			<div className="animate-pulse">
				{/* Header shimmer */}
				<Flex gap={12} className="items-center mb-6">
					<div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
					<Flex vertical gap={2}>
						<div className="h-5 bg-gray-200 rounded w-32"></div>
						<div className="h-4 bg-gray-200 rounded w-64"></div>
					</Flex>
				</Flex>

				{/* Team toggle shimmer */}
				<Flex className="items-center justify-between mb-6">
					<Flex vertical gap={2}>
						<div className="h-5 bg-gray-200 rounded w-48"></div>
						<div className="h-4 bg-gray-200 rounded w-96"></div>
					</Flex>
					<div className="w-12 h-6 bg-gray-200 rounded-full"></div>
				</Flex>

				{/* Schedule blocks shimmer */}
				<div className="space-y-4 mb-6">
					{[...Array(7)].map((_, index) => (
						<Flex key={index} className="items-center gap-4">
							<div className="w-24 h-6 bg-gray-200 rounded"></div>
							<div className="flex-1 h-12 bg-gray-200 rounded"></div>
						</Flex>
					))}
				</div>

				{/* Range section shimmer */}
				<div className="space-y-4 mb-6">
					<div className="h-6 bg-gray-200 rounded w-40"></div>
					<div className="h-12 bg-gray-200 rounded"></div>
				</div>

				{/* Reserve times section shimmer */}
				<Flex className="items-center justify-between">
					<Flex vertical gap={2}>
						<div className="h-5 bg-gray-200 rounded w-36"></div>
						<div className="h-4 bg-gray-200 rounded w-80"></div>
					</Flex>
					<div className="w-12 h-6 bg-gray-200 rounded-full"></div>
				</Flex>
			</div>
		</Card>
	);
};

export default AvailabilityShimmer;
