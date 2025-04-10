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
import { Card, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import slugify from 'slugify';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import './style.scss';
import { CardHeader, QuestionOutlineIcon } from '@quillbooking/components';
import {
	EventFieldsTabHandle,
	EventFieldsTabProps,
	Fields,
	FieldType,
} from 'client/types';
import Question from './question';

const EventFieldsTab = forwardRef<EventFieldsTabHandle, EventFieldsTabProps>(
	(props, ref) => {
		const { state: event } = useEventContext();
		const { callApi, loading } = useApi();
		const { callApi: saveApi } = useApi();
		const { successNotice, errorNotice } = useNotice();
		const [fields, setFields] = useState<Fields | null>(null);
		const [editingFieldKey, setEditingFieldKey] = useState<string | null>(
			null
		);

		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				if (fields) {
					saveFields(fields);
				}
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

		const handleSave = (values: any) => {
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
			console.log(updatedFields);
			setFields(updatedFields);
			props.setDisabled(false);

		};

		const saveFields = (fields: Fields) => {
			if (!event) return;
			saveApi({
				path: `events/${event.id}`,
				method: 'POST',
				data: {
					fields,
				},
				onSuccess() {
					successNotice(
						__('Fields saved successfully', 'quillbooking')
					);
					setEditingFieldKey(null);
				},
				onError(error) {
					errorNotice(error.message);
				},
			});
		};

		const addField = () => {
			if (!fields) return;
			const order =
				Object.keys(fields?.system || {}).length +
				Object.keys(fields?.location || {}).length +
				Object.keys(fields?.custom || {}).length +
				1;
			const defaultLabel = __('New Question', 'quillbooking') + order;
			const newFieldKey = slugify(defaultLabel, { lower: true });
			const newField: FieldType = {
				label: defaultLabel,
				type: 'text', // default type
				required: false,
				group: 'custom',
				event_location: 'all',
				placeholder: '',
				order: order,
				settings: {},
			};
			const updatedFields = {
				...fields,
				custom: { ...fields.custom, [newFieldKey]: newField },
			};
			setFields(updatedFields);
			props.setDisabled(false);

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

				return reorderedFields;
			});
		};

		if (loading || !fields) {
			return <Skeleton active />;
		}

		const allFields = fields
			? { ...fields.system, ...fields.location, ...fields.custom }
			: {};
		const sortedFields = Object.keys(allFields).sort(
			(a, b) => allFields[a].order - allFields[b].order
		);

		const otherFields = { ...fields.other };

		return (
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
									handleSave={handleSave}
									index={index}
									moveField={moveField}
									removeField={removeField}
									setEditingFieldKey={setEditingFieldKey}
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
								handleSave={handleSave}
								index={index}
								moveField={moveField}
								removeField={removeField}
								setEditingFieldKey={setEditingFieldKey}
								sortedFields={Object.keys(otherFields)}
							/>
						))}
					</>
				</Card>
			</Card>
		);
	}
);
export default EventFieldsTab;
