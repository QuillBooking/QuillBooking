/**
 * Wordpress dependencies
 */
import { useDispatch } from '@wordpress/data';

const useNotice = () => {
    const { createNotice } = useDispatch('quillbooking/core');

    const successNotice = (message: string) => {
        createNotice({
            type: 'success',
            message: message,
        });
    };

    const errorNotice = (message: string) => {
        createNotice({
            type: 'error',
            message: message,
        });
    };

    const infoNotice = (message: string) => {
        createNotice({
            type: 'info',
            message: message,
        });
    };

    return { successNotice, errorNotice, infoNotice };
};

export default useNotice;
