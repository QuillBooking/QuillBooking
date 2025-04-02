/*
 * External dependencies
 */
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

interface MonthSelectorProps {
	year: number;
	setYear: React.Dispatch<React.SetStateAction<number>>;
	selectedMonth: number;
	setSelectedMonth: (month: number) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
	year,
	setYear,
	selectedMonth,
	setSelectedMonth,
}) => {
	// Handlers to update the year
	const handlePrevYear = () => setYear((year) => year - 1);
	const handleNextYear = () => setYear((year) => year + 1);

	return (
		<div className="w-full mx-auto p-4 rounded-md border flex flex-col items-center">
			<div className="w-full flex items-center justify-between mb-4">
				<button
					onClick={handlePrevYear}
					className="border p-2 rounded hover:bg-gray-100"
				>
					<LeftOutlined />
				</button>

				<div className="font-semibold text-xl">{year}</div>

				<button
					onClick={handleNextYear}
					className="border p-2 rounded hover:bg-gray-100"
				>
					<RightOutlined />
				</button>
			</div>

			{/* Months row */}
			<div className="flex gap-4">
				{MONTHS.map((month, index) => {
					const monthNumber = index + 1;
					const isActive = monthNumber === selectedMonth;

					return (
						<button
							key={month}
							onClick={() => setSelectedMonth(monthNumber)}
							className={`px-4 py-2 rounded-md transition-colors ${
								isActive
									? 'bg-color-primary text-white'
									: 'bg-transparent text-color-primary-text hover:bg-gray-100'
							}`}
						>
							{month}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default MonthSelector;
