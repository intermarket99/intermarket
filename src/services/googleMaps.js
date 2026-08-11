let googleMapsPromise = null;

export const cargarGoogleMaps = () => {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Maps solo puede cargarse en el navegador.")
    );
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error("Falta configurar VITE_GOOGLE_MAPS_API_KEY en el archivo .env")
    );
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `__intermarketGoogleMaps_${Date.now()}`;

    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const script = document.createElement("script");

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&libraries=marker&loading=async&callback=${callbackName}`;

    script.async = true;
    script.defer = true;

    script.onerror = () => {
      delete window[callbackName];
      googleMapsPromise = null;

      reject(new Error("No se pudo cargar Google Maps."));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const GOOGLE_MAP_ID =
  import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";