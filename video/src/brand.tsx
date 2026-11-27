import {Img, staticFile} from "remotion";
import type {CSSProperties, ReactNode} from "react";

export const COLORS = {
  navy: "#0A0F20",
  yellow: "#FFCF33",
  cream: "#F2F1E9",
  panel: "#11192B",
  red: "#E96D6A",
  muted: "#9EA5B3",
};

export const FontFaces = () => (
  <style>
    {`
      @font-face {
        font-family: ArchivoDeck;
        src: url("${staticFile("fonts/archivo-latin.woff2")}") format("woff2");
        font-style: normal;
        font-weight: 800;
        font-stretch: 125%;
        unicode-range: U+0000-00FF, U+2000-206F, U+20AC, U+2122, U+2190-21FF;
        font-display: block;
      }
      @font-face {
        font-family: ArchivoDeck;
        src: url("${staticFile("fonts/archivo-latin-ext.woff2")}") format("woff2");
        font-style: normal;
        font-weight: 800;
        font-stretch: 125%;
        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20CF, U+2C60-2C7F, U+A720-A7FF;
        font-display: block;
      }
      @font-face {
        font-family: ManropeDeck;
        src: url("${staticFile("fonts/manrope-latin.woff2")}") format("woff2");
        font-style: normal;
        font-weight: 400 800;
        unicode-range: U+0000-00FF, U+2000-206F, U+20AC, U+2122, U+2190-21FF;
        font-display: block;
      }
      @font-face {
        font-family: ManropeDeck;
        src: url("${staticFile("fonts/manrope-latin-ext.woff2")}") format("woff2");
        font-style: normal;
        font-weight: 400 800;
        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20CF, U+2C60-2C7F, U+A720-A7FF;
        font-display: block;
      }
      @font-face {
        font-family: JetBrainsDeck;
        src: url("${staticFile("fonts/jetbrains-mono-latin.woff2")}") format("woff2");
        font-style: normal;
        font-weight: 400 700;
        unicode-range: U+0000-00FF, U+2000-206F, U+20AC, U+2122, U+2190-21FF;
        font-display: block;
      }
      @font-face {
        font-family: JetBrainsDeck;
        src: url("${staticFile("fonts/jetbrains-mono-latin-ext.woff2")}") format("woff2");
        font-style: normal;
        font-weight: 400 700;
        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20CF, U+2C60-2C7F, U+A720-A7FF;
        font-display: block;
      }
    `}
  </style>
);

export const BrandArcs = ({opacity = 0.27}: {opacity?: number}) => (
  <svg
    aria-hidden
    width={740}
    height={740}
    viewBox="0 0 740 740"
    style={{
      position: "absolute",
      right: -245,
      bottom: -385,
      opacity,
      pointerEvents: "none",
    }}
  >
    {[188, 240, 292, 344, 396, 448, 500, 552].map((radius) => (
      <circle
        key={radius}
        cx={380}
        cy={380}
        r={radius}
        fill="none"
        stroke={COLORS.yellow}
        strokeWidth={1.2}
      />
    ))}
  </svg>
);

export const DeckLogo = ({
  page = 1,
  style,
}: {
  page?: 1 | 4;
  style?: CSSProperties;
}) => (
  <Img
    src={staticFile(`images/logo-page${page}.png`)}
    style={{
      objectFit: "contain",
      ...style,
    }}
  />
);

export const StoryLabel = ({children}: {children: ReactNode}) => (
  <div
    style={{
      position: "absolute",
      top: 58,
      left: 96,
      color: COLORS.yellow,
      fontFamily: "JetBrainsDeck, monospace",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: 1.5,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

export const AccentLine = ({
  style,
}: {
  style?: CSSProperties;
}) => (
  <div
    style={{
      width: 108,
      height: 4,
      backgroundColor: COLORS.yellow,
      ...style,
    }}
  />
);
