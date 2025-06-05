/**
 * WordPress Dependencies
 */
import {
	useEffect,
	useState,
	forwardRef,
	useImperativeHandle,
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
import { FaPlus } from 'react-icons/fa';

/**
 * Internal Dependencies
 */
import {
	useApi,
	useNotice,
	useBreadcrumbs,
	useGlobalSettings,
} from '@quillbooking/hooks';
import {
	AlertIcon,
	CardHeader,
	Header,
	PaymentIcon,
	ProductSelect,
	TrashIcon,
} from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import { useEventContext } from '../../state/context';
import './style.scss';
import paypal from '@quillbooking/assets/icons/paypal/paypal.png';
import stripe from '@quillbooking/assets/icons/stripe/stripe.png';
import { PaymentsSettings } from 'client/types';
import { getCurrencySymbol } from '@quillbooking/utils';

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
		const setBreadcrumbs = useBreadcrumbs();
		const { successNotice } = useNotice();
		const [dataFetched, setDataFetched] = useState(false);
		const { settings: globalSettings, loading: globalSettingsLoading } =
			useGlobalSettings();

		// Single state for all payment settings with default values
		const [paymentSettings, setPaymentSettings] =
			useState<PaymentsSettings>({} as PaymentsSettings);

		// Get the currency from global settings
		const globalCurrency = get(globalSettings, 'payments.currency', 'USD');

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

		const togglePaymentMethod = (method) => {
			const currentMethods = paymentSettings.payment_methods || [];
			const methodExists = currentMethods.includes(method);

			const newPaymentMethods = methodExists
				? currentMethods.filter((item) => item !== method)
				: [...currentMethods, method];

			const newPaymentSettings = {
				...paymentSettings,
				payment_methods: newPaymentMethods,
				enable_paypal: newPaymentMethods.includes('paypal'),
				enable_stripe: newPaymentMethods.includes('stripe'),
			};

			// Explicitly set the boolean flags based on whether methods exist in the array
			newPaymentSettings.enable_paypal =
				newPaymentMethods.includes('paypal');
			newPaymentSettings.enable_stripe =
				newPaymentMethods.includes('stripe');

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

		const handleDurationItemChange = (
			duration: number | string,
			field: string,
			value: any
		) => {
			const durationStr = duration.toString();
			setPaymentSettings((prev) => {
				// Create a proper object structure if it's currently an array
				let currentItems = prev.multi_duration_items;

				// If multi_duration_items is an array, convert it to an object
				if (Array.isArray(currentItems)) {
					const newItems = {};

					// Transfer any existing items from the array to the object
					for (let i = 0; i < currentItems.length; i++) {
						if (currentItems[i]) {
							const item = currentItems[i];
							newItems[item.duration] = item;
						}
					}

					currentItems = newItems;
				}

				// Create or update the specific duration item
				const updatedItems = {
					...currentItems,
					[durationStr]: {
						...(currentItems[durationStr] || {}),
						duration: durationStr,
						item:
							currentItems[durationStr]?.item ||
							__('Booking Item', 'quillbooking'),
						price: currentItems[durationStr]?.price || 100,
						woo_product:
							currentItems[durationStr]?.woo_product || 0,
						[field]: value,
					},
				};

				return {
					...prev,
					multi_duration_items: updatedItems,
				};
			});
			props.setDisabled(false);
		};

		// Fetch settings only once when the event is loaded
		useEffect(() => {
			if (!event?.id || dataFetched) return;

			callApi({
				path: `events/${event.id}/meta/payments_settings`,
				method: 'GET',
				onSuccess(response: PaymentsSettings) {
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
						// Ensure multi_duration_items is always an object, not an array
						multi_duration_items: Array.isArray(
							response.multi_duration_items
						)
							? {} // Convert array to empty object if needed
							: response.multi_duration_items || {},
						// Ensure payment_methods is always an array
						payment_methods: response.payment_methods || [],
					};

					// Ensure payment_methods and boolean flags are in sync
					responseWithDefaults.enable_paypal =
						responseWithDefaults.payment_methods.includes('paypal');
					responseWithDefaults.enable_stripe =
						responseWithDefaults.payment_methods.includes('stripe');
					responseWithDefaults.type = response.type || 'native';

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
								] =
									responseWithDefaults.type === 'woocommerce'
										? {
												woo_product: 0,
												duration: durationStr,
											}
										: {
												item: __(
													'Booking Item',
													'quillbooking'
												),
												price: 100,
												duration: durationStr,
											};
							}
						});
					}

					setPaymentSettings(responseWithDefaults);
					setDataFetched(true);
				},
				onError(error) {
					setDataFetched(true);
					throw new Error(error.message);
				},
			});

			// Set breadcrumbs
			setBreadcrumbs([
				{
					path: `calendars/${event.calendar_id}/events/${event.id}/payments`,
					title: __('Payments Settings', 'quillbooking'),
				},
			]);
		}, [event?.id]);

		useEffect(() => {
			if (paymentSettings.enable_items_based_on_duration) {
				const selectableDurations = get(
					event,
					'additional_settings.selectable_durations',
					[]
				);

				if (selectableDurations.length) {
					const updatedItems = {
						...paymentSettings.multi_duration_items,
					};
					let hasChanges = false;

					selectableDurations.forEach((duration) => {
						const durationStr = duration.toString();
						if (!updatedItems[durationStr]) {
							updatedItems[durationStr] = {
								item: __('Booking Item', 'quillbooking'),
								price: 100,
								woo_product: 0,
								duration: durationStr,
							};
							hasChanges = true;
						} else {
							const item = updatedItems[durationStr];
							if (!item.item) {
								item.item = __('Booking Item', 'quillbooking');
								hasChanges = true;
							}
							if (!item.price) {
								item.price = 100;
								hasChanges = true;
							}
							if (!item.woo_product) {
								item.woo_product = 0;
								hasChanges = true;
							}
						}
					});

					if (hasChanges) {
						setPaymentSettings((prev) => ({
							...prev,
							multi_duration_items: updatedItems,
						}));
					}
				}
			}
		}, [paymentSettings.enable_items_based_on_duration, event]);

		const saveSettings = async () => {
			try {
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

				// Validate payment settings before sending to API
				if (paymentSettings.enable_payment) {
					// Check for native payment type
					if (
						paymentSettings.type === 'native' &&
						(!paymentSettings.payment_methods ||
							paymentSettings.payment_methods.length === 0)
					) {
						throw new Error(
							__(
								'Payment is enabled but no payment gateway is selected. Please select at least one payment gateway.',
								'quillbooking'
							)
						);
					}

					// Check for WooCommerce payment type
					if (paymentSettings.type === 'woocommerce') {
						if (paymentSettings.enable_items_based_on_duration) {
							// Check if all duration items have a woo_product selected
							const selectableDurations = get(
								event,
								'additional_settings.selectable_durations',
								[]
							);

							for (const duration of selectableDurations) {
								const durationStr = duration.toString();
								const durationItem =
									paymentSettings.multi_duration_items[
										durationStr
									];

								if (
									!durationItem ||
									!durationItem.woo_product
								) {
									throw new Error(
										sprintf(
											__(
												'Payment is enabled with WooCommerce checkout for multiple durations, but no WooCommerce product is selected for the %s minute duration. Please select a product for each duration.',
												'quillbooking'
											),
											duration
										)
									);
								}
							}
						} else if (
							!paymentSettings.woo_product ||
							paymentSettings.woo_product === 0
						) {
							throw new Error(
								__(
									'Payment is enabled with WooCommerce checkout, but no WooCommerce product is selected. Please select a product.',
									'quillbooking'
								)
							);
						}
					}
				}

				// Ensure payment_methods array and boolean flags are consistent before saving
				const finalPaymentSettings = {
					...paymentSettings,
					payment_methods: paymentSettings.payment_methods || [],
					enable_paypal: (
						paymentSettings.payment_methods || []
					).includes('paypal'),
					enable_stripe: (
						paymentSettings.payment_methods || []
					).includes('stripe'),
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
					},
					onError(error) {
						props.setDisabled(false);
						throw new Error(error.message);
					},
				});
			} catch (error: any) {
				props.setDisabled(false);
				throw error;
			}
		};

		if (loading && !dataFetched) {
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
									disabled={loading}
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
										disabled={loading}
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
											disabled={loading}
										/>
									</Flex>
								)}
							</Flex>
						)}
					</Flex>

					{paymentSettings.enable_payment && (
						<>
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
									disabled={loading}
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

							{paymentSettings.type === 'woocommerce' && (
								<>
									{isWooCommerceEnabled ? (
										<>
											{paymentSettings.enable_items_based_on_duration &&
											allowAttendeesToSelectDuration ? (
												<Flex vertical gap={20}>
													{map(
														get(
															event,
															'additional_settings.selectable_durations',
															[]
														),
														(
															duration:
																| number
																| string
														) => {
															const durationStr =
																duration.toString();
															const durationItem =
																paymentSettings
																	.multi_duration_items[
																	durationStr
																] || {
																	duration:
																		durationStr,
																	woo_product: 0,
																};

															return (
																<Card
																	key={
																		durationStr
																	}
																	className="w-full"
																>
																	<Flex
																		vertical
																	>
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
																		<Flex
																			vertical
																			gap={
																				4
																			}
																		>
																			<div className="text-[#3F4254] font-semibold text-[16px]">
																				{__(
																					'Select Product',
																					'quillbooking'
																				)}
																			</div>
																			<ProductSelect
																				placeholder={__(
																					'Select a WooCommerce product...',
																					'quillbooking'
																				)}
																				onChange={(
																					value
																				) =>
																					handleDurationItemChange(
																						duration,
																						'woo_product',
																						value
																					)
																				}
																				value={
																					durationItem.woo_product ||
																					0
																				}
																			/>
																		</Flex>
																	</Flex>
																</Card>
															);
														}
													)}
												</Flex>
											) : (
												<Flex
													vertical
													gap={4}
													className="mt-6"
												>
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
														onChange={(value) =>
															handleSettingsChange(
																'woo_product',
																value
															)
														}
														value={
															paymentSettings.woo_product ||
															0
														}
													/>
													<span className="text-[#71717A] text-[16px] font-medium">
														{__(
															'The selected product will be used for checkout in WooCommerce. The amount will be equal to the selected product pricing.',
															'quillbooking'
														)}
													</span>
												</Flex>
											)}
										</>
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

							{paymentSettings.type === 'native' && (
								<>
									<Flex vertical gap={2} className="mt-5">
										<div className="text-[#09090B] font-semibold text-[16px]">
											{__(
												'Select One or More',
												'quillbooking'
											)}
											<span className="text-red-500 ml-1">
												*
											</span>
										</div>
										{/* Show warning message if no payment methods selected */}
										{(paymentSettings.payment_methods || [])
											.length === 0 && (
											<div className="text-[#FF3B30] text-[14px] font-medium mb-2">
												{__(
													'Please select at least one payment gateway.',
													'quillbooking'
												)}
											</div>
										)}
										<Flex gap={20} className="mb-5">
											<Checkbox
												checked={(
													paymentSettings.payment_methods ||
													[]
												).includes('paypal')}
												onChange={() =>
													togglePaymentMethod(
														'paypal'
													)
												}
												className={`custom-check border px-4 py-[10px] rounded-lg ${
													(
														paymentSettings.payment_methods ||
														[]
													).includes('paypal')
														? 'border-color-primary bg-color-secondary'
														: ''
												}`}
												disabled={loading}
											>
												<img
													src={paypal}
													alt="paypal"
													className="paypal-img"
												/>
											</Checkbox>

											<Checkbox
												checked={(
													paymentSettings.payment_methods ||
													[]
												).includes('stripe')}
												onChange={() =>
													togglePaymentMethod(
														'stripe'
													)
												}
												className={`custom-check border px-4 py-[10px] rounded-lg ${
													(
														paymentSettings.payment_methods ||
														[]
													).includes('stripe')
														? 'border-color-primary bg-color-secondary'
														: ''
												}`}
												disabled={loading}
											>
												<img
													src={stripe}
													alt="stripe"
													className="stripe-img"
												/>
											</Checkbox>
										</Flex>
									</Flex>

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
																				loading
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
																					{getCurrencySymbol(
																						globalCurrency
																					)}
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
																				loading
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
																	loading
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
																		{getCurrencySymbol(
																			globalCurrency
																		)}
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
																	loading
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
																	<TrashIcon
																		width={
																			20
																		}
																		height={
																			20
																		}
																	/>
																}
																className="ml-2 border-none shadow-none text-[#E91E63]"
																disabled={
																	loading
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
												className="text-color-primary font-semibold outline-none border-none shadow-none flex items-start justify-start"
												disabled={loading}
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
