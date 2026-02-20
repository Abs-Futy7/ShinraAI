"use client";

import type { CSSProperties } from "react";

type DarkVeilProps = {
  hueShift?: number;
  noiseIntensity?: number;
  scanlineIntensity?: number;
  speed?: number;
  scanlineFrequency?: number;
  warpAmount?: number;
  resolutionScale?: number;
  className?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function DarkVeil({
  hueShift = 0,
  noiseIntensity = 0,
  scanlineIntensity = 0,
  speed = 0.5,
  scanlineFrequency = 0,
  warpAmount = 0,
  resolutionScale = 1,
  className = "",
}: DarkVeilProps) {
  const safeSpeed = clamp(speed, 0.05, 3);
  const safeNoise = clamp(noiseIntensity, 0, 1);
  const safeScanline = clamp(scanlineIntensity, 0, 1);
  const safeResolution = clamp(resolutionScale, 0.5, 2);
  const safeWarp = clamp(warpAmount, 0, 1);
  const safeScanlineFreq = clamp(scanlineFrequency, 0, 1);

  const driftDuration = `${24 / safeSpeed}s`;
  const pulseDuration = `${16 / safeSpeed}s`;
  const warpPx = `${safeWarp * 14}px`;
  const scanlineSize = safeScanlineFreq > 0 ? `${Math.max(2, Math.round(12 - safeScanlineFreq * 10))}px` : "0px";

  return (
    <div
      className={`dark-veil-root ${className}`}
      style={
        {
          "--dv-hue-shift": `${hueShift}deg`,
          "--dv-noise-opacity": `${safeNoise * 0.18}`,
          "--dv-scanline-opacity": `${safeScanline * 0.14}`,
          "--dv-drift-duration": driftDuration,
          "--dv-pulse-duration": pulseDuration,
          "--dv-warp": warpPx,
          "--dv-scanline-size": scanlineSize,
          "--dv-resolution": `${safeResolution}`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <div className="dv-layer dv-base" />
      <div className="dv-layer dv-glow" />
      <div className="dv-layer dv-noise" />
      <div className="dv-layer dv-scanlines" />
    </div>
  );
}
