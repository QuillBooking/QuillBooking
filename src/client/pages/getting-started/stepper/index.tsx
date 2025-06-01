import React from 'react';

interface StepperProps {
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, title: "Event Details & Duration" },
    { id: 2, title: "Meeting Location & Time Zone" },
    { id: 3, title: "Set your Availability" }
  ];

  return (
    <div className="w-full mx-auto max-w-[1110px]">
      <div className="flex items-start justify-center relative">
        {/* Step items */}
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className="flex flex-col items-center relative flex-1"
          >
            {/* Label */}
            <span 
              className={`transition-all duration-300 text-center mb-2 ${
                step.id <= currentStep 
                  ? 'text-black font-semibold text-base' 
                  : 'text-[#1E2125] font-normal'
              }`}
            >
              {step.title}
            </span>
            
            {/* Circle */}
            <div 
              className={`w-[10px] h-[10px] rounded-full transition-all duration-300 relative z-10 ${
                step.id <= currentStep 
                  ? 'bg-color-primary' 
                  : 'bg-color-secondary'
              }`}
            />
            
            {/* Individual line under each step */}
            <div 
              className={`w-[21.5rem] h-2 rounded-full mt-2 transition-all duration-300 ${
                step.id <= currentStep 
                  ? 'bg-color-primary' 
                  : 'bg-color-secondary'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;