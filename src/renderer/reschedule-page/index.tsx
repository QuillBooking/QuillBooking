import { Booking, Event } from '../types';
// import CardBody from './card-body';
// import Header from './header';
import Header from '../components/event-card/header';
import './style.scss';
import CardBody from '../components/event-card/card-body';

interface ReschedulePageProps {
  event: Event;
  ajax_url: string;
  type: string;
  booking: Booking;
}

const ReschedulePage: React.FC<ReschedulePageProps> = ({ event, ajax_url, type, booking }) => {
  return (
    <div className="event-card-container">
      <div className="event-card-wrapper">
        <Header />
        <CardBody event={event} ajax_url={ajax_url} type={type} booking={booking}/>
      </div>
    </div>
  );
};
export default ReschedulePage;
