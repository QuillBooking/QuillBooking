/**
 * External dependencies
 */
import { Button } from 'antd';
import { FaCheck } from 'react-icons/fa';

interface ColorSelectorProps {
    selectedColor: string | null;
    onColorSelect: (color: string) => void;
}

const colors = [
    '#953AE4',
    '#0099FF',
    '#FF4F00',
    '#E55CFF',
    '#0AE8F0',
    '#17E885',
    '#CCF000',
    '#FFA600',
];

export default function ColorSelector({
    selectedColor = null,
    onColorSelect,
}: ColorSelectorProps) {
    return (
        <>
            {colors.map((colorOption) => (
                <Button
                    key={colorOption}
                    shape="circle"
                    size="large"
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 
                    ${selectedColor === colorOption ? 'ring ring-offset-2' : ''}`}
                    style={{
                        backgroundColor: colorOption,
                        minWidth: '25px',
                        '--tw-ring-color': colorOption ? colorOption : '',
                        border: colorOption ? '' : '2px solid #F2EBF9',
                    }}
                    onClick={() => onColorSelect(colorOption)}
                >
                    {selectedColor === colorOption && (
                        <FaCheck className={`text-white text-md absolute`} />
                    )}
                </Button>
            ))}
        </>
    );
}