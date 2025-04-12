export type Config = {
    ajax_url: string;
    nonce: string;
    url: string;
    lang: string;
    calendar: {
        id: number;
        hash_id: string;
        user_id: number;
        name: string;
        description: string | null;
        slug: string;
        status: string;
        type: string;
        created_at: string;
        updated_at: string;
        timezone: string;
        avatar: string | null;
        featured_image: string | null;
    };
    event: {
        id: number;
        hash_id: string;
        calendar_id: number;
        user_id: number;
        name: string;
        description: string | null;
        slug: string;
        status: string;
        type: string;
        duration: string;
        color: string;
        visibility: string;
        created_at: string;
        updated_at: string;
        dynamic_duration: boolean;
        location: {
            type: string;
            fields: Record<string, any> | any[];
        }[];
        additional_settings: {
            allow_attendees_to_select_duration: boolean;
            default_duration: number;
            selectable_durations: number[];
            invitee: {
                allow_additional_guests: boolean;
            };
        };
    };
};