import React, { useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 }; // Nairobi, KE
const DEFAULT_ZOOM = 11;

const containerStyle = {
  width: "100%",
  height: "100%",
};

const sanitizeMarkers = (markers) => {
  if (!Array.isArray(markers)) {
    return [];
  }

  return markers
    .map((marker) => {
      if (!marker) {
        return null;
      }

      const lat = typeof marker.lat === "string" ? Number(marker.lat) : marker.lat;
      const lng = typeof marker.lng === "string" ? Number(marker.lng) : marker.lng;

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          lat,
          lng,
          label: marker.label || null,
        };
      }

      return null;
    })
    .filter(Boolean);
};

const MapFallback = ({ title, subtitle, className }) => {
  const resolvedClassName = ["dashboard-section", "map-widget", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={resolvedClassName}>
      <div className="dashboard-section__header">
        <h3 className="dashboard-section__title">{title}</h3>
        {subtitle ? <p className="dashboard-subtitle">{subtitle}</p> : null}
      </div>
      <div className="map-widget__body map-widget__body--fallback">
        <p className="map-widget__fallback-title">Google Maps preview unavailable</p>
        <p className="map-widget__fallback-text">
          Provide a Google Maps API key via
          <code className="map-widget__code">VITE_GOOGLE_MAPS_API_KEY</code>
          to display this widget.
        </p>
      </div>
    </div>
  );
};

const MapWidgetInner = ({ apiKey, markers, center, zoom, title, subtitle, className }) => {
  const sanitizedMarkers = useMemo(() => sanitizeMarkers(markers), [markers]);
  const mapCenter = useMemo(() => {
    if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
      return center;
    }

    if (sanitizedMarkers.length > 0) {
      return {
        lat: sanitizedMarkers[0].lat,
        lng: sanitizedMarkers[0].lng,
      };
    }

    return DEFAULT_CENTER;
  }, [center, sanitizedMarkers]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "agrolink-dashboard-map",
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const baseClasses = ["dashboard-section", "map-widget"];
  if (className) {
    className
      .split(/\s+/)
      .filter(Boolean)
      .forEach((token) => {
        if (!baseClasses.includes(token)) {
          baseClasses.push(token);
        }
      });
  }

  const resolvedClassName = baseClasses.join(" ");

  return (
    <div className={resolvedClassName}>
      <div className="dashboard-section__header">
        <h3 className="dashboard-section__title">{title}</h3>
        {subtitle ? <p className="dashboard-subtitle">{subtitle}</p> : null}
      </div>
      <div className="map-widget__body">
        {!isLoaded || loadError ? (
          <div className="map-widget__loading">Loading map preview...</div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={zoom || DEFAULT_ZOOM}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: [
                {
                  featureType: "poi",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "road",
                  elementType: "labels",
                  stylers: [{ visibility: "simplified" }],
                },
              ],
            }}
          >
            {sanitizedMarkers.map((marker, index) => (
              <Marker
                key={`${marker.lat}-${marker.lng}-${index}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                label={marker.label ? marker.label.toString().slice(0, 3) : undefined}
              />
            ))}
          </GoogleMap>
        )}
      </div>
    </div>
  );
};

const MapWidget = ({ markers, center, zoom, title = "Activity Map", subtitle, className }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <MapFallback title={title} subtitle={subtitle} className={className} />;
  }

  return (
    <MapWidgetInner
      apiKey={apiKey}
      markers={markers}
      center={center}
      zoom={zoom}
      title={title}
      subtitle={subtitle}
      className={className}
    />
  );
};

export default MapWidget;