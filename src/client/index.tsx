/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * External dependencies
 */
import { ConfigProvider } from 'antd';

/**
 * Internal dependencies
 */
import PageLayout from './layout';
import '@quillbooking/store';
export * from './types';

const appRoot = document.getElementById('quillbooking-admin-root');

if (appRoot) {
    createRoot(appRoot).render(
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#953AE4',
                },
                components: {
                    Button: {
                        algorithm: false,
                    },
                    Input: {
                        paddingBlock: 14,
                        paddingInline: 14,
                    },
                },
            }}
        >
            <PageLayout />
        </ConfigProvider>
    );
}
