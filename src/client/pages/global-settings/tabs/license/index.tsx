/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Card, Flex, Input, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
import {
	AllCalendarIcon,
	CancelledCalendarIcon,
	CardHeader,
	CompletedCalendarIcon,
	DeactivateIcon,
	FlagIcon,
	LicenseTabIcon,
	UpdateIcon,
	UpgradeIcon,
} from '@quillbooking/components';

const LicenseTab: React.FC = () => {
	const [isActive, setIsActive] = useState(false);
	const [status, setStatus] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Simulate loading time
		const timer = setTimeout(() => {
			setLoading(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	const handleActivate = () => {
		setIsActive(true);
	};

	const handleDeactivate = () => {
		setIsActive(false);
	};

	if (loading) {
		return (
			<div className="quillbooking-license-settings w-full">
				<Card>
					<Skeleton.Input
						active
						block
						style={{ height: 60, marginBottom: 16 }}
					/>
					<Card className="w-full mt-6 px-5">
						<Flex vertical gap={4}>
							<Skeleton.Input
								active
								block
								style={{ height: 40, marginBottom: 16 }}
							/>
							<Skeleton.Input
								active
								block
								style={{ height: 48, marginBottom: 16 }}
							/>
							<Skeleton.Input
								active
								block
								style={{ height: 24, marginBottom: 16 }}
							/>
							<Flex justify="flex-end">
								<Skeleton.Button
									active
									style={{ width: 120, height: 40 }}
								/>
							</Flex>
						</Flex>
					</Card>
				</Card>
			</div>
		);
	}

	return (
		<div className="quillbooking-license-settings w-full">
			<Card>
				<CardHeader
					title={__('License Management', 'quillbooking')}
					description={__(
						'Grant Team Members Access to FluentBookings for Calendar and Booking Management.',
						'quillbooking'
					)}
					icon={<LicenseTabIcon />}
				/>
				<Card className="w-full mt-6 px-5">
					{!isActive ? (
						<Flex vertical gap={4}>
							<div className="text-[16px]">
								{__(
									'Please Provide a license key of Quill Booking',
									'quillbooking'
								)}
							</div>
							<Input
								className="w-full h-[48px] rounded-lg"
								placeholder={__(
									'Enter a Valid license key',
									'quillbooking'
								)}
							/>
							<Flex
								align="center"
								gap={4}
								className="text-[#818181]"
							>
								<span>
									{__(
										'By Activating this license, you agree to the',
										'quillbooking'
									)}
								</span>
								<span className="text-color-primary underline font-semibold">
									{__('terms of use', 'quillbooking')}
								</span>
								<span>
									{__('for this product.', 'quillbooking')}
								</span>
							</Flex>
							<Flex justify="flex-end" align="flex-end">
								<Button
									className="text-white bg-color-primary px-7 mt-4"
									onClick={handleActivate}
								>
									<LicenseTabIcon width={24} height={24} />
									{__('Activate License', 'quillbooking')}
								</Button>
							</Flex>
						</Flex>
					) : (
						<Flex vertical gap={4}>
							<Flex align="center" gap={125}>
								<Flex vertical gap={25}>
									<Flex align="center" gap={10}>
										<FlagIcon />
										<Flex vertical>
											<div className="text-[16px] font-semibold text-[#71717A]">
												{__('Status', 'quillbooking')}
											</div>
											<div
												className={`text-[18px] font-bold ${status ? 'text-[#34C759]' : 'text-[#EF4444]'}`}
											>
												{status
													? __(
															'Activated',
															'quillbooking'
														)
													: __(
															'Deactivated',
															'quillbooking'
														)}
											</div>
										</Flex>
									</Flex>
									<Flex align="center" gap={10}>
										<CompletedCalendarIcon
											width={32}
											height={32}
										/>
										<Flex vertical>
											<div className="text-[16px] font-semibold text-[#71717A]">
												{__(
													'Start Date',
													'quillbooking'
												)}
											</div>
											<div className="text-[18px] text-[#09090B] font-medium">
												{__(
													'19 March 2025 02:44:12 PM',
													'quillbooking'
												)}
											</div>
										</Flex>
									</Flex>
									<Flex align="center" gap={10}>
										<AllCalendarIcon
											width={32}
											height={32}
										/>
										<Flex vertical>
											<div className="text-[16px] font-semibold text-[#71717A]">
												{__(
													'Last Update',
													'quillbooking'
												)}
											</div>
											<div className="text-[18px] text-[#09090B] font-medium">
												{__(
													'19 March 2025 02:44:12 PM',
													'quillbooking'
												)}
											</div>
										</Flex>
									</Flex>
								</Flex>
								<Flex vertical gap={25}>
									<Flex align="center" gap={10}>
										<UpgradeIcon width={32} height={32} />
										<Flex vertical>
											<div className="text-[16px] font-semibold text-[#71717A]">
												{__(
													'Your Plan',
													'quillbooking'
												)}
											</div>
											<div className="text-[18px] text-[#09090B] font-medium">
												{__(
													'Enterprise',
													'quillbooking'
												)}
											</div>
										</Flex>
									</Flex>
									<Flex align="center" gap={10}>
										<CancelledCalendarIcon
											width={32}
											height={32}
										/>
										<Flex vertical>
											<div className="text-[16px] font-semibold text-[#71717A]">
												{__(
													'Expiry Date',
													'quillbooking'
												)}
											</div>
											<div className="text-[18px] text-[#09090B] font-medium">
												{__(
													'19 March 2025 02:44:12 PM',
													'quillbooking'
												)}
											</div>
										</Flex>
									</Flex>
									<Flex align="center" gap={10}>
										<AllCalendarIcon
											width={32}
											height={32}
										/>
										<Flex vertical>
											<div className="text-[16px] font-semibold text-[#71717A]">
												{__(
													'Last Check',
													'quillbooking'
												)}
											</div>
											<div className="text-[18px] text-[#09090B] font-medium">
												{__(
													'19 March 2025 02:44:12 PM',
													'quillbooking'
												)}
											</div>
										</Flex>
									</Flex>
								</Flex>
							</Flex>
							<Flex gap={20} align="flex-end" justify="flex-end">
								<Button className="text-white bg-color-primary px-7 mt-4">
									<UpdateIcon />
									{__('Update', 'quillbooking')}
								</Button>
								<Button
									danger
									className="text-[#EF4444] bg-white px-7 mt-4"
									onClick={handleDeactivate}
								>
									<DeactivateIcon />
									{__('Deactivate', 'quillbooking')}
								</Button>
							</Flex>
						</Flex>
					)}
				</Card>
			</Card>
		</div>
	);
};

export default LicenseTab;
