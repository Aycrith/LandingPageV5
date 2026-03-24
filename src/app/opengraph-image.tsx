import { ImageResponse } from "next/og";

export const alt = "Immersive 3D Experience social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "radial-gradient(circle at 30% 30%, #2a2a4a 0%, #0a0a14 45%, #050507 100%)",
          color: "#f8f8ff",
          fontFamily: "Inter, Geist, sans-serif",
          letterSpacing: "0.02em",
          textAlign: "center",
          padding: "48px",
        }}
      >
        <div
          style={{
            fontSize: 28,
            opacity: 0.72,
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          LandingPageV5
        </div>
        <div
          style={{
            fontSize: 84,
            lineHeight: 1.05,
            fontWeight: 700,
            maxWidth: 1000,
          }}
        >
          Immersive 3D Experience
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            opacity: 0.9,
            maxWidth: 940,
          }}
        >
          Scroll-driven visuals · GPU particles · Custom shaders
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
