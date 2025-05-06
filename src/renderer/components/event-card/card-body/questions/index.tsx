import { Fields } from '../../../../types';
import DynamicFields from './dynamic-fields';

interface QuestionsComponentsProps {
	fields: Fields;
}

const QuestionsComponents: React.FC<QuestionsComponentsProps> = ({
	fields,
}) => {
	const allFields = {
		...fields.system,
		...fields.location,
		...fields.custom,
	};
	const sortedFields = Object.keys(allFields).sort(
		(a, b) => allFields[a].order - allFields[b].order
	);

	console.log(sortedFields);
	console.log(allFields);
	return (
		<div>
			{sortedFields.length > 0 && (
				<>
					{sortedFields.map((fieldKey, index) => (
						<DynamicFields
							allFields={allFields}
							fieldKey={fieldKey}
							onUpdate={() => console.log('update')}
						/>
					))}
				</>
			)}
		</div>
	);
};

export default QuestionsComponents;
