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
import { Avatar, Flex } from 'antd';
import { LuCloudUpload } from "react-icons/lu";

/**
 * Internal dependencies
 */
import { ImgIcon } from '@quillbooking/components';

const AvatarSelector: React.FC<{
    value: { id: number; url: string } | null;
    onChange: (newValue: { id: number; url: string } | null) => void;
}> = ({ value, onChange }) => {
    return (
        <Flex vertical align='flex-start' justify='flex-start' gap={15} className='w-full'>
            <Flex vertical>
            <div className='text-[#09090B] text-[20px] font-semibold'>{__('Calendar Avatar', 'quillbooking')}</div>
            <div className='text-[#71717A] text-base'>{__('Recommended Image Size: 600x600. Square Orientation.', 'quillbooking')}</div>
            </Flex>
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
                        onClick={open}
                        className='relative cursor-pointer w-[120px] h-[120px]'
                    >
                        <Avatar
                            size={126}
                            src={value ? value.url : undefined}
                            className='bg-color-secondary'
                        />
                        {!value && (
                            <Flex vertical justify='center' align='center' gap={10} className='text-color-primary absolute top-[30px] left-[15px]'>
                                <ImgIcon width={30} height={30}/>
                                <Flex align='center' gap={2}>
                                    <LuCloudUpload size={14} />
                                    <div className='font-medium text-xs'>{__('Upload Image', 'quillbooking')}</div>
                                </Flex>
                            </Flex>
                        )}
                    </div>
                )}
            />
        </Flex>
    );
};

export default AvatarSelector;