/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Button, Form, Skeleton, Spin } from 'antd';

/**
 * Internal dependencies
 */
import type { Integration } from '@quillbooking/config';
import { useNavigate } from '@quillbooking/hooks';
import ZapierFields from './fields/ZapierFields';
import MakeFields from './fields/MakeFields';

export interface ConnectionCardProps {
	slug: string | null;
	integration: Integration | undefined;
	isLoading?: boolean;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
	slug,
	integration,
	isLoading = false,
}) => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [saving, setSaving] = useState(false);
	const [calendar, setCalendar] = useState<any>(null);
	const [calendarLoading, setCalendarLoading] = useState(false);

	// Handle navigation to other pages
	const handleNavigation = (path: string) => {
		navigate(path);
	};

	// If integration is loading or not found, show loading state
	if (isLoading || !integration) {
		return (
			<Card className="h-full">
				<Skeleton active paragraph={{ rows: 6 }} />
			</Card>
		);
	}

	const renderFields = () => {
		switch (slug) {
			case 'zapier':
				return (
					<ZapierFields
						fields={integration.fields}
						calendar={calendar}
						form={form}
						handleNavigation={handleNavigation}
					/>
				);
			case 'make':
				return (
					<MakeFields
						fields={integration.fields}
						calendar={calendar}
						form={form}
						handleNavigation={handleNavigation}
					/>
				);
			default:
				return null;
		}
	};

	const getSubmitButtonText = () => {
		switch (slug) {
			case 'zapier':
				return null;
			case 'make':
				return null;
			default:
				return 'Save Settings';
		}
	};

	return (
		<Card
			className="h-full"
			title={
				<div className="flex items-center">
					{integration.icon && (
						<img
							src={integration.icon}
							alt={integration.name}
							className="w-6 h-6 mr-2"
						/>
					)}
					<span>{integration.name}</span>
				</div>
			}
		>
			<Spin spinning={calendarLoading}>
				<Form
					form={form}
					layout="vertical"
					className="w-full"
					onFinish={async (values) => {
						// No form submission needed for Zapier
						if (slug === 'zapier') {
							return;
						}
					}}
				>
					{renderFields()}

					{getSubmitButtonText() && (
						<Form.Item className="mt-5">
							<Button
								type="primary"
								htmlType="submit"
								loading={saving}
								className="h-[48px]"
							>
								{getSubmitButtonText()}
							</Button>
						</Form.Item>
					)}
				</Form>
			</Spin>
		</Card>
	);
};

export default ConnectionCard;
