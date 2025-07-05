/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { Flex } from 'antd';
import { SlArrowUp } from 'react-icons/sl';
import { CardContent, Card } from '@mui/material';
import { LuClock5 } from 'react-icons/lu';
/**
 * Internal dependencies
 */
import type { Location } from '@quillbooking/types';
import user from '../../../../../../components/icons/user.png';

interface LivePreviewProps {
	name: string;
	hosts: { id: number | string; name: string }[];
	duration: number;
	locations: Location[];
	color: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({
	name,
	hosts,
	duration,
	locations,
	color,
}) => {
	return (
		<Card className="rounded-lg shadow-none border-[#e5e7eb] border-[0.1px]">
			<CardContent className="p-0">
				<Flex
					className="justify-between items-center px-[30px] py-5"
					style={{ backgroundColor: color }}
				>
					<div className="text-white text-[24px] font-[700]">
						{__('Event Live Preview', 'quillbooking')}
					</div>
					<SlArrowUp className="text-white text-[16px]" />
				</Flex>
				<Flex vertical gap={10} className="px-[30px] py-5">
					<Flex className="justify-between items-start">
						<Flex vertical gap={4}>
							{/* static */}
							<div>
								<img
									src={user}
									alt="user.png"
									className="size-16 rounded-full"
								/>
							</div>
							<div className="text-[#1A1A1A99] text-[16px]">
								{hosts.map((host, index) => (
									<span key={index}>
										{host.name}
										{index !== hosts.length - 1 && ', '}
									</span>
								))}
							</div>
							<div className="text-[#1A1A1A] text-[24px]">
								{name}
							</div>
						</Flex>
						{/* <Flex
							gap={4}
							className="text-color-primary text-[16px] font-semibold items-center"
						>
							<CiShare1 className="text-[20px]" />
							<span>{__('Event Link', 'quillbooking')}</span>
						</Flex> */}
					</Flex>
					<Flex
						gap={4}
						className="text-[#1A1A1A99] text-[16px] items-center"
					>
						<LuClock5 className="text-[20px]" />
						<span>
							{duration} {__('min', 'quillbooking')}
						</span>
					</Flex>
					<span className="text-[16px] text-[#1A1A1A99] font-[500] capitalize">
						{locations.map((loc, index) => (
							<span key={index}>
								{loc.type === 'custom'
									? loc.fields.location
									: loc.type.split('_').join(' ')}
								{index !== locations.length - 1 && ' | '}
							</span>
						))}
					</span>
					<div className="text-[16px] text-[#1A1A1A] pb-4">
						{__(
							'This is an example of a meeting you would have with a potential customer to demonstrate your product.',
							'quillbooking'
						)}
					</div>
				</Flex>
			</CardContent>
		</Card>
	);
};

export default LivePreview;
