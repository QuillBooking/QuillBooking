export const getCurrentTimeInTimezone = (timezone: string): string => {
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: timezone,
	};

	return new Date().toLocaleString('en-US', options);
};
