import * as ExpoLocation from "expo-location";
import { Platform } from "react-native";

export type AddressSuggestion = {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const PHOTON_BASE = "https://photon.komoot.io";

async function requestJson<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error("Network error while searching addresses. Please check your internet connection.");
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Address search is busy right now. Please try again in a moment.");
    }

    throw new Error(`Address search failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export async function searchAddresses(query: string, limit = 6): Promise<AddressSuggestion[]> {
  const cleanedQuery = query.trim();
  if (!cleanedQuery) return [];

  const nominatimUrl = `${NOMINATIM_BASE}/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(
    cleanedQuery
  )}`;

  try {
    const results = await requestJson<Array<Record<string, unknown>>>(nominatimUrl);
    const mapped = results
      .map((item, index) => ({
        placeId: String(item.place_id || index),
        displayName: String(item.display_name || "Unknown location"),
        lat: Number(item.lat || 0),
        lon: Number(item.lon || 0),
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

    if (mapped.length > 0) {
      return mapped;
    }
  } catch {
    // fallback below
  }

  const photonUrl = `${PHOTON_BASE}/api/?q=${encodeURIComponent(cleanedQuery)}&limit=${limit}`;
  const photonResult = await requestJson<{ features?: Array<Record<string, unknown>> }>(photonUrl);
  const features = Array.isArray(photonResult.features) ? photonResult.features : [];

  return features
    .map((feature, index) => {
      const geometry = (feature.geometry as Record<string, unknown>) || {};
      const props = (feature.properties as Record<string, unknown>) || {};
      const coords = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
      const lon = Number(coords[0] || 0);
      const lat = Number(coords[1] || 0);

      const parts = [
        typeof props.name === "string" ? props.name : "",
        typeof props.city === "string" ? props.city : "",
        typeof props.state === "string" ? props.state : "",
        typeof props.country === "string" ? props.country : "",
      ].filter(Boolean);

      return {
        placeId: String(feature.id || props.osm_id || index),
        displayName: parts.length > 0 ? parts.join(", ") : "Unknown location",
        lat,
        lon,
      };
    })
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
}

export async function reverseGeocode(lat: number, lon: number): Promise<AddressSuggestion | null> {
  const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lon}`;
  const result = await requestJson<Record<string, unknown>>(url);

  if (!result.display_name) {
    return null;
  }

  return {
    placeId: String(result.place_id || `${lat}-${lon}`),
    displayName: String(result.display_name),
    lat: Number(result.lat || lat),
    lon: Number(result.lon || lon),
  };
}

export async function getCurrentAddress(): Promise<AddressSuggestion | null> {
  let latitude: number;
  let longitude: number;

  if (Platform.OS === "web") {
    const geolocation = globalThis.navigator?.geolocation;
    if (!geolocation) {
      throw new Error("Current location is not available on this device.");
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  } else {
    const permission = await ExpoLocation.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Location permission denied. Please allow location access.");
    }

    const position = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.High,
    });

    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  }

  let address: AddressSuggestion | null = null;

  try {
    address = await reverseGeocode(latitude, longitude);
  } catch {
    address = null;
  }

  if (!address && Platform.OS !== "web") {
    try {
      const local = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      const first = local[0];

      if (first) {
        const parts = [first.name, first.street, first.city, first.region, first.country].filter(Boolean);
        address = {
          placeId: `${latitude}-${longitude}`,
          displayName: parts.length > 0 ? parts.join(", ") : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          lat: latitude,
          lon: longitude,
        };
      }
    } catch {
      address = null;
    }
  }

  return (
    address || {
      placeId: `${latitude}-${longitude}`,
      displayName: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      lat: latitude,
      lon: longitude,
    }
  );
}
