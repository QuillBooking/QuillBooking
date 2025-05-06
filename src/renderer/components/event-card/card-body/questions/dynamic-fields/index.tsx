import { useState } from 'react';
import { FieldsGroup, FieldType } from '../../../../../types';
import { Checkbox, Form, Input } from 'antd';

interface DynamicFieldsProps {
	fieldKey: string;
	allFields: FieldsGroup;
	onUpdate: (updatedField: any, editingFieldKey: string) => void;
}

const DynamicFields: React.FC<DynamicFieldsProps> = ({
	allFields,
	fieldKey,
	onUpdate,
}) => {
	const [type, setType] = useState(allFields[fieldKey].type);
	const field: FieldType = allFields[fieldKey];
	const renderField = () => {
		switch (field.type) {
			case 'text':
				return <Input placeholder={field.placeholder} />;
        case 'text':
				return <Input placeholder={field.placeholder} />;
			case 'checkbox':
				return <Checkbox>{field.placeholder}</Checkbox>;
			case 'url':
				return <Input type="url" placeholder={field.placeholder} />;
			default:
				return <Input placeholder={field.placeholder} />;
		}
	};

	return (
		<Form.Item
			key={fieldKey}
			name={fieldKey}
			label={field.label}
			rules={[{ required: field.required }]}
		>
			{renderField()}
		</Form.Item>
	);
};

export default DynamicFields;
