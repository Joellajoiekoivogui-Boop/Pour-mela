import { ImageResponse } from "next/og";

export const alt = "MonMentor · Un mentor pour vos ambitions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, background: "#1b2533", color: "white", padding: 80 }}>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}><span>Mon</span><span style={{ color: "#f5a35b" }}>Mentor</span></div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>Un mentor pour vos ambitions.</div>
        <div style={{ display: "flex", fontSize: 34, opacity: 0.85 }}>Des professionnels vérifiés, en Guinée et dans la diaspora.</div>
      </div>
    ),
    size,
  );
}
