import type { Rule } from 'antd/es/form';
import { __ } from '@wordpress/i18n';

const getValidationRules = (field): Rule[] => {
    const { required, label, type, pattern, settings } = field;
    const rules: Rule[] = [];

    if (required) {
        rules.push({
            required: true,
            message: __(`${label} is required`, '@quillbooking'),
        });
    }

    if (type === 'email') {
        rules.push({
            type: 'email',
            message: __('Please enter a valid email address', '@quillbooking'),
        });
    }

    if (type === 'phone') {
        rules.push({
            pattern: pattern || /^[0-9+\-\s()]*$/,
            message: __('Please enter a valid phone number', '@quillbooking'),
        });
    }

    if (type === 'number') {
        if (settings?.min !== undefined) {
            rules.push({
                type: 'number',
                min: settings.min,
                message: __(`${label} must be at least ${settings.min}`, '@quillbooking'),
            });
        }
        if (settings?.max !== undefined) {
            rules.push({
                type: 'number',
                max: settings.max,
                message: __(`${label} must be at most ${settings.max}`, '@quillbooking'),
            });
        }
        rules.push({
            type: 'number',
            message: __('Please enter a valid number', '@quillbooking'),
        });
    }

    return rules;
};

export default getValidationRules;
