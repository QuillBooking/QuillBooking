/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Modal, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useApi, useNotice, useEvent } from '@quillbooking/hooks';
import './style.scss';
import {
	CardHeader,
	ProIcon,
	QuestionOutlineIcon,
} from '@quillbooking/components';
import { EventTabHandle, EventTabProps, Fields } from '@quillbooking/types';
import Question from './question';
import { applyFilters } from '@wordpress/hooks';
import { Link } from 'react-router-dom';

const LoadingSkeleton = () => (
	<Card>
		<Skeleton active paragraph={{ rows: 2 }} />
		<Card className="mt-4">
			<Skeleton.Input active size="large" block className="mb-4" />
			<Skeleton.Input active size="small" block className="mb-2" />
			{[1, 2].map((i) => (
				<Card key={i} className="mt-4">
					<Skeleton active paragraph={{ rows: 3 }} />
				</Card>
			))}
		</Card>
		<Card className="mt-4">
			<Skeleton.Input active size="large" block className="mb-4" />
			<Skeleton.Input active size="small" block className="mb-2" />
			<Card className="mt-4">
				<Skeleton active paragraph={{ rows: 2 }} />
			</Card>
		</Card>
	</Card>
);

const EventFieldsTab = forwardRef<EventTabHandle, EventTabProps>(
	(props, ref) => {
		const { currentEvent: event } = useEvent();
		const { callApi, loading } = useApi();
		const { callApi: saveApi } = useApi();
		const { successNotice, errorNotice } = useNotice();
		const [fields, setFields] = useState<Fields | null>(null);
		const [showModal, setShowModal] = useState(false);

		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				if (fields) {
					return saveFields(fields);
				}
				return Promise.resolve();
			},
		}));

		useEffect(() => {
			if (event) {
				fetchFields();
			}
		}, [event]);

		const fetchFields = () => {
			if (!event) return;
			callApi({
				path: `events/${event.id}/meta/fields`,
				method: 'GET',
				onSuccess(response: Fields) {
					setFields(response);
				},
				onError(error) {
					errorNotice(error.message);
				},
			});
		};

		const handleUpdate = (values: any, editingFieldKey: string) => {
			if (!fields || !editingFieldKey) return;
			const updatedFields = { ...fields };
			const group = updatedFields.system[editingFieldKey]
				? 'system'
				: updatedFields.location[editingFieldKey]
					? 'location'
					: updatedFields.other?.[editingFieldKey]
						? 'other'
						: 'custom';
			const updatedField = {
				...(updatedFields[group]?.[editingFieldKey] ?? {}),
				...values,
			};

			(updatedFields[group] ??= {})[editingFieldKey] = updatedField;
			setFields(updatedFields);
			props.setDisabled(false);
		};

		const saveFields = async (fields: Fields) => {
			try {
				// Validate required data
				if (!event) {
					console.warn('Cannot save fields - event is undefined');
					return;
				}

				// Validate fields structure if needed
				if (!fields || typeof fields !== 'object') {
					console.error('Invalid fields data structure:', fields);
					throw new Error('Invalid fields data');
				}

				await saveApi({
					path: `events/${event.id}`,
					method: 'POST',
					data: {
						fields: structuredClone(fields), // Deep clone to avoid mutation issues
					},
					onSuccess() {
						props.setDisabled(true);
					},
					onError(error) {
						console.error('API error while saving fields:', error);
						throw new Error(error.message); // Re-throw to be caught by outer try-catch
					},
				});
			} catch (error: any) {
				console.error('Failed to save fields:', error);
				// Consider adding error recovery or state reset here if needed
				throw new Error(error.message); // Re-throw to allow calling code to handle
			}
		};

		const removeField = async (
			fieldKey: string,
			group: 'system' | 'location' | 'custom' | 'other'
		) => {
			if (!event || !fields) return;

			const updatedFields = { ...fields };
			delete (updatedFields[group] ?? {})[fieldKey];
			setFields(updatedFields);
			props.setDisabled(false);
		};

		const moveField = (fieldKey: string, direction: 'up' | 'down') => {
			props.setDisabled(false);
			setFields((prevFields) => {
				if (!prevFields) {
					return { system: {}, location: {}, custom: {} };
				}
				const allFields = {
					...prevFields.system,
					...prevFields.location,
					...prevFields.custom,
				};
				const sortedFields = Object.keys(allFields).sort(
					(a, b) => allFields[a].order - allFields[b].order
				);
				const index = sortedFields.indexOf(fieldKey);
				if (index === -1) return prevFields;

				const newIndex = direction === 'up' ? index - 1 : index + 1;
				if (newIndex < 0 || newIndex >= sortedFields.length)
					return prevFields;

				const temp = sortedFields[index];
				sortedFields[index] = sortedFields[newIndex];
				sortedFields[newIndex] = temp;

				const reorderedFields = sortedFields.reduce(
					(acc, key, idx) => {
						const group = prevFields.system[key]
							? 'system'
							: prevFields.location[key]
								? 'location'
								: 'custom';
						acc[group][key] = {
							...prevFields[group][key],
							order: idx + 1,
						};
						return acc;
					},
					{ system: {}, location: {}, custom: {} } as Fields
				);
				reorderedFields.other = prevFields.other || {};

				return reorderedFields;
			});
		};

		if (loading || !fields) {
			return <LoadingSkeleton />;
		}

		const allFields = fields
			? { ...fields.system, ...fields.location, ...fields.custom }
			: {};

		const sortedFields = Object.keys(allFields).sort(
			(a, b) => allFields[a].order - allFields[b].order
		);

		const otherFields = { ...fields.other };

		return (
			<>
				<Card>
					<CardHeader
						title={__('Question Settings', 'quillbooking')}
						description={__(
							'Customize the queston asked on the booking page.',
							'quillbooking'
						)}
						icon={<QuestionOutlineIcon width={24} height={24} />}
						border={false}
					/>

					<Card>
						<div>
							<h3 className="text-xl font-semibold text-color-primary-text">
								{__('Booking Questions', 'quillbooking')}
							</h3>
							<p className="text-base font-normal text-[#71717A]">
								{__(
									'To lock the timezone on booking page, useful for in-person events',
									'quillbooking'
								)}
							</p>
						</div>

						{sortedFields.length > 0 && (
							<>
								{sortedFields.map((fieldKey, index) => (
									<Question
										allFields={allFields}
										fieldKey={fieldKey}
										onUpdate={handleUpdate}
										index={index}
										moveField={moveField}
										removeField={removeField}
										sortedFields={sortedFields}
									/>
								))}
							</>
						)}

						{
							applyFilters(
								'quillbooking.event.fields.add_field_component',
								<div
									className="w-full text-center border border-color-primary text-color-primary rounded-lg py-4 border-dashed bg-color-secondary font-bold cursor-pointer hover:bg-color-primary hover:text-white transition-all duration-200 ease-in-out mt-2"
									onClick={() => setShowModal(true)}
								>
									<div className="flex items-center justify-center gap-2">
										<PlusOutlined />
										{__('Add New Question', 'quillbooking')}
									</div>
								</div>,
								{
									event,
									fields,
									setFields,
									setDisabled: props.setDisabled,
								}
							) as any
						}
					</Card>

					<Card className="mt-4">
						<div>
							<h3 className="text-xl font-semibold text-color-primary-text">
								{__('Other Questions', 'quillbooking')}
							</h3>
							<p className="text-base font-normal text-[#71717A]">
								{__(
									'Customize Booking Cancel and Reschedule Fields',
									'quillbooking'
								)}
							</p>
						</div>

						<>
							{Object.keys(otherFields).map((fieldKey, index) => (
								<Question
									allFields={otherFields}
									fieldKey={fieldKey}
									onUpdate={handleUpdate}
									index={index}
									moveField={moveField}
									removeField={removeField}
									sortedFields={Object.keys(otherFields)}
								/>
							))}
						</>
					</Card>
				</Card>
				<Modal
					open={showModal}
					onCancel={() => setShowModal(false)}
					footer={null}
					getContainer={false}
					width={800}
				>
					<div className="flex flex-col items-center text-center py-10">
						<div className="bg-[#F1E0FF] rounded-full p-4 mb-2 flex items-center justify-center">
							<ProIcon width={72} height={72} />
						</div>
						<div>
							<h2 className="text-base font-semibold my-1 text-[#3F4254]">
								{__(
									'Add another Questions feature is available in Pro Version',
									'quillbooking'
								)}
							</h2>
							<p className="text-[#9197A4] mb-4 text-xs">
								{__(
									'Please upgrade to get all the advanced features.',
									'quillbooking'
								)}
							</p>
							<div className="mt-5">
								<Link
									className="bg-color-primary text-[#FBF9FC] rounded-lg py-3 px-4 font-medium"
									to="/plugins.php?s=quillbooking-pro&tab=search&type=term"
								>
									{__('Upgrade To Pro Now', 'quillbooking')}
								</Link>
							</div>
						</div>
					</div>
				</Modal>
			</>
		);
	}
);
export default EventFieldsTab;
