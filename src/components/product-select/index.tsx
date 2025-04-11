/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import AsyncSelect from 'react-select/async';
import { isObject, map, debounce } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi } from '@quillbooking/hooks';

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

const ProductSelect: React.FC<ProductSelectProps> = ({ value, onChange, multiple = false, placeholder, exclude }) => {
    const [products, setHosts] = useState<{ id: number; name: string }[]>([]);
    const { callApi } = useApi();

    const fetchProducts = async (input = '', ids: number[] = []) => {
        const data: Record<string, any> = {};
        if (input) {
            data['search'] = input;
        }
        if (ids.length) {
            data['include'] = ids;
        }

        return new Promise((resolve) => {
            callApi({
                path: addQueryArgs(`wc/v3/products`, { per_page: 10, ...data }),
                method: 'GET',
                onSuccess: (response: Product[]) => {
                    setHosts((prevHosts) => [...prevHosts, ...response]);
                    const mappedHosts = map(response, (product) => ({
                        value: product.id,
                        label: product.name,
                        disabled: exclude?.includes(product.id),
                    }));
                    resolve(mappedHosts);
                },
                onError: () => {
                    resolve([]);
                },
                isCore: false
            });
        });
    };

    const debouncedLoadOptions = debounce(async (inputValue, callback) => {
        const products = await fetchProducts(inputValue);
        callback(products);
    }, 300);

    const handleChange = (selected: any) => {
        if (multiple) {
            onChange(map(selected, 'value'));
        } else {
            onChange(selected?.value || null);
        }
    };

    useEffect(() => {
        const fetchInitialValues = async () => {
            if (!value || (Array.isArray(value) && value.length === 0)) return;

            const ids = Array.isArray(value) ? value : [value];
            const products = await fetchProducts('', ids);
            if (!products) return;

            if (Array.isArray(value)) {
                onChange(products);
            } else {
                onChange(products[0]);
            }
        };

        fetchInitialValues();
    }, []);

    const getValue = () => {
        if (multiple && Array.isArray(value)) {
            return map(value, (id) => {
                const product = products.find((u) => u.id === id);
                if (product && isObject(product)) {
                    return { value: product.id, label: product.name };
                }
                return null;
            });
        } else {
            const product = products.find((u) => u.id === value);
            if (product && isObject(product)) {
                return { value: product.id, label: product.name };
            }
            return null;
        }
    }

    return (
        <div className="product-select">
            <AsyncSelect
                isMulti={multiple}
                cacheOptions
                defaultOptions
                loadOptions={debouncedLoadOptions}
                onChange={handleChange}
                value={getValue()}
                placeholder={placeholder || __('Select a product...', 'quillbooking')}
                isOptionDisabled={(option) => option.disabled}
                className='rounded-lg w-full h-[48px]'
            />
        </div>
    );
};

export default ProductSelect;
