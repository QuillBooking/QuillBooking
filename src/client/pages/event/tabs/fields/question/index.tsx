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
import { Fields, FieldsGroup } from 'client/types';

interface QuestionProps {
	fieldKey: string;
	index: number;
	allFields: FieldsGroup;
	handleSave: (updatedField: Fields) => void;
	setEditingFieldKey: (key: string) => void;
	moveField: (fieldKey: string, direction: 'up' | 'down') => void;
	removeField: (
		fieldKey: string,
		group: 'system' | 'location' | 'custom' | 'other'
	) => void;
	sortedFields: string[];
	// setDisabled: (disabled: boolean) => void;
}
const Question: React.FC<QuestionProps> = ({
	fieldKey,
	allFields,
	handleSave,
	index,
	moveField,
	removeField,
	sortedFields,
	// setDisabled,
	setEditingFieldKey,
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
					handleSave={handleSave}
					setEdtingField={setEditingFieldKey}
					setType={setType}
				/>
			}
			extra={
				<QuestionActions
					allFields={allFields}
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
				handleChange={handleSave}
				setEdtingField={setEditingFieldKey}
				type={type}
				// handleChange={() => props.setDisabled(false)}
			/>
		</Card>
	);
};

export default Question;
