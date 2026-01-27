import { ImageResponse } from "next/og";

import { AppIconSvg } from "@/lib/app-icon-svg";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#0f172a",
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIconSvg style={{ width: "80%", height: "80%" }} />
      </div>
    ),
    size,
  );
}
