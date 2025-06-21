import axios from 'axios';
import config from 'config';

const MAPBOX_ACCESS_TOKEN = config.get('mapboxToken');

export async function geocodeAddress(address) {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}`;

  const response = await axios.get(url);
  const data = response.data;

  if (!data.features || data.features.length === 0) {
    throw { status: 400, body: 'No location found for the provided address' };
  }

  const [longitude, latitude] = data.features[0].center;
  return { latitude, longitude };
}
