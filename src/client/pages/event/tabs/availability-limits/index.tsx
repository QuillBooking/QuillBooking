import AvailabilitySection from './availability';
import EventLimits from './limits';

const AvailabilityLimits: React.FC = () => {
  return (
    <div className='grid grid-cols-2 gap-5 px-9'>
      <AvailabilitySection />
      <EventLimits />
    </div>
  );
};

export default AvailabilityLimits;