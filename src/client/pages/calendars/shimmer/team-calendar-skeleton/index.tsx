import { Card, Flex } from 'antd';

const TeamCalendarSkeleton = () => {
  return (
    <Card
      className="bg-[#FDFDFD] w-[377px]"
      headStyle={{
        backgroundColor: '#FFFFFF',
        paddingTop: '20px',
        paddingBottom: '20px',
      }}
    >
      <Flex vertical gap={20}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Flex vertical gap={8}>
            <div className="animate-pulse bg-gray-200 h-6 w-48 rounded-md"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-32 rounded-md"></div>
          </Flex>
          <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-md"></div>
        </Flex>
        
        {/* Create Event Button */}
        <div className="animate-pulse bg-gray-100 h-14 w-full rounded-md border-2 border-dashed border-gray-300"></div>
        
        {/* Events */}
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 p-4 rounded-xl border border-gray-200">
              <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-2/3"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-1/4"></div>
                </div>
              </div>
              <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
                <div className="h-4 bg-gray-200 rounded-md w-20"></div>
                <div className="h-4 bg-gray-200 rounded-md w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </Flex>
    </Card>
  );
};

export default TeamCalendarSkeleton;