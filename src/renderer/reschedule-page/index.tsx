import { Event } from '../types';
// import CardBody from './card-body';
// import Header from './header';
import Header from '../components/event-card/header';
import './style.scss';
import CardBody from '../components/event-card/card-body';

interface ReschedulePageProps {
  event: Event;
  ajax_url: string;
}

const ReschedulePage: React.FC<ReschedulePageProps> = ({ event, ajax_url }) => {
  return (
    <div className="event-card-container">
      <div className="event-card-wrapper">
        <Header />
        <CardBody event={event} ajax_url={ajax_url} />
      </div>
    </div>
  );
};
export default ReschedulePage;
