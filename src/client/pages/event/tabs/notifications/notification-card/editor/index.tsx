// @ts-nocheck

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

const EmailEditor = ({ value, onChange }: { value: string; onChange: (content: string) => void }) => {
    const [restoreTextMode, setRestoreTextMode] = useState<boolean>(false);
    // Random ID to avoid conflicts
    const editorId = `email-editor-${Math.floor(Math.random() * 100000)}`;

    useEffect(() => {
        if (window.tinymce.get(editorId)) {
            setRestoreTextMode(window.tinymce.get(editorId).isHidden());
            window.wp.oldEditor.remove(editorId);
        }

        window.wp.oldEditor.initialize(editorId, {
            tinymce: {
                toolbar1:
                    "formatselect | styleselect | bold italic strikethrough | forecolor backcolor | link | alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | insert ast_placeholders | fontsizeselect",
                toolbar2:
                    'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
                height: 300, // Set initial height
                setup: function (editor) {
                    editor.on('init', function () {
                        editor.getContainer().style.minHeight = '300px'; // Set min height
                    });
                },
                urlconverter_callback: (url, node, on_save) => {
                    // Check for merge tag format and strip protocol if necessary
                    if (url.startsWith('http://{{') || url.startsWith('https://{{')) {
                        url = url.replace(/^https?:\/\//, ''); // Remove the http or https prefix
                    }

                    // Return the cleaned or original URL
                    return url;
                },
            },
            quicktags: true,
            mediaButtons: true,
        });

        const editor = window.tinymce.get(editorId);
        if (editor?.initialized) {
            onInit();
        } else if (editor) {
            editor.on('init', onInit);
        }
    }, []);

    const onInit = () => {
        const editor = window.tinymce.get(editorId);

        if (restoreTextMode) {
            window.switchEditors.go(editorId, 'html');
        }

        editor.on('NodeChange', debounce(() => {
            const content = editor.getContent({ format: 'html' }); // Fetch as HTML
            onChange(content); // Pass it back
        }, 250));
    }

    // Debounce function with proper typing
    const debounce = (fn: Function, delay: number) => {
        let timer: NodeJS.Timeout | null = null;
        return function () {
            const context = this;
            const args = arguments;
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                fn.apply(context, args);
            }, delay);
        };
    }

    return (
        <textarea
            className='wp-editor-area'
            id={editorId}
            value={value}
            onChange={({ target: { value } }) => {
                onChange(value);
            }}
        />
    );
}

export default EmailEditor;
