/**
 * External dependencies
 */
import React from 'react';
import { Avatar, Button, Card, Typography, Tooltip } from 'antd';
import { UserOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { MediaUpload } from '@wordpress/media-utils';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

const { Title } = Typography;

const AvatarSelector: React.FC<{
    value: { id: number; url: string } | null;
    onChange: (newValue: { id: number; url: string } | null) => void;
}> = ({ value, onChange }) => {
    return (
        <Card
            title={<Title level={5}>{__('Avatar', 'text-domain')}</Title>}
            style={{ width: 200, textAlign: 'center' }}
            actions={value ? [
                (
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onChange(null)}
                    >
                        {__('Remove', 'text-domain')}
                    </Button>
                ),
            ] : []}
        >
            <MediaUpload
                onSelect={(selectedMedia: { id: number; url: string }) => {
                    onChange({
                        id: selectedMedia.id,
                        url: addQueryArgs(selectedMedia.url, { size: 'thumbnail' }),
                    });
                }}
                allowedTypes={['image']}
                render={({ open }: { open: () => void }) => (
                    <div
                        style={{
                            position: 'relative',
                            width: 120,
                            height: 120,
                            margin: 'auto',
                            cursor: 'pointer',
                        }}
                        onClick={open}
                    >
                        <Avatar
                            size={120}
                            src={value ? value.url : undefined}
                            icon={!value && <UserOutlined />}
                            style={{
                                border: '2px solid #1890ff',
                                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                            }}
                        />
                        {!value && (
                            <Tooltip title={__('Add Avatar', 'text-domain')}>
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: '#fff',
                                        borderRadius: '50%',
                                    }}
                                >
                                    <PlusOutlined style={{ fontSize: 24 }} />
                                </div>
                            </Tooltip>
                        )}
                    </div>
                )}
            />
        </Card>
    );
};

export default AvatarSelector;