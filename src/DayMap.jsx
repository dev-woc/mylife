import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths broken by Vite's asset pipeline
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

const BOSTON = [42.3601, -71.0589];

// Fits map to stop bounds when stops change
function MapFitter({ stops }) {
  const map = useMap();
  useEffect(() => {
    const geo = stops.filter(s => s.lat && s.lng);
    if (geo.length === 0) {
      map.setView(BOSTON, 12);
    } else if (geo.length === 1) {
      map.setView([geo[0].lat, geo[0].lng], 14);
    } else {
      map.fitBounds(geo.map(s => [s.lat, s.lng]), { padding: [48, 48] });
    }
  }, [stops, map]);
  return null;
}

// Custom numbered divIcon marker
function makeMarker(n, active = false) {
  return L.divIcon({
    className: "",
    iconAnchor: [16, 16],
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${active ? "#C0733A" : "#FFFBF7"};
      border:2px solid ${active ? "#C0733A" : "rgba(44,31,20,0.25)"};
      box-shadow:0 2px 8px rgba(44,31,20,0.18);
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;
      color:${active ? "#FFFBF7" : "#2C1F14"};
      transition:all 0.15s;
    ">${n}</div>`,
  });
}

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&email=jay@wayofcode.com`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function fetchRoute(stops) {
  const geo = stops.filter(s => s.lat && s.lng);
  if (geo.length < 2) return null;
  const coords = geo.map(s => `${s.lng},${s.lat}`).join(";");
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code !== "Ok") return null;
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch {
    return geo.map(s => [s.lat, s.lng]); // fallback: straight lines
  }
}

export default function DayMap({ date }) {
  const [stops, setStops] = useState([]);
  const [routeCoords, setRouteCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [activeStop, setActiveStop] = useState(null);
  const markerRefs = useRef({});
  const geocodeTimer = useRef(null);

  // Load stops from DB
  useEffect(() => {
    setLoading(true);
    fetch(`/api/stops?date=${date}`)
      .then(r => r.json())
      .then(data => { setStops(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [date]);

  // Recompute route when stops change
  useEffect(() => {
    setRouteCoords(null);
    fetchRoute(stops).then(setRouteCoords);
  }, [stops]);

  // Sync marker layers to map
  useEffect(() => {
    Object.values(markerRefs.current).forEach(m => m?.remove());
    markerRefs.current = {};
  }, [stops]);

  const addStop = useCallback(async () => {
    if (!nameInput.trim() || !addressInput.trim()) return;
    setGeocoding(true);
    const coords = await geocode(addressInput).catch(() => null);
    setGeocoding(false);

    const res = await fetch("/api/stops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, name: nameInput.trim(), address: addressInput.trim(), ...coords }),
    });
    const newStop = await res.json();

    // If geocoding happened client-side after insert, patch the coords
    if (coords && !newStop.lat) {
      await fetch("/api/stops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newStop.id, ...coords }),
      });
      newStop.lat = coords.lat;
      newStop.lng = coords.lng;
    }

    setStops(prev => [...prev, newStop]);
    setNameInput("");
    setAddressInput("");
    setAdding(false);
  }, [date, nameInput, addressInput]);

  const deleteStop = useCallback(async (stop) => {
    await fetch("/api/stops", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: stop.id, date }),
    });
    setStops(prev => prev.filter(s => s.id !== stop.id).map((s, i) => ({ ...s, position: i + 1 })));
  }, [date]);

  const geoStops = stops.filter(s => s.lat && s.lng);

  return (
    <>
      <style>{`
        .map-wrap {
          display: flex;
          height: calc(100vh - 130px);
          min-height: 480px;
          background: #F5EEE6;
        }

        .stops-panel {
          width: 300px;
          min-width: 300px;
          background: #FFFBF7;
          border-right: 1px solid rgba(44,31,20,0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .stops-panel-header {
          padding: 20px 20px 12px;
          border-bottom: 1px solid rgba(44,31,20,0.08);
          flex-shrink: 0;
        }

        .stops-panel-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(44,31,20,0.4);
        }

        .stops-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 0;
        }

        .stop-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 20px;
          cursor: pointer;
          transition: background 0.12s;
          border-left: 2px solid transparent;
        }

        .stop-item:hover { background: rgba(44,31,20,0.03); }

        .stop-item.active {
          background: rgba(192,115,58,0.06);
          border-left-color: #C0733A;
        }

        .stop-num {
          width: 28px;
          height: 28px;
          min-width: 28px;
          border-radius: 50%;
          background: #F5EEE6;
          border: 1.5px solid rgba(44,31,20,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #2C1F14;
          margin-top: 2px;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .stop-item.active .stop-num {
          background: #C0733A;
          border-color: #C0733A;
          color: #FFFBF7;
        }

        .stop-info { flex: 1; min-width: 0; }

        .stop-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #2C1F14;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stop-address {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: rgba(44,31,20,0.45);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stop-no-geo {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          color: rgba(192,115,58,0.7);
          letter-spacing: 1px;
          margin-top: 3px;
        }

        .stop-delete {
          background: none;
          border: none;
          color: rgba(44,31,20,0.2);
          font-size: 18px;
          cursor: pointer;
          padding: 0 2px;
          line-height: 1;
          transition: color 0.1s;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .stop-delete:hover { color: #C0392B; }

        .stops-connector {
          width: 1px;
          height: 16px;
          background: rgba(44,31,20,0.12);
          margin: 0 29px;
        }

        .add-stop-panel {
          padding: 12px 20px 20px;
          border-top: 1px solid rgba(44,31,20,0.08);
          flex-shrink: 0;
        }

        .add-stop-btn {
          width: 100%;
          background: none;
          border: 1px dashed rgba(44,31,20,0.2);
          border-radius: 8px;
          padding: 9px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(44,31,20,0.35);
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }

        .add-stop-btn:hover {
          border-color: rgba(44,31,20,0.4);
          color: rgba(44,31,20,0.65);
          background: rgba(44,31,20,0.02);
        }

        .add-stop-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stop-input {
          width: 100%;
          background: #F5EEE6;
          border: 1px solid rgba(44,31,20,0.12);
          border-radius: 6px;
          padding: 8px 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #2C1F14;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }

        .stop-input:focus { border-color: #C0733A; }
        .stop-input::placeholder { color: rgba(44,31,20,0.3); }

        .add-stop-actions {
          display: flex;
          gap: 8px;
        }

        .stop-save-btn {
          flex: 1;
          background: #2C1F14;
          color: #F5EEE6;
          border: none;
          border-radius: 6px;
          padding: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .stop-save-btn:hover { opacity: 0.8; }
        .stop-save-btn:disabled { opacity: 0.4; cursor: default; }

        .stop-cancel-btn {
          background: none;
          border: 1px solid rgba(44,31,20,0.15);
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: rgba(44,31,20,0.5);
          cursor: pointer;
          transition: all 0.15s;
        }

        .stop-cancel-btn:hover {
          border-color: rgba(44,31,20,0.3);
          color: rgba(44,31,20,0.75);
        }

        .map-container-wrap {
          flex: 1;
          position: relative;
        }

        .map-empty-state {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: rgba(44,31,20,0.3);
          letter-spacing: 0.5px;
          pointer-events: none;
          z-index: 1000;
        }

        .leaflet-container {
          height: 100%;
          width: 100%;
          background: #F5EEE6;
          font-family: 'DM Sans', sans-serif;
        }

        .leaflet-control-attribution {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 10px !important;
          background: rgba(245,238,230,0.85) !important;
          color: rgba(44,31,20,0.45) !important;
        }

        .leaflet-control-attribution a { color: rgba(44,31,20,0.55) !important; }

        @media (max-width: 640px) {
          .map-wrap { flex-direction: column; height: auto; }
          .stops-panel { width: 100%; min-width: 0; border-right: none; border-bottom: 1px solid rgba(44,31,20,0.1); max-height: 260px; }
          .map-container-wrap { height: 320px; }
        }
      `}</style>

      <div className="map-wrap">
        {/* Stop list panel */}
        <div className="stops-panel">
          <div className="stops-panel-header">
            <div className="stops-panel-title">Route · {date}</div>
          </div>

          <div className="stops-list">
            {loading ? (
              <div style={{ padding: "20px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(44,31,20,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
                Loading…
              </div>
            ) : stops.length === 0 ? (
              <div style={{ padding: "20px 20px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(44,31,20,0.3)" }}>
                No stops yet. Add your first location below.
              </div>
            ) : (
              stops.map((stop, i) => (
                <div key={stop.id}>
                  <div
                    className={`stop-item${activeStop === stop.id ? " active" : ""}`}
                    onClick={() => setActiveStop(activeStop === stop.id ? null : stop.id)}
                  >
                    <div className="stop-num">{stop.position}</div>
                    <div className="stop-info">
                      <div className="stop-name">{stop.name}</div>
                      <div className="stop-address">{stop.address}</div>
                      {!stop.lat && <div className="stop-no-geo">Not geocoded</div>}
                    </div>
                    <button
                      className="stop-delete"
                      onMouseDown={e => { e.stopPropagation(); deleteStop(stop); }}
                    >×</button>
                  </div>
                  {i < stops.length - 1 && <div className="stops-connector" />}
                </div>
              ))
            )}
          </div>

          <div className="add-stop-panel">
            {adding ? (
              <div className="add-stop-form">
                <input
                  autoFocus
                  className="stop-input"
                  placeholder="Label (e.g. Raytheon)"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") { setAdding(false); setNameInput(""); setAddressInput(""); } }}
                />
                <input
                  className="stop-input"
                  placeholder="Address"
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addStop(); if (e.key === "Escape") { setAdding(false); setNameInput(""); setAddressInput(""); } }}
                />
                <div className="add-stop-actions">
                  <button className="stop-save-btn" onClick={addStop} disabled={geocoding || !nameInput.trim() || !addressInput.trim()}>
                    {geocoding ? "Locating…" : "Add Stop"}
                  </button>
                  <button className="stop-cancel-btn" onClick={() => { setAdding(false); setNameInput(""); setAddressInput(""); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="add-stop-btn" onClick={() => setAdding(true)}>+ Add Stop</button>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="map-container-wrap">
          {geoStops.length === 0 && !loading && (
            <div className="map-empty-state">Add stops with addresses to see them on the map</div>
          )}
          <MapContainer
            center={BOSTON}
            zoom={12}
            zoomControl={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />
            <MapFitter stops={stops} />

            {geoStops.map((stop, i) => {
              const marker = L.marker([stop.lat, stop.lng], {
                icon: makeMarker(stop.position, activeStop === stop.id),
              });
              return (
                <MapMarker
                  key={stop.id}
                  stop={stop}
                  index={i}
                  active={activeStop === stop.id}
                  onSelect={setActiveStop}
                />
              );
            })}

            {routeCoords && routeCoords.length > 1 && (
              <Polyline
                positions={routeCoords}
                pathOptions={{ color: "#C0733A", weight: 3, opacity: 0.45 }}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </>
  );
}

// Separate component so we can use useMap for imperative marker management
function MapMarker({ stop, active, onSelect }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!stop.lat || !stop.lng) return;

    const marker = L.marker([stop.lat, stop.lng], {
      icon: makeMarker(stop.position, active),
    });

    marker.bindPopup(`<b style="font-family:'DM Sans',sans-serif">${stop.name}</b><br/><span style="font-size:11px;color:rgba(44,31,20,0.5)">${stop.address}</span>`);
    marker.on("click", () => onSelect(id => id === stop.id ? null : stop.id));
    marker.addTo(map);
    markerRef.current = marker;

    return () => marker.remove();
  }, [stop, active, map, onSelect]);

  // Re-render icon when active state changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(makeMarker(stop.position, active));
    }
  }, [active, stop.position]);

  return null;
}
