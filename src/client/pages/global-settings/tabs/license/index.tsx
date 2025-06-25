/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

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
import ConfigAPI from '@quillbooking/config';

const LicenseTab: React.FC = () => {
	const license = ConfigAPI.getLicense();
	const pluginData = ConfigAPI.getProPluginData();
	const [count, setCount] = useState(0); // counter used for force update.
	const [licenseKey, setLicenseKey] = useState('');
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeactivating, setIsDeactivating] = useState(false);
	const [isActivating, setIsActivating] = useState(false);
	const [isInstalling, setIsInstalling] = useState(false);
	const [isActivatingPlugin, setIsActivatingPlugin] = useState(false);
	const [loading, setLoading] = useState(true);
	const ajaxUrl = ConfigAPI.getAjaxUrl();

	// Computed states based on license data
	const isActive = !!license;
	const status = license ? license.status === 'valid' : false;

	// dispatch notices.
	const { createNotice } = useDispatch('quillbooking/core');

	const activate = () => {
		if (isDeactivating || isUpdating || isActivating) return;
		setIsActivating(true);
		const data = new FormData();
		data.append('action', 'quillbooking_license_activate');
		data.append('_nonce', ConfigAPI.getNonce());
		data.append('license_key', licenseKey?.trim());

		fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					ConfigAPI.setLicense(res.data);
					setCount(count + 1);
					createNotice({
						type: 'success',
						message: __(
							'License activated successfully.',
							'quillbooking'
						),
					});

					if (!pluginData.is_installed) {
						installPlugin();
					} else if (pluginData.is_installed && !pluginData.is_active) {
						activatePlugin();
					}
				} else {
					createNotice({
						type: 'error',
						message: res.data,
					});
				}
				setIsActivating(false);
			})
			// @ts-ignore
			.catch((err) => {
				setIsActivating(false);
				createNotice({
					type: 'error',
					message: __('Something went wrong', 'quillbooking'),
				});
			});
	};

	const update = () => {
		if (isDeactivating || isUpdating || isActivating) return;
		setIsUpdating(true);
		const data = new FormData();
		data.append('action', 'quillbooking_license_update');
		data.append('_nonce', ConfigAPI.getNonce());

		fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					ConfigAPI.setLicense(res.data);
					setCount(count + 1);
					createNotice({
						type: 'success',
						message: __(
							'License updated successfully.',
							'quillbooking'
						),
					});
				} else {
					createNotice({
						type: 'error',
						message: res.data,
					});
				}
				setIsUpdating(false);
			})
			// @ts-ignore
			.catch((err) => {
				createNotice({
					type: 'error',
					message: __('Something went wrong', 'quillbooking'),
				});
				setIsUpdating(false);
			});
	};

	const deactivate = () => {
		if (isDeactivating || isUpdating || isActivating) return;
		setIsDeactivating(true);
		const data = new FormData();
		data.append('action', 'quillbooking_license_deactivate');
		data.append('_nonce', ConfigAPI.getNonce());

		fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					ConfigAPI.setLicense(false);
					setCount(count + 1);
					createNotice({
						type: 'success',
						message: __(
							'License deactivated successfully.',
							'quillbooking'
						),
					});
				} else {
					createNotice({
						type: 'error',
						message: res.data,
					});
				}

				setIsDeactivating(false);
			})
			// @ts-ignore
			.catch((err) => {
				createNotice({
					type: 'error',
					message: __('Something went wrong', 'quillbooking'),
				});

				setIsDeactivating(false);
			});
	};

	const installPlugin = () => {
		if (isDeactivating || isUpdating || isActivating) return;
		setIsInstalling(true);
		const data = new FormData();
		data.append('action', 'quillbooking_install_pro');
		data.append('_nonce', ConfigAPI.getNonce());

		fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					setCount(count + 1);
					ConfigAPI.setProPluginData({
						...ConfigAPI.getProPluginData(),
						is_installed: true,
					});
					activatePlugin();
				} else {
					createNotice({
						type: 'error',
						message: res.data,
					});
				}
				setIsInstalling(false);
			})
			// @ts-ignore
			.catch((err) => {
				createNotice({
					type: 'error',
					message: __('Something went wrong', 'quillbooking'),
				});
				setIsInstalling(false);
			});
	};

	const activatePlugin = () => {
		if (isDeactivating || isUpdating || isActivating || isInstalling) return;
		setIsActivatingPlugin(true);
		const data = new FormData();
		data.append('action', 'quillbooking_activate_pro');
		data.append('_nonce', ConfigAPI.getNonce());

		fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					setCount(count + 1);
					createNotice({
						type: 'success',
						message: __(
							'Plugin activated successfully.',
							'quillbooking'
						),
					});
					ConfigAPI.setProPluginData({
						...ConfigAPI.getProPluginData(),
						is_active: true,
					});
				} else {
					createNotice({
						type: 'error',
						message: res.data,
					});
				}
				setIsActivatingPlugin(false);
			})
			// @ts-ignore
			.catch((err) => {
				createNotice({
					type: 'error',
					message: __('Something went wrong', 'quillbooking'),
				});
				setIsActivatingPlugin(false);
			});
	};

	// Added missing handleDeactivate function
	const handleDeactivate = () => {
		deactivate();
	};

	useEffect(() => {
		// Simulate loading time
		const timer = setTimeout(() => {
			setLoading(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

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
						'Grant Team Members Access to QuillBooking for Calendar and Booking Management.',
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
								value={licenseKey}
								onChange={(e) => setLicenseKey(e.target.value)}
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
									onClick={activate}
									loading={isActivating}
									disabled={isActivating}
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
												{license?.status_label || (status
													? __('Activated', 'quillbooking')
													: __('Deactivated', 'quillbooking'))}
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
												{license?.activated_at || __(
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
												{license?.last_update || __(
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
												{license?.plan_label || __(
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
												{license?.expires || __(
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
												{license?.last_check || __(
													'19 March 2025 02:44:12 PM',
													'quillbooking'
												)}
											</div>
										</Flex>
									</Flex>
								</Flex>
							</Flex>

							{/* Plugin Installation/Activation Section */}
							{(!pluginData.is_installed || (pluginData.is_installed && !pluginData.is_active)) && (
								<div style={{ marginTop: '20px', marginBottom: '20px' }}>
									{!pluginData.is_installed && (
										<Button
											className="text-white bg-color-primary px-7"
											onClick={installPlugin}
											loading={isInstalling}
											disabled={isDeactivating || isUpdating || isActivating || isInstalling}
										>
											{isInstalling ? __('Installing...', 'quillbooking') : __('Install Plugin', 'quillbooking')}
										</Button>
									)}
									{pluginData.is_installed && !pluginData.is_active && (
										<Button
											className="text-white bg-color-primary px-7"
											onClick={activatePlugin}
											loading={isActivatingPlugin}
											disabled={isDeactivating || isUpdating || isActivating || isInstalling || isActivatingPlugin}
										>
											{isActivatingPlugin ? __('Activating...', 'quillbooking') : __('Activate Plugin', 'quillbooking')}
										</Button>
									)}
								</div>
							)}

							{/* Upgrade Links Section */}
							{license?.upgrades && Object.values(license.upgrades).length > 0 && (
								<div style={{ marginTop: '20px', marginBottom: '20px' }}>
									<div className="text-[16px] font-semibold text-[#71717A] mb-2">
										{__('Available Upgrades:', 'quillbooking')}
									</div>
									<Flex vertical gap={8}>
										{Object.values(license.upgrades).map((upgrade: any, index: number) => (
											<a
												key={index}
												href={upgrade.url}
												target="_blank"
												rel="noopener noreferrer"
												className="text-color-primary underline"
											>
												{__('Upgrade to', 'quillbooking')} {upgrade.plan_label} {__('plan', 'quillbooking')}
											</a>
										))}
									</Flex>
								</div>
							)}

							<Flex gap={20} align="flex-end" justify="flex-end">
								<Button
									className="text-white bg-color-primary px-7 mt-4"
									onClick={update}
									loading={isUpdating}
									disabled={isDeactivating || isUpdating || isActivating}
								>
									<UpdateIcon />
									{__('Update', 'quillbooking')}
								</Button>
								<Button
									danger
									className="text-[#EF4444] bg-white px-7 mt-4"
									onClick={handleDeactivate}
									loading={isDeactivating}
									disabled={isDeactivating || isUpdating || isActivating}
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