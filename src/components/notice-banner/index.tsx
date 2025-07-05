/**
 * External dependencies
 */
import { Flex } from 'antd';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
/**
 * Internal dependencies
 */
import { NoticeMessage } from '@quillbooking/types';

interface NoticeBannerProps {
	notice: NoticeMessage;
	closeNotice: () => void;
}

const NoticeBanner: React.FC<NoticeBannerProps> = ({ closeNotice, notice }) => {
	const isSuccess = notice.type === 'success';

	return (
		<Flex
			className={`justify-between items-start border py-3 px-5 mb-4 rounded-lg ${isSuccess
					? 'bg-[#0EA4731A] border-[#0EA473]'
					: 'bg-[#FF4D4F1A] border-[#FF4D4F]'
				}`}
		>
			<Flex vertical>
				<Flex className="items-baseline gap-2">
					{isSuccess ? (
						<FaCheckCircle className="text-[#0EA473] text-[14px]" />
					) : (
						<FaTimesCircle className="text-[#FF4D4F] text-[14px]" />
					)}
					<span
						className={`text-[16px] font-semibold ${isSuccess ? 'text-[#0EA473]' : 'text-[#FF4D4F]'
							}`}
					>
						{notice.title}
					</span>
				</Flex>
				<span
					className={isSuccess ? 'text-[#0EA473]' : 'text-[#FF4D4F]'}
				>
					{notice.message}
				</span>
			</Flex>
			<IoClose
				onClick={closeNotice}
				className={`text-[18px] cursor-pointer pt-1 ${isSuccess ? 'text-[#0F5032]' : 'text-[#A8071A]'
					}`}
			/>
		</Flex>
	);
};

export default NoticeBanner;
