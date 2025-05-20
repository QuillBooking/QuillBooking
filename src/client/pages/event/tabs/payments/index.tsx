/**
 * WordPress Dependencies
 */
import {
	useEffect,
	useState,
	forwardRef,
	useImperativeHandle,
	useRef,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External Dependencies
 */
import {
	Card,
	Flex,
	Button,
	Switch,
	Input,
	InputNumber,
	Radio,
	Skeleton,
	Checkbox,
} from 'antd';
import { get, isEmpty, map } from 'lodash';
import { PiClockClockwiseFill } from 'react-icons/pi';
import { FaPlus, FaTrash } from 'react-icons/fa';
/**
 * Internal Dependencies
 */
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import {
	AlertIcon,
	CardHeader,
	Header,
	PaymentIcon,
	ProductSelect,
	NoticeBanner,
} from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import { useEventContext } from '../../state/context';
import './style.scss';
import paypal from '@quillbooking/assets/icons/paypal/paypal.png';
import stripe from '@quillbooking/assets/icons/stripe/stripe.png';
import { PaymentsSettings } from 'client/types';

interface EventPaymentProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

interface EventPaymentHandle {
	saveSettings: () => Promise<void>;
}

const PaymentsSkeleton = () => {
	return (
		<Card className="rounded-lg mx-9">
			<Flex gap={10} align="center" className="mb-6">
				<Skeleton.Avatar active size={40} />
				<Flex vertical gap={4}>
					<Skeleton.Input
						active
						size="small"
						style={{ width: 200 }}
					/>
					<Skeleton.Input
						active
						size="small"
						style={{ width: 300 }}
					/>
				</Flex>
			</Flex>

			<Flex vertical gap={25}>
				{/* Enable Payment Switch */}
				<Flex gap={10} className="w-full">
					<Flex className="justify-between items-center w-full">
						<Flex vertical gap={4}>
							<Skeleton.Input
								active
								size="small"
								style={{ width: 150 }}
							/>
							<Skeleton.Input
								active
								size="small"
								style={{ width: 250 }}
							/>
						</Flex>
						<Skeleton.Button
							active
							size="small"
							style={{ width: 50 }}
						/>
					</Flex>
				</Flex>

				{/* Payment Method Selection */}
				<Flex vertical gap={4}>
					<Skeleton.Input
						active
						size="small"
						style={{ width: 150 }}
					/>
					<Flex gap={20} className="w-full">
						<Skeleton.Input active block style={{ height: 60 }} />
						<Skeleton.Input active block style={{ height: 60 }} />
					</Flex>
				</Flex>

				{/* Payment Options */}
				<Flex vertical gap={4}>
					<Skeleton.Input
						active
						size="small"
						style={{ width: 200 }}
					/>
					<Flex gap={20} className="w-full">
						<Skeleton.Input active block style={{ height: 100 }} />
						<Skeleton.Input active block style={{ height: 100 }} />
					</Flex>
				</Flex>
			</Flex>
		</Card>
	);
};

const Payments = forwardRef<EventPaymentHandle, EventPaymentProps>(
	(props, ref) => {
		const { state: event } = useEventContext();
		const { callApi, loading } = useApi();
		const [isSaving, setIsSaving] = useState(false);
		const [isInitialLoad, setIsInitialLoad] = useState(true);
		const initialLoadCompleted = useRef(false);
		const setBreadcrumbs = useBreadcrumbs();
		const { successNotice, errorNotice } = useNotice();

		// Single state for all payment settings with default values
		const [paymentSettings, setPaymentSettings] = useState<PaymentsSettings>({
			enable_payment: false,
			enable_items_based_on_duration: false,
			enable_paypal: false,
			enable_stripe: false,
			items: [
				{ item: __('Booking Item', 'quillbooking'), price: 100 },
			],
			multi_duration_items: {},
			payment_methods: [], // Initialize with empty array to fix TypeScript error
			type: 'native',
			woo_product: 0,
		});

		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				return saveSettings();
			},
		}));

		const handleSettingsChange = (key, value) => {
			setPaymentSettings((prev) => ({
				...prev,
				[key]: value,
			}));
			props.setDisabled(false);
		};

		// Updated togglePaymentMethod function to ensure consistency
		const togglePaymentMethod = (method) => {
			// Ensure payment_methods is always an array
			const currentMethods = paymentSettings.payment_methods || [];
			const methodExists = currentMethods.includes(method);

			// Create a new payment_methods array based on the toggle action
			const newPaymentMethods = methodExists
				? currentMethods.filter((item) => item !== method)
				: [...currentMethods, method];

			// Update the corresponding boolean flag based on the method
			const newPaymentSettings = {
				...paymentSettings,
				payment_methods: newPaymentMethods,
			};

			// Explicitly set the boolean flags based on whether methods exist in the array
			newPaymentSettings.enable_paypal = newPaymentMethods.includes('paypal');
			newPaymentSettings.enable_stripe = newPaymentMethods.includes('stripe');

			setPaymentSettings(newPaymentSettings);
			props.setDisabled(false);
		};

		const handleItemChange = (index, field, value) => {
			const updatedItems = [...paymentSettings.items];
			updatedItems[index] = {
				...updatedItems[index],
				[field]: value,
			};

			setPaymentSettings((prev) => ({
				...prev,
				items: updatedItems,
			}));

			props.setDisabled(false);
		};

		const addItem = () => {
			setPaymentSettings((prev) => ({
				...prev,
				items: [
					...prev.items,
					{ item: __('Booking Item', 'quillbooking'), price: 100 },
				],
			}));

			props.setDisabled(false);
		};

		const removeItem = (index) => {
			const updatedItems = [...paymentSettings.items];
			updatedItems.splice(index, 1);

			setPaymentSettings((prev) => ({
				...prev,
				items: updatedItems,
			}));

			props.setDisabled(false);
		};

		const handleDurationItemChange = (duration, field, value) => {
			const durationStr = duration.toString();
			const updatedDurationItems = {
				...paymentSettings.multi_duration_items,
			};

			if (!updatedDurationItems[durationStr]) {
				updatedDurationItems[durationStr] = {
					item: __('Booking Item', 'quillbooking'),
					price: 100,
					duration: durationStr,
				};
			}

			updatedDurationItems[durationStr] = {
				...updatedDurationItems[durationStr],
				[field]: value,
			};

			setPaymentSettings((prev) => ({
				...prev,
				multi_duration_items: updatedDurationItems,
			}));

			props.setDisabled(false);
		};

		const fetchSettings = () => {
			if (!event) return;

			callApi({
				path: `events/${event.id}/meta/payments_settings`,
				method: 'GET',
				onSuccess(response: PaymentsSettings) {
					// Ensure items is always an array with at least one item
					const responseWithDefaults = {
						...response,
						items: response.items?.length
							? response.items
							: [
								{
									item: __(
										'Booking Item',
										'quillbooking'
									),
									price: 100,
								},
							],
						multi_duration_items:
							response.multi_duration_items || {},
						// Ensure payment_methods is always an array
						payment_methods: response.payment_methods || [],
					};

					// Ensure payment_methods and boolean flags are in sync
					responseWithDefaults.enable_paypal = responseWithDefaults.payment_methods.includes('paypal');
					responseWithDefaults.enable_stripe = responseWithDefaults.payment_methods.includes('stripe');
					responseWithDefaults.type = response.type || 'native';

					// Setup initial values for multi-duration items if needed
					const selectableDurations = get(
						event,
						'additional_settings.selectable_durations',
						[]
					);

					if (
						selectableDurations.length &&
						isEmpty(responseWithDefaults.multi_duration_items)
					) {
						selectableDurations.forEach((duration) => {
							const durationStr = duration.toString();
							if (
								!responseWithDefaults.multi_duration_items[
								durationStr
								]
							) {
								responseWithDefaults.multi_duration_items[
									durationStr
								] = {
									item: __('Booking Item', 'quillbooking'),
									price: 100,
									duration: durationStr,
								};
							}
						});
					}

					setPaymentSettings(responseWithDefaults);

					// Mark initial load as complete after first successful fetch
					if (isInitialLoad) {
						setIsInitialLoad(false);
						initialLoadCompleted.current = true;
					}
				},
				onError(error) {
					if (isInitialLoad) {
						setIsInitialLoad(false);
						initialLoadCompleted.current = true;
					}
					throw new Error(error.message);
				},
			});
		};

		useEffect(() => {
			if (!event) {
				return;
			}

			// Only fetch on initial mount or if initialLoadCompleted is false
			if (!initialLoadCompleted.current) {
				fetchSettings();
				initialLoadCompleted.current = true;
			}

			setBreadcrumbs([
				{
					path: `calendars/${event.calendar_id}/events/${event.id}/payments`,
					title: __('Payments Settings', 'quillbooking'),
				},
			]);
		}, [event]);

		const saveSettings = async () => {
			try {
				setIsSaving(true);
				props.setDisabled(true);

				if (!event) {
					throw new Error(__('Event not found', 'quillbooking'));
				}

				// Make sure we have at least one item in the items array if not using multi-duration
				if (
					!paymentSettings.enable_items_based_on_duration &&
					(!paymentSettings.items ||
						paymentSettings.items.length === 0)
				) {
					setPaymentSettings((prev) => ({
						...prev,
						items: [
							{
								item: __('Booking Item', 'quillbooking'),
								price: 100,
							},
						],
					}));
				}

				// Ensure payment_methods array and boolean flags are consistent before saving
				const finalPaymentSettings = {
					...paymentSettings,
					// Ensure payment_methods is always an array
					payment_methods: paymentSettings.payment_methods || [],
					enable_paypal: (paymentSettings.payment_methods || []).includes('paypal'),
					enable_stripe: (paymentSettings.payment_methods || []).includes('stripe'),
				};

				await callApi({
					path: `events/${event.id}`,
					method: 'POST',
					data: {
						payments_settings: finalPaymentSettings,
					},
					onSuccess() {
						successNotice(
							__(
								'Payment settings saved successfully',
								'quillbooking'
							)
						);
						// No longer refreshing the page or refetching data
					},
					onError(error) {
						props.setDisabled(false);
						throw new Error(error.message);
					},
				});
			} catch (error: any) {
				props.setDisabled(false);
				throw error;
			} finally {
				setIsSaving(false);
			}
		};

		// Show skeleton only during initial load
		if (loading && isInitialLoad) {
			return <PaymentsSkeleton />;
		}

		if (!event) {
			return <PaymentsSkeleton />;
		}

		const isWooCommerceEnabled = ConfigAPI.isWoocommerceActive();
		const allowAttendeesToSelectDuration = get(
			event,
			'additional_settings.allow_attendees_to_select_duration'
		);

		return (
			<Card className="rounded-lg mx-9">
				<CardHeader
					title={__('Pricing Options', 'quillbooking')}
					description={__(
						'Select Pricing Modal and your price.',
						'quillbooking'
					)}
					icon={<PaymentIcon />}
				/>
				<Flex
					vertical
					gap={25}
					className="quillbooking-payments-tab mt-4"
				>
					{/* Enable Payment Switch */}
					<Flex gap={10} className="w-full">
						{!paymentSettings.enable_payment ? (
							<Flex className="justify-between items-center w-full">
								<Flex vertical gap={1}>
									<div className="text-[#09090B] font-bold">
										{__('Enable Payment', 'quillbooking')}
									</div>
									<div className="text-[#71717A] font-[500]">
										{__(
											'Enable this event as Paid and collect payment on booking',
											'quillbooking'
										)}
									</div>
								</Flex>
								<Switch
									className="custom-switch"
									checked={paymentSettings.enable_payment}
									onChange={(checked) =>
										handleSettingsChange(
											'enable_payment',
											checked
										)
									}
									disabled={isSaving}
								/>
							</Flex>
						) : (
							<Flex gap={20} className="w-full">
								<Flex
									className={`justify-between items-center ${allowAttendeesToSelectDuration ? 'w-1/2' : 'w-full'}`}
								>
									<Flex vertical gap={1}>
										<div className="text-[#09090B] font-bold">
											{__(
												'Enable Payment',
												'quillbooking'
											)}
										</div>
										<div className="text-[#71717A] font-[500]">
											{__(
												'Enable this event as Paid and collect payment on booking',
												'quillbooking'
											)}
										</div>
									</Flex>
									<Switch
										className="custom-switch"
										checked={paymentSettings.enable_payment}
										onChange={(checked) =>
											handleSettingsChange(
												'enable_payment',
												checked
											)
										}
										disabled={isSaving}
									/>
								</Flex>

								{allowAttendeesToSelectDuration && (
									<Flex className="justify-between items-center w-1/2">
										<Flex vertical gap={1}>
											<div className="text-[#09090B] font-bold">
												{__(
													'Enable Multiple Payment',
													'quillbooking'
												)}
											</div>
											<div className="text-[#71717A] font-[500]">
												{__(
													'Enable Multiple Payment options based on duration.',
													'quillbooking'
												)}
											</div>
										</Flex>
										<Switch
											className="custom-switch"
											checked={
												paymentSettings.enable_items_based_on_duration
											}
											onChange={(checked) =>
												handleSettingsChange(
													'enable_items_based_on_duration',
													checked
												)
											}
											disabled={isSaving}
										/>
									</Flex>
								)}
							</Flex>
						)}
					</Flex>

					{/* Main content - only show if payment is enabled */}
					{paymentSettings.enable_payment && (
						<>
							{/* Payment Type Selection */}
							<Flex vertical gap={4}>
								<div className="text-[#3F4254] font-semibold text-[16px]">
									{__('Checkout Method', 'quillbooking')}
								</div>
								<Radio.Group
									className="flex w-full"
									value={paymentSettings.type}
									onChange={(e) =>
										handleSettingsChange(
											'type',
											e.target.value
										)
									}
									disabled={isSaving}
								>
									<Radio
										value="native"
										className={`custom-radio border w-1/2 rounded-lg p-4 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                      ${paymentSettings.type === 'native' ? 'bg-color-secondary border-color-primary' : 'border'}`}
									>
										{__(
											'Use Native Payment Methods by Quillbooking',
											'quillbooking'
										)}
									</Radio>
									<Radio
										value="woocommerce"
										className={`custom-radio border w-1/2 rounded-lg p-4 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                      ${paymentSettings.type === 'woocommerce' ? 'bg-color-secondary border-color-primary' : 'border'}`}
									>
										{__(
											'Use WooCommerce Checkout',
											'quillbooking'
										)}
									</Radio>
								</Radio.Group>
							</Flex>

							{/* WooCommerce Product Selection */}
							{paymentSettings.type === 'woocommerce' && (
								<>
									{isWooCommerceEnabled ? (
										<Flex vertical gap={4} className="mt-6">
											<div className="text-[#3F4254] font-semibold text-[16px]">
												{__(
													'Select WooCommerce Product',
													'quillbooking'
												)}
											</div>
											<ProductSelect
												placeholder={__(
													'Select a WooCommerce product...',
													'quillbooking'
												)}
												onChange={(value) => handleSettingsChange('woo_product', value)}
												value={paymentSettings.woo_product || 0}
											/>
											<span className="text-[#71717A] text-[16px] font-medium">
												{__(
													'The selected product will be used for checkout in WooCommerce. The amount will be equal to the selected product pricing.',
													'quillbooking'
												)}
											</span>
										</Flex>
									) : (
										<Flex
											gap={20}
											align="center"
											className="border-2 border-[#FF3B30] border-dashed bg-[#FBF9FC] rounded-lg py-4 pl-6 mt-5"
										>
											<div className="text-[#FF3B30]">
												<AlertIcon />
											</div>
											<Flex vertical gap={3}>
												<span className="text-[#3F4254] text-[15px] font-semibold">
													{__(
														'Need to Activate WooCommerce!',
														'quillbooking'
													)}
												</span>
												<span className="text-[#71717A] text-[13px] font-medium">
													{__(
														'You Need to Activate WooCommerce Plugin, Please ',
														'quillbooking'
													)}
													<a className="text-color-primary no-underline font-semibold">
														{__(
															'Click here to Activate.',
															'quillbooking'
														)}
													</a>
												</span>
											</Flex>
										</Flex>
									)}
								</>
							)}

							{/* Native Payment Options */}
							{paymentSettings.type === 'native' && (
								<>
									{/* Payment Methods Selection */}
									<Flex vertical gap={2} className="mt-5">
										<div className="text-[#09090B] font-semibold text-[16px]">
											{__(
												'Select One or More',
												'quillbooking'
											)}
										</div>
										<Flex gap={20} className="mb-5">
											<Checkbox
												checked={(paymentSettings.payment_methods || []).includes(
													'paypal'
												)}
												onChange={() =>
													togglePaymentMethod(
														'paypal'
													)
												}
												className={`custom-check border px-4 py-[10px] rounded-lg ${(paymentSettings.payment_methods || []).includes(
													'paypal'
												)
														? 'border-color-primary bg-color-secondary'
														: ''
													}`}
												disabled={isSaving}
											>
												<img
													src={paypal}
													alt="paypal"
													className="paypal-img"
												/>
											</Checkbox>

											<Checkbox
												checked={(paymentSettings.payment_methods || []).includes(
													'stripe'
												)}
												onChange={() =>
													togglePaymentMethod(
														'stripe'
													)
												}
												className={`custom-check border px-4 py-[10px] rounded-lg ${(paymentSettings.payment_methods || []).includes(
													'stripe'
												)
														? 'border-color-primary bg-color-secondary'
														: ''
													}`}
												disabled={isSaving}
											>
												<img
													src={stripe}
													alt="stripe"
													className="stripe-img"
												/>
											</Checkbox>
										</Flex>
									</Flex>

									{/* Duration-based Items */}
									{paymentSettings.enable_items_based_on_duration &&
										allowAttendeesToSelectDuration ? (
										<Flex vertical gap={20}>
											<Header
												header={__(
													'Booking Payment Items',
													'quillbooking'
												)}
												subHeader={__(
													'Manage your Payment Items per Durations for events.',
													'quillbooking'
												)}
											/>
											{map(
												get(
													event,
													'additional_settings.selectable_durations',
													[]
												),
												(duration: number | string) => {
													const durationStr =
														duration.toString();
													const durationItem =
														paymentSettings
															.multi_duration_items[
														durationStr
														] || {
															item: __(
																'Booking Item',
																'quillbooking'
															),
															price: 100,
															duration:
																durationStr,
														};

													return (
														<Card
															key={durationStr}
															className="w-full"
														>
															<Flex vertical>
																<div className="font-semibold text-[#7E8299] mb-5 flex items-center px-3 py-1 bg-[#F1F1F2] rounded-lg w-[140px]">
																	<PiClockClockwiseFill className="text-[18px] mr-1" />{' '}
																	{sprintf(
																		__(
																			'%s minutes',
																			'quillbooking'
																		),
																		duration
																	)}
																</div>
																<Flex gap={10}>
																	<div className="w-full">
																		<div className="text-[#09090B] text-[16px] pb-1">
																			{__(
																				'Booking Payment Items',
																				'quillbooking'
																			)}
																			<span className="text-red-500">
																				*
																			</span>
																		</div>
																		<Input
																			placeholder={__(
																				'Booking Fee',
																				'quillbooking'
																			)}
																			className="h-[48px] rounded-lg w-full"
																			value={
																				durationItem.item
																			}
																			onChange={(
																				e
																			) =>
																				handleDurationItemChange(
																					duration,
																					'item',
																					e
																						.target
																						.value
																				)
																			}
																			disabled={
																				isSaving
																			}
																		/>
																	</div>

																	<div className="w-full">
																		<div className="text-[#09090B] text-[16px] pb-1">
																			{__(
																				'Price',
																				'quillbooking'
																			)}
																			<span className="text-red-500">
																				*
																			</span>
																		</div>
																		<InputNumber
																			placeholder={__(
																				'Price',
																				'quillbooking'
																			)}
																			suffix={
																				<span className="border-l pl-2">
																					$
																				</span>
																			}
																			className="h-[48px] rounded-lg w-full"
																			value={
																				durationItem.price
																			}
																			onChange={(
																				value
																			) =>
																				handleDurationItemChange(
																					duration,
																					'price',
																					value
																				)
																			}
																			disabled={
																				isSaving
																			}
																		/>
																	</div>
																</Flex>
															</Flex>
														</Card>
													);
												}
											)}
										</Flex>
									) : (
										<>
											{/* Regular Items */}
											<Header
												header={__(
													'Booking Payment Items',
													'quillbooking'
												)}
												subHeader={__(
													'Manage your Payment Items for events.',
													'quillbooking'
												)}
											/>
											{paymentSettings.items.map(
												(item, index) => (
													<Flex
														key={index}
														gap={10}
														className="mb-4"
														align="flex-end"
													>
														<div className="w-full">
															<div className="text-[#09090B] text-[16px] pb-2">
																{__(
																	'Booking Payment Items',
																	'quillbooking'
																)}
																<span className="text-red-500">
																	*
																</span>
															</div>
															<Input
																placeholder={__(
																	'Item Name',
																	'quillbooking'
																)}
																className="h-[48px] rounded-lg w-full"
																value={
																	item.item
																}
																onChange={(e) =>
																	handleItemChange(
																		index,
																		'item',
																		e.target
																			.value
																	)
																}
																disabled={
																	isSaving
																}
															/>
														</div>
														<div className="w-full">
															<div className="text-[#09090B] text-[16px] pb-2">
																{__(
																	'Price',
																	'quillbooking'
																)}
																<span className="text-red-500">
																	*
																</span>
															</div>
															<InputNumber
																placeholder={__(
																	'Price',
																	'quillbooking'
																)}
																suffix={
																	<span className="border-l pl-2">
																		$
																	</span>
																}
																className="h-[48px] rounded-lg w-full"
																value={
																	item.price
																}
																onChange={(
																	value
																) =>
																	handleItemChange(
																		index,
																		'price',
																		value
																	)
																}
																disabled={
																	isSaving
																}
															/>
														</div>
														{paymentSettings.items
															.length > 1 && (
																<Button
																	onClick={() =>
																		removeItem(
																			index
																		)
																	}
																	icon={
																		<FaTrash />
																	}
																	className="text-red-500 ml-2"
																	disabled={
																		isSaving
																	}
																/>
															)}
													</Flex>
												)
											)}
											<Button
												onClick={addItem}
												icon={
													<FaPlus className="text-color-primary" />
												}
												className="text-color-primary font-semibold outline-none border-none shadow-none"
												disabled={isSaving}
											>
												{__(
													'Add More Items',
													'quillbooking'
												)}
											</Button>
										</>
									)}
								</>
							)}
						</>
					)}
				</Flex>
			</Card>
		);
	}
);

export default Payments;