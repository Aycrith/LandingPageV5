"use client";

import type { CSSProperties } from "react";
import type {
  ActViewportProfile,
  TextLayoutMode,
  TextPanelMode,
} from "@/canvas/viewportProfiles";
import { useScrollStore } from "@/stores/scrollStore";
import { cn } from "@/lib/utils";
import { TextReveal } from "./TextReveal";
import { MagneticButton } from "./MagneticButton";

interface ActContentProps {
  profile: ActViewportProfile;
}

function getLayoutClasses(layout: TextLayoutMode) {
  switch (layout) {
    case "left-column":
      return {
        shell:
          "absolute inset-y-0 left-0 flex items-center px-6 md:px-10 lg:px-14",
        content: "items-start text-left",
      };
    case "right-column":
      return {
        shell:
          "absolute inset-y-0 right-0 flex items-center justify-end px-6 md:px-10 lg:px-14",
        content: "items-start text-left",
      };
    case "upper-band":
      return {
        shell:
          "absolute inset-x-0 top-[clamp(3.5rem,8vw,6.5rem)] flex justify-center px-6 md:px-10",
        content: "items-center text-center",
      };
    case "lower-third":
      return {
        shell:
          "absolute inset-x-0 bottom-[clamp(2.5rem,8vw,5rem)] flex justify-center px-6 md:px-10",
        content: "items-center text-center",
      };
    case "top-center":
    default:
      return {
        shell:
          "absolute inset-x-0 top-[clamp(2.75rem,8vw,5.75rem)] flex justify-center px-6 md:px-10",
        content: "items-center text-center",
      };
  }
}

function getPanelClasses(panel: TextPanelMode) {
  switch (panel) {
    case "glass":
      return "border border-white/10 bg-black/28 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.28)]";
    case "hud":
      return "border border-white/12 bg-black/32 backdrop-blur-xl shadow-[0_18px_64px_rgba(0,0,0,0.25)]";
    case "soft":
      return "border border-white/8 bg-black/22 backdrop-blur-xl shadow-[0_16px_56px_rgba(0,0,0,0.18)]";
    case "none":
    default:
      return "border border-transparent bg-transparent";
  }
}

export function ActContent({ profile }: ActContentProps) {
  const activeAct = useScrollStore((state) => state.activeAct);
  const actProgress = useScrollStore((state) => state.actProgress);

  const scrollIndex = activeAct + actProgress;
  const distance = Math.abs(scrollIndex - profile.id);
  const opacity = Math.max(0, 1 - distance * 1.45);
  const translateY = distance * 32;
  const isVisible = opacity > 0.02;
  const isActive = activeAct === profile.id;
  const titleScaleClass =
    profile.textSafeZone.titleScale === "feature"
      ? "text-4xl md:text-6xl lg:text-7xl"
      : "text-5xl md:text-7xl lg:text-8xl";
  const layoutClasses = getLayoutClasses(profile.textSafeZone.layout);
  const panelClasses = getPanelClasses(profile.textSafeZone.panel);
  const maxWidthStyle: CSSProperties = {
    maxWidth: `${profile.textSafeZone.maxWidthRem}rem`,
    "--act-accent": profile.accent,
  } as CSSProperties;

  return (
    <section
      className="act-section pointer-events-none"
      aria-hidden={!isVisible}
    >
      {isVisible ? (
        <div
          className={layoutClasses.shell}
          style={{
            opacity,
            transform: `translateY(${translateY}px)`,
            willChange: "transform, opacity",
          }}
        >
          <div
            className={cn(
              "relative flex w-full flex-col gap-4 rounded-[2rem] p-5 md:p-7 lg:p-8",
              layoutClasses.content,
              panelClasses
            )}
            style={maxWidthStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={{
                background: `radial-gradient(circle at top, rgba(5, 5, 7, ${profile.textSafeZone.veilOpacity}), rgba(5, 5, 7, ${profile.textSafeZone.veilOpacity * 0.45}) 52%, rgba(5, 5, 7, 0) 100%)`,
              }}
            />
            {profile.textSafeZone.panel !== "none" ? (
              <>
                <div
                  className="pointer-events-none absolute inset-x-8 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--act-accent), transparent)",
                    opacity: 0.8,
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-y-8 right-0 w-px"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, rgba(255,255,255,0.24), transparent)",
                  }}
                />
              </>
            ) : null}
            <div className="relative z-10">
              <div
                className={cn(
                  "mb-3 inline-flex items-center gap-3 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]",
                  isActive ? "opacity-100" : "opacity-75"
                )}
                style={{
                  borderColor: "color-mix(in srgb, var(--act-accent) 38%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--act-accent) 10%, rgba(5,5,7,0.65))",
                  color: "color-mix(in srgb, var(--act-accent) 82%, #f6fbff)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--act-accent)",
                    boxShadow: "0 0 16px var(--act-accent)",
                  }}
                />
                {profile.copy.eyebrow}
              </div>
              <h2
                className={cn(
                  titleScaleClass,
                  "font-semibold tracking-[-0.05em] text-white",
                  profile.textSafeZone.align === "center" ? "mx-auto" : ""
                )}
                style={{ fontFamily: "var(--font-heading), sans-serif" }}
              >
                <TextReveal text={profile.copy.title} trigger={isActive} stagger={34} />
              </h2>
              <p className="mt-4 text-sm uppercase tracking-[0.16em] text-white/55 md:text-base">
                {profile.copy.subtitle}
              </p>
              {profile.copy.body ? (
                <p className="mt-4 max-w-[34rem] text-sm leading-relaxed text-white/48 md:text-base">
                  {profile.copy.body}
                </p>
              ) : null}
              {profile.copy.ctaLabel ? (
                <div className="mt-8 pointer-events-auto">
                  <MagneticButton
                    href={profile.copy.ctaHref}
                    className="rounded-full border border-white/15 bg-white/5 px-7 py-3 text-xs uppercase tracking-[0.28em] text-white/78 transition-colors duration-500 hover:border-white/40 hover:bg-white/10 hover:text-white"
                  >
                    {profile.copy.ctaLabel}
                  </MagneticButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
