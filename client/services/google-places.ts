import { GOOGLE_PLACES_API_KEY } from "@/constants/keys";

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const BASE_URL = "https://maps.googleapis.com/maps/api/place";

export const getPlacePredictions = async (
  input: string,
): Promise<PlacePrediction[]> => {
  if (!GOOGLE_PLACES_API_KEY || input.length < 3) return [];

  try {
    const response = await fetch(
      `${BASE_URL}/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}&components=country:ng`,
    );
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error("Google Places Autocomplete Error:", error);
    return [];
  }
};

export const getPlaceDetails = async (
  placeId: string,
): Promise<PlaceDetails | null> => {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    const response = await fetch(
      `${BASE_URL}/details/json?place_id=${placeId}&fields=address_component,formatted_address&key=${GOOGLE_PLACES_API_KEY}`,
    );
    const data = await response.json();

    if (data.status !== "OK") return null;

    const components = data.result.address_components;

    const getComponent = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.long_name || "";

    const streetNumber = getComponent("street_number");
    const route = getComponent("route");

    return {
      address:
        `${streetNumber} ${route}`.trim() || data.result.formatted_address,
      city:
        getComponent("locality") || getComponent("administrative_area_level_2"),
      state: getComponent("administrative_area_level_1"),
      zipCode: getComponent("postal_code"),
      country: getComponent("country"),
    };
  } catch (error) {
    console.error("Google Places Details Error:", error);
    return null;
  }
};
