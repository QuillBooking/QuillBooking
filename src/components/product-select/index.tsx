import { useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { Card, Flex } from 'antd';
import { __ } from '@wordpress/i18n';

interface Product {
    id: number;
    name: string;
}

interface ProductSelectProps {
    value: number | number[];
    onChange: (value: any) => void;
    multiple?: boolean;
    placeholder?: string;
    exclude?: number[];
}

const ProductSelect: React.FC<ProductSelectProps> = ({
    value,
    onChange,
    multiple = false,
    exclude = [],
}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchProducts = async (input = '', ids: number[] = []) => {
        setIsLoading(true);
        try {
            // This is a mock API call - replace with your actual API
            const response = await fetch(`/api/products?search=${input}&ids=${ids.join(',')}`);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedFetch = debounce((term: string) => {
        fetchProducts(term);
    }, 300);

    useEffect(() => {
        debouncedFetch(searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        const ids = Array.isArray(value) ? value : value ? [value] : [];
        if (ids.length > 0) {
            fetchProducts('', ids);
        } else {
            fetchProducts();
        }
    }, []);

    const handleSelect = (productId: number) => {
        if (multiple) {
            const currentValue = Array.isArray(value) ? value : [];
            const newValue = currentValue.includes(productId)
                ? currentValue.filter(id => id !== productId)
                : [...currentValue, productId];
            onChange(newValue);
        } else {
            onChange(value === productId ? null : productId);
        }
    };

    const isSelected = (productId: number) => {
        if (multiple) {
            return Array.isArray(value) && value.includes(productId);
        }
        return value === productId;
    };

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="h-[72px] rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <Card
                            onClick={() => handleSelect(product.id)}
                            disabled={exclude.includes(product.id)}
                            className={`
        relative w-fit p-4 rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected(product.id)
                                    ? 'border-color-primary bg-color-secondary'
                                    : ''
                                }
        ${exclude.includes(product.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
                        >
                            <Flex align="start" vertical gap={10} className='text-[#1E2125]'>
                                <span className={`font-bold ${isSelected(product.id) ? 'text-color-primary' : ''}`}>
                                    {product.name}
                                </span>
                                <span>{__('Event Booking', 'quillbooking')}</span>
                            </Flex>
                        </Card>
                    ))}
                </div>
            )
            }
        </div >
    );
};

export default ProductSelect;