import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../lib/format";
import { listTickets } from "../../lib/ticketApi";
import type { Ticket } from "../../types/ticket";

const CATEGORY_COLORS: Record<string, string> = {
  Roads: "#2563eb",
  Waste: "#0f766e",
  Water: "#0ea5e9",
  Electricity: "#d97706",
  Trees: "#7c3aed",
  Drainage: "#be185d",
  Other: "#64748b",
};

const LOCATION_COORDS: Record<string, { x: number; y: number }> = {
  Indiranagar: { x: 620, y: 340 },
  "Jay nagar": { x: 420, y: 520 },
  "BTM Layout": { x: 560, y: 620 },
  Koramangala: { x: 500, y: 480 },
  Whitefield: { x: 720, y: 380 },
  "MG Road": { x: 380, y: 420 },
  "St. Mary's School": { x: 340, y: 300 },
  "Nehru Park": { x: 640, y: 280 },
  "Ram Nagar": { x: 280, y: 560 },
  "Sector 3": { x: 760, y: 460 },
};

export function LiveMapPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => {
    let active = true;
    void listTickets().then((items) => {
      if (active) setTickets(items);
    });
    return () => {
      active = false;
    };
  }, []);

  const markers = useMemo(() => {
    return tickets
      .filter((t) => t.location.trim().length > 0)
      .map((t) => {
        const matchedKey = Object.keys(LOCATION_COORDS).find((k) => t.location.includes(k));
        const coord =
          LOCATION_COORDS[t.location] ??
          (matchedKey ? LOCATION_COORDS[matchedKey] : undefined) ??
          { x: 100 + Math.random() * 700, y: 100 + Math.random() * 500 };

        return {
          id: t.id,
          x: coord.x,
          y: coord.y,
          category: t.category,
          severity: t.severity,
          status: t.status,
          description: t.description,
          location: t.location,
          createdAt: t.createdAt,
        };
      });
  }, [tickets]);

  const severityCounts = useMemo(() => {
    const map: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    markers.forEach((m) => {
      map[m.severity] = (map[m.severity] || 0) + 1;
    });
    return map;
  }, [markers]);

  return (
    <div className="page page--dashboard">
          <div className="dashboard-header">
            <div>
              <p className="eyebrow">Live Map</p>
              <h1 className="dashboard-title">Complaint Heatmap</h1>
              <p className="dashboard-sub">
                Marker colors show severity. Click a marker to open the ticket.
              </p>
            </div>
          </div>

          <div className="map-layout">
            {/* Left: Map canvas */}
            <section className="card" style={{ flex: "1", minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div className="card__header">
                <div>
                  <h2 className="card__title">Bengaluru — Complaint Locations</h2>
                  <p className="card__subtitle">
                    {markers.length} reports plotted on the ward grid
                  </p>
                </div>
                <div className="chip-group">
                  {["All", "Critical", "High", "Medium", "Low"].map((sev) => (
                    <span
                      key={sev}
                      className={`chip ${sev === "All" ? "chip--active" : ""}`}
                      style={{ cursor: "default" }}
                    >
                      {sev}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card__body" style={{ flex: "1", position: "relative", minHeight: 520 }}>
                <div className="map-canvas">
                  {/* Base ward grid — stylized municipal map */}
                  <svg className="map-svg" viewBox="0 0 880 620" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Ward boundaries */}
                    <path
                      d="M 40 60 L 840 60 L 840 580 L 40 580 Z"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <path
                      d="M 440 60 L 440 580 M 40 320 L 840 320"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />

                    {/* Heat zones */}
                    <ellipse cx="620" cy="340" rx="90" ry="70" fill="#b91c1c" fillOpacity="0.08" filter="url(#mapGlow)" />
                    <ellipse cx="500" cy="480" rx="70" ry="55" fill="#d97706" fillOpacity="0.08" filter="url(#mapGlow)" />
                    <ellipse cx="420" cy="520" rx="60" ry="45" fill="#0ea5e9" fillOpacity="0.06" filter="url(#mapGlow)" />

                    {/* Markers */}
                    {markers.map((m) => {
                      const severityFill = m.severity === "Critical" ? "#b91c1c" : m.severity === "High" ? "#d97706" : m.severity === "Medium" ? "#f59e0b" : "#15803d";
                      return (
                        <Link
                          key={m.id}
                          to={`/dashboard/${m.id}`}
                          style={{ textDecoration: "none" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <g
                            className="map-marker"
                            transform={`translate(${m.x - 10}, ${m.y - 28})`}
                            onMouseEnter={(e) => {
                              e.currentTarget.querySelector("circle")?.setAttribute("r", "14");
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.querySelector("circle")?.setAttribute("r", "11");
                            }}
                          >
                            <circle
                              cx="10"
                              cy="10"
                              r="11"
                              fill={severityFill}
                              stroke="#fff"
                              strokeWidth="2.5"
                              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                            />
                            <path
                              d="M 10 24 L 14 20 L 10 16 L 6 20 Z"
                              fill={severityFill}
                              stroke="#fff"
                              strokeWidth="2"
                            />
                            <circle cx="10" cy="10" r="3" fill="#fff" opacity={0.9} />
                          </g>
                        </Link>
                      );
                    })}
                  </svg>

                  {/* Severity legend */}
                  <div className="map-legend">
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#b91c1c" }} />
                      <span className="legend-text">Critical</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#d97706" }} />
                      <span className="legend-text">High</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#f59e0b" }} />
                      <span className="legend-text">Medium</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#15803d" }} />
                      <span className="legend-text">Low</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Right: marker list */}
            <section className="card" style={{ width: "340px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
              <div className="card__header">
                <div>
                  <h2 className="card__title">Reports on Map</h2>
                  <p className="card__subtitle">{markers.length} of {tickets.length} tickets located</p>
                </div>
              </div>
              <div className="card__body">
                {markers.length === 0 ? (
                  <div className="empty-state">
                    <p style={{ margin: "0", color: "#64748b", fontSize: "0.87rem" }}>
                      No reports with location data yet.
                    </p>
                  </div>
                ) : (
                  <div className="marker-list">
                    {markers.map((m) => {
                      const color = CATEGORY_COLORS[m.category] ?? "#64748b";
                      return (
                        <div
                          key={m.id}
                          className="marker-row"
                          style={{ borderBottom: "1px solid var(--color-line)" }}
                          onClick={() => window.location.assign(`/dashboard/${m.id}`)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                            <span className="severity-dot" style={{ backgroundColor: m.severity === "Critical" ? "#b91c1c" : m.severity === "High" ? "#d97706" : m.severity === "Medium" ? "#f59e0b" : "#15803d", width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" }} />
                            <span className="marker-id" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b", fontVariantNumeric: "tabular-nums" }}>{m.id.replace("CL-", "")}</span>
                            <span className="marker-category" style={{ fontSize: "0.72rem", color: color, fontWeight: 600, marginLeft: "auto" }}>{m.category}</span>
                          </div>
                          <p className="marker-desc" style={{ margin: "0 0 0.4rem", fontSize: "0.82rem", color: "#334155", lineHeight: 1.4 }}>
                            {m.description}
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                            <span className="marker-loc" style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>{m.location}</span>
                            <span className="marker-time" style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{formatDateTime(m.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Summary chips below map */}
          <div className="summary-chips" style={{ marginTop: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { label: "Critical", value: severityCounts.Critical, color: "#b91c1c" },
              { label: "High", value: severityCounts.High, color: "#d97706" },
              { label: "Medium", value: severityCounts.Medium, color: "#f59e0b" },
              { label: "Low", value: severityCounts.Low, color: "#15803d" },
            ].map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}
              >
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.color, display: "inline-block" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{s.label}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.85rem", fontWeight: 700, color: "#475569", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              </div>
            ))}
          </div>
    </div>
  );
}
