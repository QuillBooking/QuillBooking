/**
 * Wordpress dependencies
 */
import { MediaUpload } from '@wordpress/media-utils';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { Flex } from 'antd';
import { LuCloudUpload } from "react-icons/lu";

/**
 * Internal dependencies
 */
import { ImgIcon } from '@quillbooking/components';

const FeaturedImageSelector: React.FC<{
    value: { id: number; url: string } | null;
    onChange: (newValue: { id: number; url: string } | null) => void;
}> = ({ value, onChange }) => {
    return (
        <Flex vertical className='w-full'>
            <div className='text-[#09090B] text-[20px] font-semibold'>{__('Featured Image', 'quillbooking')}</div>
            <div className='text-[#71717A] text-base'>{__('Will be shown on landing page social share meta or profile block.', 'quillbooking')}</div>
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
                            backgroundColor: value ? 'transparent' : '#F1E0FF',
                            border: value ? 'none' : '1px solid #FBF9FC',
                        }}
                        onClick={open}
                        className='my-3 w-full h-[200px] flex justify-center items-center rounded-lg cursor-pointer overflow-hidden'
                    >
                        {value ? (
                            <img
                                src={value.url}
                                alt="Featured"
                                className='size-full object-cover'
                            />
                        ) : (
                            <Flex vertical justify='center' align='center' gap={30} className='text-color-primary'>
                                <ImgIcon />
                                <Flex vertical gap={10} align='center'>
                                    <Flex gap={10}>
                                        <LuCloudUpload size={25} />
                                        <div className='text-base font-medium'>{__('Upload Image', 'quillbooking')}</div>
                                    </Flex>
                                    <Flex vertical justify='content' align='center' className='text-[#8B8D97]'>
                                        <span>{__('Upload a cover image for your Featured Page.', 'quillbooking')}</span>
                                        <span className='text-xs'>{__('File Format jpeg, png Recommened Size 1280x600 (1:1)', 'quillbooking')}</span>
                                    </Flex>
                                </Flex>
                            </Flex>
                        )}
                    </div>
                )
                }
            />
        </Flex >
    );
};

export default FeaturedImageSelector;