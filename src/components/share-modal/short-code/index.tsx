/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Card, Flex, Input, Select } from 'antd';
import React, { useState } from 'react';

/**
 * Internal dependencies
 */
import { CopyWhiteIcon } from '@quillbooking/components';
import { useCopyToClipboard, useApi } from '@quillbooking/hooks';
import type { Event } from '@quillbooking/types';

const ShortCode: React.FC<{
	event: Event;
	icon: React.ReactNode;
	title: string;
}> = ({ event, icon, title }) => {
	const copyToClipboard = useCopyToClipboard();
	const { loading } = useApi();
	const [shortCode, setShortCode] = useState({
		width: { value: 100, unit: '%' },
		minHeight: { value: 500, unit: 'Px' },
		maxHeight: { value: 0, unit: 'Auto' },
	});
	const handleSizeChange = (field, value, unit) => {
		setShortCode((prev) => ({
			...prev,
			[field]: { value, unit },
		}));
	};
	const generateShortcode = () => {
		const width =
			shortCode.width.unit === 'Auto'
				? 'Auto'
				: `${shortCode.width.value}${shortCode.width.unit}`;
		const minHeight =
			shortCode.minHeight.unit === 'Auto'
				? 'Auto'
				: `${shortCode.minHeight.value}${shortCode.minHeight.unit}`;
		const maxHeight =
			shortCode.maxHeight.unit === 'Auto'
				? 'Auto'
				: `${shortCode.maxHeight.value}${shortCode.maxHeight.unit}`;

		return `[quillbooking id="${event?.id}" width="${width}" min_height="${minHeight}" max_height="${maxHeight}"]`;
	};

	return (
		<>
			{/* static */}
			<Flex
				gap={10}
				className="flex items-center border-b pb-4 border-[#E4E4E4]"
			>
				<div className="rounded-lg p-2 border border-[#F1E0FF]">
					{icon}
				</div>
				<div className="flex flex-col">
					<span className="text-[#09090B] text-[20px] font-[700]">
						{title}
					</span>
					<span className="text-[12px] font-[400] text-[#71717A]">
						{__(
							'Customize your form display settings and copy the generated shortcode.',
							'quillbooking'
						)}
					</span>
				</div>
			</Flex>
			<Card className="mt-5">
				<Flex vertical gap={20}>
					<Flex className="items-center justify-between">
						<span className="text-[#1E2125] text-[16px] font-[700]">
							{__('Width', 'quillbooking')}
						</span>
						<Flex gap={18}>
							<Input
								className="h-[48px] rounded-lg w-[132px]"
								placeholder="100"
								value={shortCode.width.value}
								onChange={(e) =>
									handleSizeChange(
										'width',
										e.target.value,
										shortCode.width.unit
									)
								}
								type="number"
							/>
							<Select
								defaultValue={shortCode.width.unit}
								className="h-[48px] rounded-lg w-[132px]"
								onChange={(unit) =>
									handleSizeChange(
										'width',
										shortCode.width.value,
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
					<Flex className="items-center justify-between">
						<span className="text-[#1E2125] text-[16px] font-[700]">
							{__('Minimum Height', 'quillbooking')}
						</span>
						<Flex gap={18}>
							<Input
								className="h-[48px] rounded-lg w-[132px]"
								placeholder="100"
								value={shortCode.minHeight.value}
								onChange={(e) =>
									handleSizeChange(
										'minHeight',
										e.target.value,
										shortCode.minHeight.unit
									)
								}
								type="number"
							/>
							<Select
								defaultValue={shortCode.minHeight.unit}
								className="h-[48px] rounded-lg w-[132px]"
								onChange={(unit) =>
									handleSizeChange(
										'minHeight',
										shortCode.minHeight.value,
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
					<Flex className="items-center justify-between">
						<span className="text-[#1E2125] text-[16px] font-[700]">
							{__('Maximum Height', 'quillbooking')}
						</span>
						<Flex gap={18}>
							<Input
								className="h-[48px] rounded-lg w-[132px]"
								placeholder="100"
								value={shortCode.maxHeight.value}
								onChange={(e) =>
									handleSizeChange(
										'maxHeight',
										e.target.value,
										shortCode.maxHeight.unit
									)
								}
								type="number"
							/>
							<Select
								defaultValue={shortCode.maxHeight.unit}
								className="h-[48px] rounded-lg w-[132px]"
								onChange={(unit) =>
									handleSizeChange(
										'maxHeight',
										shortCode.maxHeight.value,
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
			</Card>
			<Flex vertical className="pt-4">
				<div className="pb-2 text-[#3F4254] text-[16px] font-semibold">
					{__('Generated Shortcode', 'quillbooking')}
				</div>
				<Flex gap={10}>
					<Input
						value={generateShortcode()}
						readOnly
						className="h-[48px] text-[#999999] rounded-lg"
					/>
					<Button
						className="bg-color-primary h-[48px] px-7 rounded-lg text-white"
						onClick={() =>
							copyToClipboard(
								generateShortcode(),
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

export default ShortCode;
