import axios from "axios";

export const getCoordinatesFromLocation = async (location) => {
  const geoRes = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`,
    {
      params: {
        access_token: process.env.MAPBOX_TOKEN,
        limit: 1,
      },
    }
  );

  if (!geoRes.data.features || geoRes.data.features.length === 0) {
    throw new Error("Invalid location. Unable to get coordinates.");
  }

  const [lng, lat] = geoRes.data.features[0].center;
  return { lng, lat };
};
