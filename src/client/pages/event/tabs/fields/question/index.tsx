/**
 * Wordpress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card } from 'antd';

/**
 * Internal dependencies
 */
import QuestionInfo from './question-info';
import QuestionActions from './question-actions';
import QuestionInputs from './question-inputs';
import { FieldsGroup } from '@quillbooking/types';

interface QuestionProps {
	fieldKey: string;
	index: number;
	allFields: FieldsGroup;
	onUpdate: (updatedField: any, editingFieldKey: string) => void;
	moveField: (fieldKey: string, direction: 'up' | 'down') => void;
	removeField: (
		fieldKey: string,
		group: 'system' | 'location' | 'custom' | 'other'
	) => void;
	sortedFields: string[];
}
const Question: React.FC<QuestionProps> = ({
	fieldKey,
	allFields,
	onUpdate,
	index,
	moveField,
	removeField,
	sortedFields,
}) => {
	const [type, setType] = useState(allFields[fieldKey].type);

	return (
		<Card
			className="mt-4"
			type="inner"
			key={fieldKey}
			id={`card-${fieldKey}`}
			title={
				<QuestionInfo
					allFields={allFields}
					fieldKey={fieldKey}
					index={index}
					onUpdate={onUpdate}
					setType={setType}
				/>
			}
			extra={
				<QuestionActions
					allFields={allFields}
					onUpdate={onUpdate}
					fieldKey={fieldKey}
					moveField={moveField}
					removeField={removeField}
					sortedFields={sortedFields}
				/>
			}
		>
			<QuestionInputs
				allFields={allFields}
				fieldKey={fieldKey}
				onUpdate={onUpdate}
				type={type}
			/>
		</Card>
	);
};

export default Question;
