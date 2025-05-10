/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React from 'react';

interface TabButtonsProps {
    label: string;
    icon: React.ReactNode;
    isActive?: boolean;
}

const TabButtons: React.FC<TabButtonsProps> = ({ label, icon, isActive = false }) => {
    return (
        <div className='flex items-center gap-2'>
            <div className={isActive ? 'text-color-primary' : 'text-[#292D32]'}>
                {icon}
            </div>
            <span className={`text-[14px] font-semibold ${isActive ? 'text-color-primary' : 'text-[#A1A5B7]'}`}>
                {label}
            </span>
        </div>
    );
};

export default TabButtons;