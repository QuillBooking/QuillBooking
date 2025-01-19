import React from 'react';
export type PageSettings = {
	path: string;
	exact?: boolean;
	component: React.FC | JSX.Element | React.Component;
	label: string;
	hidden?: boolean;
};
export type Pages = Record<string, PageSettings>;
