/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { Flex } from 'antd';
import { BsInfoCircleFill } from 'react-icons/bs';
import { IoClose } from 'react-icons/io5';

interface NoticeComponentProps {
	isNoticeVisible: boolean;
	setNoticeVisible: (visible: boolean) => void;
}
const NoticeComponent: React.FC<NoticeComponentProps> = ({
	isNoticeVisible,
	setNoticeVisible,
}) => {
	return (
		<>
			{isNoticeVisible && (
				<Flex className="justify-between items-start border py-3 px-5 mb-4 bg-[#FBFBFB] border-[#E0E0E0]">
					<Flex vertical>
						<Flex className="items-baseline gap-2">
							<BsInfoCircleFill className="text-[#727C88] text-[14px]" />
							<span className="text-[#727C88] text-[16px] font-semibold">
								{__('Notice', 'quillbooking')}
							</span>
						</Flex>
						<span className="text-[#999999]">
							{__(
								'You can Choose the settings for each one and change its internal settings.',
								'quillbooking'
							)}
						</span>
					</Flex>
					<IoClose
						onClick={() => setNoticeVisible(false)}
						className="text-[#727C88] text-[18px] cursor-pointer pt-1"
					/>
				</Flex>
			)}
		</>
	);
};

export default NoticeComponent;
