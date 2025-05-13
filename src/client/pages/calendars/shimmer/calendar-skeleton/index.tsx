import { Card, Flex } from 'antd';

const CalendarSkeleton = () => {
	return (
		<Card className="bg-[#FDFDFD] mb-4">
			<Flex vertical gap={20}>
				<Card className="bg-white">
					<Flex justify="space-between" align="center">
						<Flex vertical gap={8}>
							<div className="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>
							<div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
						</Flex>
						<div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
					</Flex>
				</Card>
				<Flex vertical gap={12}>
					<div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
					<div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
				</Flex>
			</Flex>
		</Card>
	);
};

export default CalendarSkeleton;
