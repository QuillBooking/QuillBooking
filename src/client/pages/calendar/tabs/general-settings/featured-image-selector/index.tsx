/**
 * External dependencies
 */
import React from 'react';
import { Button, Card, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { MediaUpload } from '@wordpress/media-utils';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

const { Title, Text } = Typography;

const FeaturedImageSelector: React.FC<{
    value: { id: number; url: string } | null;
    onChange: (newValue: { id: number; url: string } | null) => void;
}> = ({ value, onChange }) => {
    return (
        <Card
            title={<Title level={4}>
                {__('Featured Image', 'quillbooking')}
            </Title>}
            style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}
            actions={value ? [
                (
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onChange(null)}
                    >
                        {__('Remove Image', 'quillbooking')}
                    </Button>
                ),
            ] : []}
        >
            <MediaUpload
                onSelect={(selectedMedia: { id: number; url: string }) => {
                    onChange({
                        id: selectedMedia.id,
                        url: addQueryArgs(selectedMedia.url, { size: 'large' }),
                    });
                }}
                allowedTypes={['image']}
                render={({ open }: { open: () => void }) => (
                    <div
                        style={{
                            width: '100%',
                            height: 200,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: value ? 'transparent' : '#fafafa',
                            border: value ? 'none' : '1px dashed #d9d9d9',
                            borderRadius: 8,
                            marginBottom: 10,
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                        }}
                        onClick={open}
                    >
                        {value ? (
                            <img
                                src={value.url}
                                alt="Featured"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : (
                            <Text type="secondary">
                                {__('Click to select a featured image.', 'quillbooking')}
                            </Text>
                        )}
                    </div>
                )}
            />
        </Card>
    );
};

export default FeaturedImageSelector;