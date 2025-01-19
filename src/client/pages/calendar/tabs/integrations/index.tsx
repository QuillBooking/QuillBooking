/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Button, Typography, Badge, Flex, Tooltip } from 'antd';
import { map, isEmpty } from 'lodash';
import { useParams } from 'react-router-dom';

/**
 * Internal dependencies
 */
import './style.scss';
import { useNavigate, useBreadcrumbs } from '@quillbooking/hooks';
import { useCalendarContext } from '../../state/context';
import ConfigAPI from '@quillbooking/config';
import IntegrationDetailsPage from './integration';

const { Title, Text } = Typography;

const IntegrationCards: React.FC = () => {
    const { id, subtab } = useParams<{ id: string; tab: string, subtab: string }>();
    const navigate = useNavigate();
    const { state } = useCalendarContext();
    const setBreadcrumbs = useBreadcrumbs();
    const integrations = ConfigAPI.getIntegrations();

    useEffect(() => {
        if (!state) {
            return;
        }

        setBreadcrumbs([
            {
                path: `calendars/${state.id}/integrations`,
                title: __('Integrations', 'quillbooking')
            }
        ]);
    }, [state]);

    if (subtab && id) {
        return <IntegrationDetailsPage integration={integrations[subtab]} calendarId={id} slug={subtab} />;
    }

    return (
        <div className='quillbooking-integrations'>
            <div className='quillbooking-integrations-cards'>
                {map(integrations, (integration, index) => !integration.is_global ? (
                    <Card
                        style={{
                            flex: '1',
                            cursor: 'pointer',
                        }}
                        key={index}
                        actions={[
                            <Flex gap={10} style={{ padding: '0 20px' }}>
                                <Button
                                    type="primary"
                                    style={{ width: '100%' }}
                                    onClick={() => state ? navigate(`calendars/:id/integrations/:subtab`, { id: state.id, subtab: index }) : null}
                                >
                                    {__('Connect', 'quillbooking')}
                                </Button>
                            </Flex>
                        ]}
                    >
                        <Flex
                            vertical
                            gap={10}
                            onClick={() => { }}
                        >
                            <Flex justify='space-between'>
                                <div className="quillbooking-integration-icon">
                                    <img src={integration.icon} alt={integration.name} width={40} />
                                </div>
                                <Tooltip title={!isEmpty(integration.settings) ? __('Connected', 'quillbooking') : __('Not connected', 'quillbooking')}>
                                    <Badge
                                        status={!isEmpty(integration.settings) ? 'success' : 'default'}
                                    />
                                </Tooltip>
                            </Flex>
                            <Title level={4} style={{ margin: 0 }}>
                                {integration.name}
                            </Title>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                {integration.description}
                            </Text>
                        </Flex>
                    </Card>
                ) : null)}
            </div>
        </div>
    );
};

export default IntegrationCards;
