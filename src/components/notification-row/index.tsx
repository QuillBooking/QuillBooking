/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { Card, Flex, Typography } from 'antd';
/**
 * Internal dependencies
 */
import { NotificationType } from '@quillbooking/types';

interface NotificationRowProps {
	noticationKey: string;
	changedKey: string | null;
	setEditingKey: (key: string | null) => void;
	description: string;
	notification: NotificationType;
}
const NotificationRow: React.FC<NotificationRowProps> = ({
	noticationKey,
	changedKey,
	setEditingKey,
	description,
	notification,
}) => {
	return (
		<div
			key={noticationKey}
			onClick={() =>
				setEditingKey(
					changedKey === noticationKey ? null : noticationKey
				)
			}
			className="mt-4"
		>
			<Card
				style={{
					marginBottom: 16,
					cursor: 'pointer',
				}}
				className={
					changedKey === noticationKey
						? 'border border-color-primary bg-color-secondary'
						: 'border'
				}
			>
				<Flex gap={10}>
					<Flex vertical>
						<Flex gap={15}>
							<Typography.Title
								level={5}
								className="text-[#09090B] text-[20px] font-[500] m-0"
							>
								{notification.label}
							</Typography.Title>
							{notification.default && (
								<span className="bg-color-primary text-white rounded-lg text-[11px] pt-[3px] px-2 h-[22px] mt-[7px]">
									{__('ENABLED', 'quillbooking')}
								</span>
							)}
						</Flex>
						<span className="text-[#625C68] text-[14px]">
							{description}
						</span>
					</Flex>
				</Flex>
			</Card>
		</div>
	);
};

export default NotificationRow;
