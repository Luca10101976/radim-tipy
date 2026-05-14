import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Radim.pro – tebe, když nevíš";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0fdf9 0%, #e6f7f4 50%, #ccf0e8 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Dekorativní kruhy */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(20, 184, 166, 0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(20, 184, 166, 0.06)",
            display: "flex",
          }}
        />

        {/* Maskot */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://radim.pro/radim-maskot.png"
          width={180}
          height={180}
          style={{ borderRadius: "50%", marginBottom: 32, objectFit: "cover" }}
          alt="Radim"
        />

        {/* Logo text */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#0f766e", letterSpacing: "-2px" }}>
            Radim
          </span>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#9ca3af", letterSpacing: "-2px" }}>
            .pro
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#6b7280",
            fontWeight: 400,
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Domácí tipy ověřené ostatními.
          <br />
          Víš předem, co funguje — a co ne.
        </div>
      </div>
    ),
    { ...size }
  );
}
