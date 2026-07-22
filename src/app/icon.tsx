import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 192,
        height: 192,
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
        borderRadius: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="110" height="110" viewBox="0 0 24 24" fill="none"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6"  y1="20" x2="6"  y2="14" />
      </svg>
    </div>,
    { ...size }
  );
}
