export type TicketType = 'bug' | 'feature' | 'improvement';
export type Priority = 'high' | 'medium' | 'low';

export const TYPE_COLOR: Record<TicketType, 'red' | 'blue' | 'green'> = {
	bug: 'red',
	feature: 'blue',
	improvement: 'green'
};

export const TYPE_LABEL: Record<TicketType, string> = {
	bug: 'Bug',
	feature: 'Feature',
	improvement: 'Improvement'
};

export const PRIORITY_COLOR: Record<Priority, 'red' | 'yellow' | 'green'> = {
	high: 'red',
	medium: 'yellow',
	low: 'green'
};

export const PRIORITY_LABEL: Record<Priority, string> = {
	high: 'High',
	medium: 'Medium',
	low: 'Low'
};
