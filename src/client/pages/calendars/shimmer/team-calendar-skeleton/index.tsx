import { Card, Flex } from 'antd';

const TeamCalendarSkeleton = () => {
  return (
    <Card
      title={
        <Flex vertical gap={8}>
          <div className="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
        </Flex>
      }
      className="bg-[#FDFDFD] w-[377px]"
      headStyle={{
        backgroundColor: '#FFFFFF',
        textTransform: 'capitalize',
        paddingTop: '20px',
        paddingBottom: '20px',
      }}
      extra={<div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>}
    >
      <Flex vertical gap={20}>
        <div className="animate-pulse bg-gray-200 h-14 w-[310px] rounded"></div>
        <Flex vertical gap={12}>
          <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
          <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
        </Flex>
      </Flex>
    </Card>
  );
};

export default TeamCalendarSkeleton; 