import { useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { __ } from '@wordpress/i18n';
import { Card, Flex } from 'antd';

interface Product {
    id: number;
    name: string;
    price: number; // Added price field
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

    const formatPrice = (price: number) => {
        return `${price}$`;
    };

    return (
        <div className="space-y-4">
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <Flex gap={4}>
                    {products.map((product) => (
                        <Card
                            key={product.id}
                            onClick={() => !exclude.includes(product.id) && handleSelect(product.id)}
                            className={`
                                relative rounded-lg p-4 transition-all duration-200 border text-[#1E2125]
                                ${isSelected(product.id) ? 'bg-color-secondary border-color-primary' : ''}
                                ${exclude.includes(product.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <Flex vertical gap={8}>
                                <div
                                    className={`font-bold
                                    ${isSelected(product.id) ? 'text-color-primary' : ''}`}
                                >
                                    {formatPrice(product.price)}
                                </div>
                                <div>
                                    {product.name}
                                </div>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )}
        </div>
    );
};

export default ProductSelect;