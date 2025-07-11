/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
} from '@mui/material';
import { IoCloseSharp } from 'react-icons/io5';
import { Card, Flex } from 'antd';

/**
 * Internal dependencies
 */
import {
	DirectLinkIcon,
	EmbedCodeIcon,
	Header,
	QrIcon,
	ShareEventIcon,
	ShortCodeIcon,
} from '@quillbooking/components';
import DirectLink from './direct-link';
import ShortCode from './short-code';
import EmbedCode from './embed-code';
import QrCode from './qr-code';
import { Event } from '@quillbooking/types';

const Shimmer: React.FC = () => {
	return (
		<Flex gap={30}>
			<Card className="w-[648px]">
				<Flex vertical gap={10}>
					{[1, 2, 3, 4, 5].map((item) => (
						<Flex
							gap={10}
							key={item}
							className="flex items-center border p-4 rounded-lg"
						>
							<div className="rounded-lg p-2 w-[40px] h-[40px] animate-pulse bg-gray-200" />
							<div className="flex flex-col gap-2 flex-1">
								<div className="h-[20px] w-[150px] animate-pulse bg-gray-200 rounded" />
								<div className="h-[16px] w-[80%] animate-pulse bg-gray-200 rounded" />
							</div>
						</Flex>
					))}
				</Flex>
			</Card>

			<Card className="w-[648px]">
				<Flex vertical gap={4} className="p-4">
					<div className="h-[24px] w-[200px] animate-pulse bg-gray-200 rounded mb-4" />
					<div className="h-[40px] w-full animate-pulse bg-gray-200 rounded" />
					<div className="h-[40px] w-[120px] animate-pulse bg-gray-200 rounded mt-4" />
				</Flex>
			</Card>
		</Flex>
	);
};

const shareOptions = [
	{
		key: 'directLink',
		icon: <DirectLinkIcon />,
		title: __('Direct Link', 'quillbooking'),
		description: __(
			'Copy the form link and share it with your audience..',
			'quillbooking'
		),
		component: DirectLink,
	},
	{
		key: 'shortCode',
		icon: <ShortCodeIcon />,
		title: __('Short Code', 'quillbooking'),
		description: __(
			'Copy the shortcode and paste it into your post or page.',
			'quillbooking'
		),
		component: ShortCode,
	},
	{
		key: 'embedCode',
		icon: <EmbedCodeIcon />,
		title: __('Embed Code', 'quillbooking'),
		description: __(
			'Embed code is useful to share the form in an external web page. Copy the code and paste it into your external post or page.',
			'quillbooking'
		),
		component: EmbedCode,
	},
	{
		key: 'qrCode',
		icon: <QrIcon />,
		title: __('QR Code', 'quillbooking'),
		description: __(
			'Share your form with others by scanning the QR code.',
			'quillbooking'
		),
		component: QrCode,
	},
];

const ShareModal: React.FC<{
	open: boolean;
	onClose: () => void;
	url: string;
	event: Event;
}> = ({ open, onClose, url, event }) => {
	if (!open) return null;
	const [selectedKey, setSelectedKey] = useState('directLink');
	const [isLoading, setIsLoading] = useState(true);
	const selectedOption = shareOptions.find(
		(item) => item.key === selectedKey
	);
	const SelectedComponent = selectedOption?.component || null;

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby="share-modal-label"
			aria-describedby="share-modal-description"
			className="share-modal"
			maxWidth="lg"
			sx={{
				zIndex: 160000,
			}}
		>
			<DialogTitle
				sx={{
					backgroundColor: 'white',
					width: '100%',
				}}
				className="flex justify-between"
			>
				<Flex gap={10} className="items-center">
					<ShareEventIcon />
					<Header
						header={__('Share Event', 'quillbooking')}
						subHeader={__(
							'Share Your Event with Others using Multiple Options.',
							'quillbooking'
						)}
					/>
				</Flex>
				<DialogActions
					className="cursor-pointer"
					onClick={onClose}
					color="primary"
				>
					<IoCloseSharp />
				</DialogActions>
			</DialogTitle>
			<DialogContent>
				{isLoading ? (
					<Shimmer />
				) : (
					<Flex gap={30}>
						<Card className="w-[648px]">
							<Flex vertical gap={10}>
								{shareOptions.map(
									({ key, icon, title, description }) => (
										<Flex
											gap={10}
											className={`flex items-center border p-4 rounded-lg cursor-pointer ${selectedKey === key ? 'border-color-primary bg-color-secondary' : 'border-[#E4E4E4]'}`}
											key={key}
											onClick={() => setSelectedKey(key)}
										>
											<div
												className={`rounded-lg p-2 ${selectedKey === key ? 'bg-[#D5B0F4]' : 'border border-color-secondary'}`}
											>
												{icon}
											</div>
											<div className="flex flex-col">
												<div className="flex gap-5 items-center">
													<span className="text-[#3F4254] text-[16px] font-semibold">
														{title}
													</span>
													{(key === 'popUp' ||
														key === 'qrCode') && (
															<span className="bg-color-primary text-white rounded-lg text-[11px] pt-[3px] px-2 h-[22px]">
																{__(
																	'NEW',
																	'quillbooking'
																)}
															</span>
														)}
												</div>
												<span
													className={`text-[12px] font-[400] ${selectedKey === key ? 'text-[#505255]' : 'text-[#9197A4]'}`}
												>
													{description}
												</span>
											</div>
										</Flex>
									)
								)}
							</Flex>
						</Card>

						<Card className="w-[648px]">
							{selectedOption && SelectedComponent && (
								<SelectedComponent
									url={url}
									event={event}
									icon={selectedOption.icon}
									title={selectedOption.title}
								/>
							)}
						</Card>
					</Flex>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ShareModal;
