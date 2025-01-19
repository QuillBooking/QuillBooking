export type Response = {
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string;
    path: string;
    prev_page_url: string;
    per_page: number;
    to: number;
    total: number;
};

export type Calendar = {
    id: number;
    user_id: number;
    name: string;
    description: string;
    slug: string;
    status: "active" | "inactive";
    timezone: string;
    type: string;
    avatar: {
        id: number;
        url: string;
    };
    featured_image: {
        id: number;
        url: string;
    };
    events: {
        id: number;
        calendar_id: number;
        name: string;
        duration: number;
        type: "one-to-one" | "group" | "round-robin";
        slug: string;
    }[];
    created_at: string;
    updated_at: string;
};

export type CalendarResponse = Response & {
    data: Calendar[];
};

export type Event = {
    id: number;
    hash_id: string;
    calendar_id: number;
    user_id: number;
    name: string;
    description: string | null;
    slug: string;
    status: 'active' | 'inactive' | 'deleted';
    type: "one-to-one" | "group" | "round-robin";
    duration: string;
    color: string;
    visibility: 'public' | 'private';
    created_at: string;
    updated_at: string;
    calendar: Calendar;
}