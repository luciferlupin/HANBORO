import React from "react";

export function HanboroLogo({ size = 28, theme = "dark" }) {
  const src = theme === "light" ? "/hanboro-horizontal-light.png" : "/hanboro-horizontal-dark.png";
  return (
    <div className="hanboro-logo" style={{ height: size }}>
      <img
        src={src}
        alt="HANBORO"
        className="hanboro-logo__img"
        style={{ height: size, width: "auto", display: "block", objectFit: "contain" }}
      />
    </div>
  );
}
