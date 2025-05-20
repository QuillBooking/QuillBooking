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

interface Option {
	value: number;
	label: string;
	disabled?: boolean;
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
	placeholder,
	exclude,
}) => {
	const [products, setProducts] = useState<Product[]>([]);
	const [selectedOptions, setSelectedOptions] = useState<Option | Option[] | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { callApi } = useApi();

	const fetchProducts = async (input = '', ids: number[] = []) => {
		const data: Record<string, any> = {};
		if (input) {
			data['search'] = input;
		}
		if (ids.length) {
			data['include'] = ids;
		}

		return new Promise<Option[]>((resolve) => {
			callApi({
				path: addQueryArgs(`wc/v3/products`, { per_page: 10, ...data }),
				method: 'GET',
				onSuccess: (response: Product[]) => {
					// Add new products to our state
					setProducts((prevProducts) => {
						// Filter out duplicates
						const newProducts = response.filter(
							(product) => !prevProducts.some((p) => p.id === product.id)
						);
						return [...prevProducts, ...newProducts];
					});
					
					const mappedOptions = map(response, (product) => ({
						value: product.id,
						label: product.name,
						disabled: exclude?.includes(product.id),
					}));
					resolve(mappedOptions);
				},
				onError: () => {
					resolve([]);
				},
				isCore: false,
			});
		});
	};

	const debouncedLoadOptions = debounce(async (inputValue, callback) => {
		const products = await fetchProducts(inputValue);
		callback(products);
	}, 300);

	const handleChange = (selected: any) => {
		setSelectedOptions(selected);
		
		if (multiple) {
			onChange(map(selected, 'value'));
		} else {
			onChange(selected?.value || null);
		}
	};

	// Fetch the product details when the component loads with a value
	useEffect(() => {
		const fetchInitialValues = async () => {
			if (!value || (Array.isArray(value) && value.length === 0)) {
				return;
			}

			setIsLoading(true);
			
			try {
				const ids = Array.isArray(value) ? value : [value];
				const options = await fetchProducts('', ids);
				
				if (!options || options.length === 0) return;
				
				// Create the proper selected options format
				if (multiple && Array.isArray(value)) {
					// Match the order of the original value array
					const orderedOptions = ids.map(id => 
						options.find(option => option.value === id)
					).filter(Boolean) as Option[];
					
					setSelectedOptions(orderedOptions);
				} else {
					// For single select, find the matching option
					const option = options.find(opt => opt.value === value);
					if (option) {
						setSelectedOptions(option);
					}
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchInitialValues();
	}, [value]); // Only re-run if the value prop changes

	return (
		<div className="product-select">
			<AsyncSelect
				isMulti={multiple}
				cacheOptions
				defaultOptions
				loadOptions={debouncedLoadOptions}
				onChange={handleChange}
				value={selectedOptions}
				isLoading={isLoading}
				placeholder={
					placeholder || __('Select a product...', 'quillbooking')
				}
				isOptionDisabled={(option) =>
					option ? (option as any).disabled : false
				}				
				classNamePrefix="custom-select"
				styles={{
					control: (base, state) => ({
						...base,
						height: '48px',
						borderRadius: '0.5rem',
						borderColor: state.isFocused ? '#ccc' : '#e2e8f0',
						boxShadow: 'none',
						minHeight: '48px',
					}),
					indicatorsContainer: (base) => ({
						...base,
						height: '48px',
					}),
					indicatorSeparator: () => ({
						display: 'none',
					}),
					valueContainer: (base) => ({
						...base,
						height: '48px',
						padding: '0 8px',
					}),
					multiValue: (base) => ({
						...base,
						backgroundColor: '#edf2f7',
					}),
				}}
			/>
		</div>
	);
};

export default ProductSelect;