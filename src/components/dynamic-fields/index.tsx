/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import React from 'react';

/**
 * External dependencies
 */
import { Form, Input, Checkbox } from 'antd';

/**
 * Internal dependencies
 */
import { LocationField } from '@quillbooking/config';

interface DynamicFormFieldProps {
	field: LocationField;
	fieldKey: string;
	namePrefix?: string[];
}

/**
 * DynamicFormField component
 * 
 * Renders a form field based on the field type passed in props
 */
const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
	field,
	fieldKey,
	namePrefix = ['fields']
}) => {
	const renderField = () => {
		switch (field.type) {
			case 'text':
				return <Input placeholder={field.desc} />;
			case 'checkbox':
				return <Checkbox>{field.desc}</Checkbox>;
			case 'url':
				return <Input type="url" placeholder={field.desc} />;
			default:
				return <Input placeholder={field.desc} />;
		}
	};

	return (
		<Form.Item
			key={fieldKey}
			name={[...namePrefix, fieldKey]}
			label={field.label}
			rules={[{ required: field.required }]}
		>
			{renderField()}
		</Form.Item>
	);
};

export default DynamicFormField;