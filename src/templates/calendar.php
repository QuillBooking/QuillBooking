<?php
$icons_url           = plugins_url('src/templates/icons/', QUILLBOOKING_PLUGIN_FILE);
?>
<link rel="stylesheet" href="<?php echo esc_url(plugins_url('src/templates/css/calendar.css', QUILLBOOKING_PLUGIN_FILE)); ?>">

<div class="quillbooking-meeting">
    <div class="details-container">
        <!-- Calendar Header -->
        <div class="calendar-header">
            <?php if (!empty($calendar['featured_image'])): ?>
                <div class="featured-image">
                    <img src="<?php echo esc_url($calendar['featured_image']['url']); ?>" alt="<?php echo esc_attr($calendar['name']); ?>" />
                </div>
            <?php endif; ?>
            <div class="profile-picture">
                <?php if (!empty($calendar['avatar'])): ?>
                    <img src="<?php echo esc_url($calendar['avatar']['url']); ?>" alt="<?php echo esc_attr($calendar['name']); ?>" />
                <?php else: ?>
                    <img src="<?php echo esc_url($icons_url . 'profile.svg'); ?>" alt="Calendar Avatar" />
                <?php endif; ?>
            </div>
            <h1 class="title"><?php echo esc_html($calendar['name'] ?? 'Calendar Title will be here'); ?></h1>
            <?php if (!empty($calendar['description'])): ?>
                <p class="calendar-info"><?php echo esc_html($calendar['description']); ?></p>
            <?php endif; ?>
        </div>

        <!-- Events List -->
        <div class="events-container">
            <?php
            // Convert Eloquent Collection to array
            $events = $calendar['events']->toArray();

            if (!empty($events)): ?>
                <?php foreach ($events as $event): ?>
                    <div class="event-card">
                        <div class="event-content">
                            <h3 class="event-title"><?php echo esc_html($event['name'] ?? 'Sprint Planning Meeting'); ?></h3>

                            <div class="event-details">
                                <div class="event-detail">
                                    <span class="detail-icon">
                                        <img src="<?php echo esc_url($icons_url . 'clock.svg'); ?>" alt="Duration" />
                                    </span>
                                    <span><?php echo esc_html($event['duration'] ?? '30'); ?> min</span>
                                </div>

                                <?php if (!empty($event['location']) && is_array($event['location'])): ?>
                                    <div class="event-detail">
                                        <span class="detail-icon">
                                            <img src="<?php echo esc_url($icons_url . 'location.svg'); ?>" alt="Location" />
                                        </span>
                                        <span>
                                            <?php
                                            $location = $event['location'][0] ?? [];
                                            echo esc_html($location['type'] ?? 'MS Teams - Conferencing');
                                            ?>
                                        </span>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>

                        <div class="event-actions">
                            <a href="?quillbooking_calendar=<?php echo esc_attr($calendar['slug']); ?>&event=<?php echo esc_attr($event['slug']); ?>"
                                class="book-now-btn">
                                Book Now
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="no-events">
                    <p><?php esc_html_e('No events available at this time.', 'quillbooking'); ?></p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<style>
    /* Calendar Page Styles */
    .quillbooking-meeting {
        min-height: 100vh;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .details-container {
        max-width: 800px;
        width: 100%;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    /* Header Styles */
    .calendar-header {
        padding: 20px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;
    }

    .featured-image {
        margin-bottom: 30px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .featured-image img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
    }

    .profile-picture {
        position: relative;
        z-index: 1;
        margin-bottom: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 50%;
    }

    .profile-picture img {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
    }

    .title {
        font-size: 16px;
        font-weight: 600;
        color: black;
        margin-bottom: 10px;
        position: relative;
        z-index: 1;
    }

    .calendar-info {
        border: 1px solid #D3D4D6;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        position: relative;
        color: black;
        z-index: 1;
        text-align: center;
    }

    /* Events Container */
    .events-container {
        padding: 20px;
    }

    .event-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
    }

    .event-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }

    .event-card:last-child {
        margin-bottom: 0;
    }

    .event-content {
        flex: 1;
    }

    .event-title {
        font-size: 24px;
        font-weight: 600;
        color: #1A1A1A;
        margin-bottom: 12px;
    }

    .event-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .event-detail {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #292D32;
        font-size: 14px;
    }

    .detail-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .detail-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* Book Now Button */
    .event-actions {
        margin-left: 20px;
    }

    .book-now-btn {
        background: #953AE4;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        display: inline-block;
        box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.25);
    }

    .book-now-btn:hover {
        box-shadow: 0 6px 12px -2px rgba(139, 92, 246, 0.35);
    }

    /* Responsive Design */
    @media (max-width: 640px) {
        .quillbooking-meeting {
            padding: 10px;
        }

        .calendar-header {
            padding: 40px 20px;
        }

        .title {
            font-size: 2rem;
        }

        .events-container {
            padding: 20px;
        }

        .event-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
        }

        .event-actions {
            margin-left: 0;
            width: 100%;
        }

        .book-now-btn {
            width: 100%;
            text-align: center;
        }
    }
</style>