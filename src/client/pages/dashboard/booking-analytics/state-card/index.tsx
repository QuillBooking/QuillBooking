/**
 * External dependencies
 */
import { Flex } from 'antd';

const StateCard = ({ count, label, icon }) => (
    <Flex vertical gap={27} className='bg-[#FBF9FC] p-5 rounded-lg w-[180px]'>
        <div className='text-color-primary'>
            {icon}
        </div>
        <Flex vertical>
            <div className='text-[#5E6278] font-semibold text-2xl'>
                {count}
            </div>
            <div className='text-[#A1A5B7] font-semibold text-sm'>{label}</div>
        </Flex>
    </Flex>
);

export default StateCard;