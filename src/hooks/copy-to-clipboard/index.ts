/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';

const useCopyToClipboard = () => {
    const { createNotice } = useDispatch('quillbooking/core');

    const copy = (text: string, successMessage: string) => {
        navigator.clipboard.writeText(text);
        createNotice({ type: 'success', message: successMessage });
    };

    return copy;
};

export default useCopyToClipboard;