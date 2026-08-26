import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { STUDIO_NAME, STUDIO_TAGLINE } from "@/config/site";

/**
 * Share card.
 *
 * The wordmark and the same viewfinder mark used everywhere else, set in the
 * site's own typeface. No stock photograph and nothing that could be mistaken
 * for a picture taken in the studio.
 */
export const runtime = "nodejs";
export const alt = STUDIO_NAME + " - " + STUDIO_TAGLINE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#fcfaf8";
const PAPER_2 = "#f5f2ee";
const PAPER_3 = "#ece7e2";
const LINE = "#dcd6d1";
const INK = "#1b150f";
const INK_2 = "#554e48";
const ACCENT = "#ab331f";
const ACCENT_SOFT = "#ffebe6";

export default async function Image() {
  const [regular, medium] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/NeueMontreal-Regular.ttf")),
    readFile(join(process.cwd(), "src/assets/NeueMontreal-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: 72,
          fontFamily: "Neue Montreal",
          position: "relative",
        }}
      >
        {/* planes */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div
            style={{
              position: "absolute",
              left: 700,
              top: 0,
              width: 150,
              height: 630,
              background: PAPER_2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 862,
              top: 0,
              width: 190,
              height: 630,
              background: PAPER_3,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 1064,
              top: 0,
              width: 136,
              height: 630,
              background: ACCENT_SOFT,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 700,
              top: 404,
              width: 500,
              height: 4,
              background: ACCENT,
            }}
          />
        </div>

        {/* frame */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 40,
            width: 1120,
            height: 550,
            border: "1px solid " + LINE,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <rect
              x="2.75"
              y="2.75"
              width="18.5"
              height="18.5"
              rx="3"
              stroke={ACCENT}
              strokeWidth="1.5"
              opacity="0.4"
            />
            <path
              d="M7 2.75H5.75A3 3 0 0 0 2.75 5.75V7"
              stroke={ACCENT}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M17 21.25h1.25a3 3 0 0 0 3-3V17"
              stroke={ACCENT}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="3.25" stroke={ACCENT} strokeWidth="1.7" />
          </svg>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: INK_2,
            }}
          >
            Studio foto
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 660 }}>
          <div
            style={{
              fontSize: 86,
              fontWeight: 500,
              color: INK,
              letterSpacing: -2,
              lineHeight: 1.02,
            }}
          >
            {STUDIO_NAME}
          </div>
          <div style={{ fontSize: 32, color: INK_2, marginTop: 24, lineHeight: 1.3 }}>
            {STUDIO_TAGLINE}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: INK_2 }}>
          Cek jadwal, pilih slot, kirim lewat WhatsApp
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Neue Montreal", data: regular, weight: 400, style: "normal" },
        { name: "Neue Montreal", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
