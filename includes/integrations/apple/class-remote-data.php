<?php
/**
 * Class Apple Remote Data
 *
 * This class is responsible for handling the Apple Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Apple;

use Illuminate\Support\Arr;
use QuillBooking\Integration\Remote_Data as Abstracts_Remote_Data;

/**
 * Apple Remote Data class
 */
class Remote_Data extends Abstracts_Remote_Data {

	/**
	 * Fetch Calendars
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function fetch_calendars() {
		/** @var Client $client */
		$client        = $this->integration->client;
		$data          = $client->get_calendars();
		$calendars     = Arr::get( $data, 'calendars', array() );
		$calendars_arr = array();

		foreach ( $calendars as $id => $calendar ) {
			$calendars_arr[] = array(
				'id'   => $id,
				'name' => $calendar['name'],
			);
		}

		return $calendars_arr;
	}

	/**
	 * Fetch Events
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Data.
	 *
	 * @return array
	 */
	public function fetch_events( $data ) {
		$calendar_id = $data['calendar'];
		$start_date  = $data['start_date'];
		$end_date    = $data['end_date'];
		$account_id  = $data['id'];

		$start_date = new \DateTime( $start_date, new \DateTimeZone( 'UTC' ) );
		$end_date   = new \DateTime( $end_date, new \DateTimeZone( 'UTC' ) );

		$start_date = $start_date->format( 'Ymd\THis\Z' );
		$end_date   = $end_date->format( 'Ymd\THis\Z' );

		/** @var Client $client */
		$client = $this->integration->client;
		$events = $client->get_events( $account_id, $calendar_id, $start_date, $end_date );

		return $events;
	}
}
