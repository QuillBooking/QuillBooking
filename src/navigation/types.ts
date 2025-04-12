import React, { ReactNode } from 'react';
export type PageSettings = {
	path: string;
	exact?: boolean;
	component: React.FC | JSX.Element | React.Component | ReactNode;
	label: JSX.Element | string;
	hidden?: boolean;
	capabilities?: string[];
};
export type Pages = Record<string, PageSettings>;
