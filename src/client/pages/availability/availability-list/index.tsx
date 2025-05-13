/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Card, List, Space, Typography, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
import { Availability } from 'client/types';
import { useApi } from '@quillbooking/hooks';
import {
	ClockIcon,
	GlobalIcon,
	NoDataComponent,
	TagComponent,
	NoticeBanner,
} from '@quillbooking/components';
import AvailabilityActions from './availability-actions';

interface AvailabilityListProps {
	showAllSchedules: boolean;
	openAvailabilityModal: (open: boolean) => void;
}

interface NoticeType {
	type: 'success' | 'error';
	title: string;
	message: string;
}

const { Title } = Typography;
const AvailabilityList: React.FC<AvailabilityListProps> = ({
	showAllSchedules,
	openAvailabilityModal,
}) => {
	const { callApi } = useApi();
	const [availabilities, setAvailabilities] = useState<
		Partial<Availability>[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [notice, setNotice] = useState<NoticeType | null>(null);

	const fetchAvailabilities = async () => {
		setIsLoading(true);
		callApi({
			path: addQueryArgs(
				'availabilities',
				showAllSchedules ? { filter: { user: 'all' } } : {}
			),
			method: 'GET',
			onSuccess: (data) => {
				setAvailabilities(data);
				setIsLoading(false);
			},
			onError: () => {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: __(
						'Failed to load availabilities',
						'quillbooking'
					),
				});
				setIsLoading(false);
			},
		});
	};

	useEffect(() => {
		fetchAvailabilities();
	}, [showAllSchedules]);

	if (isLoading) {
		return (
			<>
				{[1, 2, 3].map((key) => (
					<Card className="my-4" key={key}>
						<Skeleton
							active
							avatar={false}
							paragraph={{ rows: 3 }}
						/>
					</Card>
				))}
			</>
		);
	}

	if (availabilities.length === 0) {
		return (
			<NoDataComponent
				setOpen={() => openAvailabilityModal(true)}
				header={__('No availabilities found', 'quillbooking')}
				description={__(
					'You have not created any availabilities yet.',
					'quillbooking'
				)}
				buttonText={__('Create Availability', 'quillbooking')}
				icon={<ClockIcon width={80} height={80} />}
			/>
		);
	}

	return (
		<div>
			{notice && (
				<NoticeBanner
					notice={notice}
					closeNotice={() => setNotice(null)}
				/>
			)}
			<List
				dataSource={Object.values(availabilities)}
				renderItem={(availability) => (
					<Card className="my-4">
						<List.Item key={availability.id}>
							<div style={{ width: '100%' }}>
								<List.Item.Meta
									title={
										<Space size={10}>
											<Title
												level={5}
												style={{ margin: 0 }}
											>
												{availability.name}
											</Title>
											{availability.is_default && (
												<TagComponent
													label={__(
														'Default',
														'quillbooking'
													)}
												/>
											)}
										</Space>
									}
									description={
										<>
											<div className="flex gap-2 mb-2">
												<ClockIcon />
											</div>
											<div className="flex gap-2 mb-2">
												<GlobalIcon />
												{availability.timezone}
											</div>
										</>
									}
								/>
							</div>

							<AvailabilityActions
								availabilityId={availability.id || ''}
								availabilities={availabilities}
								setAvailabilities={setAvailabilities}
								isAvailabilityDefault={
									availability.is_default || false
								}
								eventsCount={availability.events_count || 0}
								setNotice={setNotice}
							/>
						</List.Item>
					</Card>
				)}
			/>
		</div>
	);
};

export default AvailabilityList;
