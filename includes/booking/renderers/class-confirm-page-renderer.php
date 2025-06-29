<?php
/**
 * Confirm Page Renderer
 */

 namespace QuillBooking\Booking\Renderers;

 class Confirm_Page_Renderer extends Base_Template_Renderer {
 
     private string $eventModelClass;
 
     public function __construct( string $eventModelClass ) {
         parent::__construct();
         $this->eventModelClass = $eventModelClass;
     }
 
     public function render( $booking ) {
         $booking_array = $this->dataFormatter->format_booking_data( $booking );
         $booking_array['hosts'] = $this->get_event_hosts( $booking->event );
 
         $template_path = QUILLBOOKING_PLUGIN_DIR . 'src/templates/confirm.php';
 
         return $this->render_template_page( $template_path, [
             'booking_array' => $booking_array,
             'title'         => $booking->event->name ?? __( 'Booking Confirmation', 'quillbooking' )
         ]);
     }
 }