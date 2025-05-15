/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Card, Flex, Switch } from 'antd';

/**
 * Internal dependencies
 */
import { CardHeader, PluginsIcon } from '@quillbooking/components';
import quillforms from '@quillbooking/assets/icons/quillforms/quillforms.png';
import quillcrm from '@quillbooking/assets/icons/quillcrm/quillcrm.png';
import woocommerce from '@quillbooking/assets/icons/woocommerce/woocommerce.png';
import { useApi } from '@quillbooking/hooks';

type PluginStatus = 'install' | 'disabled' | 'enabled';

const PluginsCard: React.FC = () => {
	const [pluginStatuses, setPluginStatuses] = useState<Record<string, PluginStatus>>({
		woocommerce: 'install',
		quillcrm: 'install',
		quillforms: 'install',
	});

	const { loading } = useApi();

	const updatePluginStatus = (plugin: string, newStatus: PluginStatus) => {
		setPluginStatuses(prev => ({
			...prev,
			[plugin]: newStatus
		}));
	};

	return (
		<Card>
			<CardHeader
				title={__('Recommended Plugins', 'quillbooking')}
				description={__(
					'Plugins that will extend your Quill Booking Functionalities',
					'quillbooking'
				)}
				icon={<PluginsIcon />}
			/>
			<Flex vertical gap={10} className="mt-4">
				<Card>
					<Flex justify="space-between" align="center">
						<Flex gap={12} align="center">
							<img
								src={woocommerce}
								alt="woocommerce.png"
								className="w-[3.25rem] h-9"
							/>
							<Flex vertical gap={2}>
								<div className="text-[#3F4254] text-base font-semibold">
									{__('Woo Commerce', 'quillbooking')}
								</div>
								<div className="text-[#9197A4] text-xs">
									{__(
										'WooCommerce is the worlds most popular open source eCommerce solution.',
										'quillbooking'
									)}
								</div>
							</Flex>
						</Flex>
						{pluginStatuses.woocommerce === 'install' && (
							<Button
								loading={loading}
								type="text"
								className="bg-color-primary text-white font-semibold"
								onClick={() => updatePluginStatus('woocommerce', 'disabled')}
							>
								{__('Install Woo Commerce', 'quillbooking')}
							</Button>
						)}
						{pluginStatuses.woocommerce === 'disabled' && (
							<Switch
								checked={false}
								onChange={(checked) =>
									updatePluginStatus('woocommerce', checked ? 'enabled' : 'disabled')
								}
								className={
									false ? 'bg-color-primary' : 'bg-gray-400'
								}
							/>
						)}
						{pluginStatuses.woocommerce === 'enabled' && (
							<div className="text-color-primary font-semibold">
								{__('System Enabled', 'quillbooking')}
							</div>
						)}
					</Flex>
				</Card>
				<Card>
					<Flex justify="space-between" align="center">
						<Flex gap={12} align="center">
							<img
								src={quillcrm}
								alt="quillcrm.png"
								className="size-[3.25rem]"
							/>
							<Flex vertical gap={2}>
								<div className="text-[#3F4254] text-base font-semibold">
									{__('Quill CRM', 'quillbooking')}
								</div>
								<div className="text-[#9197A4] text-xs">
									{__(
										'Quill CRM is dummy text used in laying out print, graphic or web designs.',
										'quillbooking'
									)}
								</div>
							</Flex>
						</Flex>
						{pluginStatuses.quillcrm === 'install' && (
							<Button
								loading={loading}
								type="text"
								className="bg-color-primary text-white font-semibold"
								onClick={() => updatePluginStatus('quillcrm', 'disabled')}
							>
								{__('Install Quill CRM', 'quillbooking')}
							</Button>
						)}
						{pluginStatuses.quillcrm === 'disabled' && (
							<Switch
								checked={false}
								onChange={(checked) =>
									updatePluginStatus('quillcrm', checked ? 'enabled' : 'disabled')
								}
								className={
									false ? 'bg-color-primary' : 'bg-gray-400'
								}
							/>
						)}
						{pluginStatuses.quillcrm === 'enabled' && (
							<div className="text-color-primary font-semibold">
								{__('System Enabled', 'quillbooking')}
							</div>
						)}
					</Flex>
				</Card>
				<Card>
					<Flex justify="space-between" align="center">
						<Flex gap={12} align="center">
							<img
								src={quillforms}
								alt="quillforms.png"
								className="size-[3.25rem]"
							/>
							<Flex vertical gap={2}>
								<div className="text-[#3F4254] text-base font-semibold">
									{__('Quill Forms', 'quillbooking')}
								</div>
								<div className="text-[#9197A4] text-xs">
									{__(
										'Quill Forms is a new revolution for online forms and surveys',
										'quillbooking'
									)}
								</div>
							</Flex>
						</Flex>
						{pluginStatuses.quillforms === 'install' && (
							<Button
								loading={loading}
								type="text"
								className="bg-color-primary text-white font-semibold"
								onClick={() => updatePluginStatus('quillforms', 'disabled')}
							>
								{__('Install Quill Forms', 'quillbooking')}
							</Button>
						)}
						{pluginStatuses.quillforms === 'disabled' && (
							<Switch
								checked={false}
								onChange={(checked) =>
									updatePluginStatus('quillforms', checked ? 'enabled' : 'disabled')
								}
								className={
									false ? 'bg-color-primary' : 'bg-gray-400'
								}
							/>
						)}
						{pluginStatuses.quillforms === 'enabled' && (
							<div className="text-color-primary font-semibold">
								{__('System Enabled', 'quillbooking')}
							</div>
						)}
					</Flex>
				</Card>
			</Flex>
		</Card>
	);
};

export default PluginsCard;
