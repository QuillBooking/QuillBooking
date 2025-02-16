/**
 * External dependencies.
 */
import React, { useState } from 'react';
import { Popover, Flex, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';

// Predefined static colors
const staticColors = [
    '#FF6900', '#FCB900', '#7BDCB5', '#00D084',
    '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C',
    '#F78DA7', '#9900EF'
];

const ColorSelector: React.FC<{ value: string; onChange: (color: string) => void }> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);

    const handleColorClick = (color: string) => {
        onChange(color);
        setOpen(false);
    };

    const content = (
        <Flex wrap="wrap" gap={8} style={{ width: 160 }}>
            {staticColors.map((color) => (
                <Button
                    key={color}
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                        padding: 0,
                    }}
                    onClick={() => handleColorClick(color)}
                />
            ))}
        </Flex>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            open={open}
            onOpenChange={setOpen}
        >
            <Flex style={{
                borderRadius: '4px 0 0 4px',
                padding: '0 10px',
                border: '1px solid #d9d9d9',
                backgroundColor: '#f6f6f7',
                cursor: 'pointer',
            }}
                justify='center'
                align='center'
                gap={8}
            >

                <Button
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: value,
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                        padding: 0,
                    }}
                />
                <DownOutlined style={{
                    color: '#a8abb2',
                    fontSize: 10,
                }} />
            </Flex>
        </Popover>
    );
};

export default ColorSelector;