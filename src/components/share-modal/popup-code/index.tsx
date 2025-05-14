/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { Button, Flex, Input, Select } from 'antd';
import React, { useState } from 'react';
/**
 * Internal dependencies
 */
import { ColorSelector, CopyWhiteIcon } from '@quillbooking/components';
import { useCopyToClipboard, useApi } from '@quillbooking/hooks';

const PopupCode: React.FC<{
	url: string;
	icon: React.ReactNode;
	title: string;
}> = ({ url, icon, title }) => {
	const copyToClipboard = useCopyToClipboard();
	const { loading } = useApi();
	const [buttonSettings, setButtonSettings] = useState({
		title: '',
		backgroundColor: '',
		textColor: '',
		borderColor: '',
		borderRadius: 0,
		borderWidth: 0,
		fontSize: 0,
		padding: { top: 0, right: 0, bottom: 0, left: 0 },
		popupMaxWidth: { value: 100, unit: '%' },
		popupMaxHeight: { value: 100, unit: '%' },
	});
	const handleChange = (field, value) => {
		setButtonSettings((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handlePaddingChange = (side, value) => {
		setButtonSettings((prev) => ({
			...prev,
			padding: {
				...prev.padding,
				[side]: value,
			},
		}));
	};

	const handlePopupSizeChange = (field, value, unit) => {
		setButtonSettings((prev) => ({
			...prev,
			[field]: { value, unit },
		}));
	};

	return (
		<>
			{/* static */}
			<Flex
				gap={10}
				className="flex items-center border-b pb-4 mb-4 border-[#E4E4E4]"
			>
				<div className="rounded-lg p-2 border border-color-secondary">
					{icon}
				</div>
				<div className="flex flex-col">
					<span className="text-[#09090B] text-[20px] font-[700]">
						{title}
					</span>
					<span className="text-[12px] font-[400] text-[#71717A]">
						{__('Popup Settings', 'quillbooking')}
					</span>
				</div>
			</Flex>
			<Flex vertical gap={10} className="pb-4">
				<div className="text-[16px]">
					{__('Button title', 'quillbooking')}
				</div>
				<Input
					placeholder="Preview"
					className="h-[48px] rounded-lg"
					value={buttonSettings.title}
					onChange={(e) => handleChange('title', e.target.value)}
				/>
			</Flex>
			<Flex gap={25} className="justify-start items-center">
				<Flex
					vertical
					gap={8}
					className="items-baseline justify-center"
				>
					<div className="text-[15px]">
						{__('Button background color', 'quillbooking')}
					</div>
					<div className="grid grid-cols-3 gap-4 place-items-center mt-2">
						<ColorSelector
							selectedColor={
								buttonSettings.backgroundColor || null
							}
							onColorSelect={(color) =>
								handleChange('backgroundColor', color)
							}
						/>
					</div>
				</Flex>
				<Flex vertical gap={8}>
					<div className="text-[15px]">
						{__('Button text color', 'quillbooking')}
					</div>
					<div className="grid grid-cols-3 gap-4 place-items-center mt-2">
						<ColorSelector
							selectedColor={buttonSettings.textColor || null}
							onColorSelect={(color) =>
								handleChange('textColor', color)
							}
						/>
					</div>
				</Flex>
				<Flex vertical gap={8}>
					<div className="text-[15px]">
						{__('Button border color', 'quillbooking')}
					</div>
					<div className="grid grid-cols-3 gap-4 place-items-center mt-2">
						<ColorSelector
							selectedColor={buttonSettings.borderColor || null}
							onColorSelect={(color) =>
								handleChange('borderColor', color)
							}
						/>
					</div>
				</Flex>
			</Flex>
			<Flex gap={10} className="mt-4">
				<Flex vertical gap={10}>
					<div className="text-[14px] font-semibold">
						{__('Button border radius(px)', 'quillbooking')}
					</div>
					<Input
						placeholder="0"
						className="h-[48px] rounded-lg"
						value={buttonSettings.borderRadius}
						onChange={(e) =>
							handleChange('borderRadius', e.target.value)
						}
						type="number"
					/>
				</Flex>
				<Flex vertical gap={10}>
					<div className="text-[14px] font-semibold">
						{__('Button border width(px)', 'quillbooking')}
					</div>
					<Input
						placeholder="0"
						className="h-[48px] rounded-lg"
						value={buttonSettings.borderWidth}
						onChange={(e) =>
							handleChange('borderWidth', e.target.value)
						}
						type="number"
					/>
				</Flex>
				<Flex vertical gap={10}>
					<div className="text-[14px] font-semibold">
						{__('Button font size(px)', 'quillbooking')}
					</div>
					<Input
						placeholder="0"
						className="h-[48px] rounded-lg"
						value={buttonSettings.fontSize}
						onChange={(e) =>
							handleChange('fontSize', e.target.value)
						}
						type="number"
					/>
				</Flex>
			</Flex>
			<Flex vertical gap={10} className="mt-4">
				<div className="text-[14px] font-semibold">
					{__('Button padding(px)', 'quillbooking')}
				</div>
				<div className="grid grid-cols-4 gap-2">
					<Input
						placeholder="0"
						prefix={
							<span className="text-[#A1A1A1] mr-2">Top</span>
						}
						className="h-[48px] rounded-lg flex items-center"
						defaultValue={0}
						value={buttonSettings.padding.top}
						onChange={(e) =>
							handlePaddingChange('top', e.target.value)
						}
						type="number"
					/>
					<Input
						placeholder="0"
						prefix={
							<span className="text-[#A1A1A1] mr-2">Right</span>
						}
						className="h-[48px] rounded-lg flex items-center"
						defaultValue={0}
						value={buttonSettings.padding.right}
						onChange={(e) =>
							handlePaddingChange('right', e.target.value)
						}
						type="number"   
					/>
					<Input
						placeholder="0"
						prefix={
							<span className="text-[#A1A1A1] mr-2">Bottom</span>
						}
						className="h-[48px] rounded-lg flex items-center"
						defaultValue={0}
						value={buttonSettings.padding.bottom}
						onChange={(e) =>
							handlePaddingChange('bottom', e.target.value)
						}
						type="number"
					/>
					<Input
						placeholder="0"
						prefix={
							<span className="text-[#A1A1A1] mr-2">Left</span>
						}
						className="h-[48px] rounded-lg flex items-center"
						defaultValue={0}
						value={buttonSettings.padding.left}
						onChange={(e) =>
							handlePaddingChange('left', e.target.value)
						}
						type="number"
					/>
				</div>
			</Flex>
			<Flex gap={10} className="mt-4">
				<Flex vertical gap={10}>
					<div className="text-[15px] font-semibold">
						{__('Popup max width', 'quillbooking')}
					</div>
					<Flex gap={10}>
						<Input
							className="h-[48px] rounded-lg w-[132px]"
							placeholder="100"
							value={buttonSettings.popupMaxWidth.value}
							onChange={(e) =>
								handlePopupSizeChange(
									'popupMaxWidth',
									e.target.value,
									buttonSettings.popupMaxWidth.unit
								)
							}
							type="number"
						/>
						<Select
							defaultValue={buttonSettings.popupMaxWidth.unit}
							className="h-[48px] rounded-lg w-[132px]"
							onChange={(unit) =>
								handlePopupSizeChange(
									'popupMaxWidth',
									buttonSettings.popupMaxWidth.value,
									unit
								)
							}
							getPopupContainer={(trigger) =>
								trigger.parentElement
							}
							options={[
								{ value: '%', label: '%' },
								{ value: 'Px', label: 'Px' },
								{ value: 'Auto', label: 'Auto' },
							]}
						/>
					</Flex>
				</Flex>
				<Flex vertical gap={10}>
					<div className="text-[15px] font-semibold">
						{__('Popup max height', 'quillbooking')}
					</div>
					<Flex gap={10}>
						<Input
							className="h-[48px] rounded-lg w-[132px]"
							placeholder="100"
							value={buttonSettings.popupMaxHeight.value}
							onChange={(e) =>
								handlePopupSizeChange(
									'popupMaxHeight',
									e.target.value,
									buttonSettings.popupMaxHeight.unit
								)
							}
							type="number"
						/>
						<Select
							defaultValue={buttonSettings.popupMaxHeight.unit}
							className="h-[48px] rounded-lg w-[132px]"
							onChange={(unit) =>
								handlePopupSizeChange(
									'popupMaxHeight',
									buttonSettings.popupMaxHeight.value,
									unit
								)
							}
							getPopupContainer={(trigger) =>
								trigger.parentElement
							}
							options={[
								{ value: '%', label: '%' },
								{ value: 'Px', label: 'Px' },
								{ value: 'Auto', label: 'Auto' },
							]}
						/>
					</Flex>
				</Flex>
			</Flex>
			<Flex vertical className="pt-4">
				<div className="pb-2 text-[#3F4254] text-[16px] font-semibold">
					{__(
						'Copy the shortcode below and insert it in your WordPress page or post.',
						'quillbooking'
					)}
				</div>
				<Flex gap={10} vertical>
					<Input
						value={url}
						readOnly
						className="h-[140px] text-[#999999] rounded-lg"
					/>
					<Button
						className="bg-color-primary h-[48px] px-9 w-fit rounded-lg text-white"
						onClick={() =>
							copyToClipboard(
								url,
								__('Link copied', 'quillbooking')
							)
						}
						loading={loading}
					>
						<CopyWhiteIcon />
						<span className="text-white text-[16px] font-[500] self-center">
							{__('Copy', 'quillbooking')}
						</span>
					</Button>
				</Flex>
			</Flex>
		</>
	);
};

export default PopupCode;
