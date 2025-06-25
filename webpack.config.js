/**
 * External dependencies
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RtlCssPlugin = require('rtlcss-webpack-plugin');

const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
    ...defaultConfig,
    module: {
        ...defaultConfig.module,
    },
    resolve: {
        ...defaultConfig.resolve,
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@quillbooking/navigation': path.resolve(__dirname, 'src/navigation'),
            '@quillbooking/stores': path.resolve(__dirname, 'src/stores'),
            '@quillbooking/config': path.resolve(__dirname, 'src/config'),
            '@quillbooking/client': path.resolve(__dirname, 'src/client/index.tsx'),
            '@quillbooking/components': path.resolve(__dirname, 'src/components'),
            "@quillbooking/constants": path.resolve(__dirname, 'src/constants'),
            "@quillbooking/utils": path.resolve(__dirname, 'src/utils'),
            "@quillbooking/hooks": path.resolve(__dirname, 'src/hooks'),
            "@quillbooking/assets": path.resolve(__dirname, 'assets')

        },
    },
    plugins: [
        // Remove css file from default config
        ...defaultConfig.plugins.map(
            (plugin) => {
                if (plugin instanceof MiniCssExtractPlugin) {
                    plugin.options.filename = 'style.css';
                    return plugin;
                }

                if (plugin instanceof RtlCssPlugin) {
                    plugin.options.filename = 'style-rtl.css';
                    return plugin;
                }

                return plugin;
            }
        ),
    ],
    output: {
        ...defaultConfig.output,
        filename: 'index.js',
    },
};