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
import slugify from 'slugify';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import './style.scss';
import {
	CardHeader,
	ProVersion,
	QuestionOutlineIcon,
} from '@quillbooking/components';
import { EventTabHandle, EventTabProps, Fields, FieldType } from 'client/types';
import Question from './question';
import { doAction } from '@wordpress/hooks';

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
		const { state: event } = useEventContext();
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
			console.log('Updating field', values, editingFieldKey);
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
				console.log('Saving fields', fields);

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
						console.log('Fields saved successfully');
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

		const addField = () => {
			doAction('quillbooking.event.fields.add_field', event, fields);
			setShowModal(true);

			// if (!fields) return;
			// const order =
			// 	Object.keys(fields?.system || {}).length +
			// 	Object.keys(fields?.location || {}).length +
			// 	Object.keys(fields?.custom || {}).length +
			// 	1;
			// const defaultLabel =
			// 	__('New Question', 'quillbooking') + ' ' + order;
			// const newFieldKey = slugify(defaultLabel, { lower: true });
			// const newField: FieldType = {
			// 	label: defaultLabel,
			// 	type: 'text', // default type
			// 	required: false,
			// 	group: 'custom',
			// 	event_location: 'all',
			// 	placeholder: '',
			// 	order: order,
			// 	settings: {},
			// 	enabled: true,
			// };
			// const updatedFields = {
			// 	...fields,
			// 	custom: { ...fields.custom, [newFieldKey]: newField },
			// };
			// setFields(updatedFields);
			// props.setDisabled(false);
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

						<div
							className="w-full text-center border border-color-primary text-color-primary rounded-lg py-4 border-dashed bg-color-secondary font-bold cursor-pointer hover:bg-color-primary hover:text-white transition-all duration-200 ease-in-out mt-2"
							onClick={addField}
						>
							<div className="flex items-center justify-center gap-2">
								<PlusOutlined />
								{__('Add New Question', 'quillbooking')}
							</div>
						</div>
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
				>
					<ProVersion />
				</Modal>
			</>
		);
	}
);
export default EventFieldsTab;
