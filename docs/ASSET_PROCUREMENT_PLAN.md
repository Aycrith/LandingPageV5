# LandingPageV5 — Asset Procurement Plan (Zero-Cost, CC0-First)

- **Status**: Completed
- **Created**: 2026-03-23
- **Scope**: HDRI, ambient audio, PBR maps, volumetric texture seed, OG social image
- **Budget**: $0
- **License policy**: CC0-first (commercial-safe, no attribution required)

## Goal

Acquire and validate production-ready assets for the existing Next.js + React Three Fiber scene pipeline without changing runtime architecture.

## Hard Constraints

1. Assets must be free and commercially safe.
2. Prefer CC0 as default policy.
3. Keep runtime performance within current 3D budget expectations.
4. Use deterministic naming and folder placement under `public/`.

## Verified Integration Targets

- Environment/HDRI integration: `src/canvas/environment/SkyBox.tsx`
- Scene orchestration by act: `src/canvas/SceneManager.tsx`
- Act-specific visual timing: `src/canvas/acts/Act1Emergence.tsx` to `src/canvas/acts/Act5Convergence.tsx`
- Particle/volumetric visual texture usage: `src/canvas/particles/ParticleField.tsx`
- Global metadata and OG image wiring: `src/app/layout.tsx`

## Primary Shortlist (CC0-first)

### HDRI

- Primary: **Kloppenheim 07 (4K EXR)**  
  https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/4k/kloppenheim_07_4k.exr
- Backups:
  - https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/4k/qwantani_night_puresky_4k.exr
  - https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/4k/solitude_night_4k.exr
  - https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/4k/clarens_night_02_4k.exr

### Ambient Audio (one bed per act)

- Act 1: Ominous Rumble — https://freesound.org/people/steaq/sounds/593785/
- Act 2: Sci-fi Ambient Drone — https://freesound.org/people/LookIMadeAThing/sounds/534018/
- Act 3: Simple Dm Minor Pad Drone [loop] —  https://freesound.org/people/cabled_mess/sounds/366013/
- Act 4: Light Ambient Glitching Soundscape — https://freesound.org/people/bassimat/sounds/840935/
- Act 5: Strings and Drums — https://freesound.org/people/BuytheField/sounds/465294/

### PBR Packs

- Rock063 — https://ambientcg.com/view?id=Rock063
- Metal049A — https://ambientcg.com/view?id=Metal049A
- Ground103 — https://ambientcg.com/view?id=Ground103

### Volumetric Seed Texture

- In-house procedural generation via Blender nodes (Noise + White Noise), then baked seamless monochrome 1K texture.
- Reference:
  - https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/noise.html
  - https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/white_noise.html

## Performance & Runtime Gates

Use these as acceptance limits while integrating:

- Desktop target FPS: **60fps**
- Mobile target FPS: **30fps**
- Draw calls target: **< 100 desktop**, **< 50 mobile**
- Texture memory target: **< 128MB desktop**, **< 64MB mobile**
- Load-time target: **< 3s desktop**, **< 5s mobile**

## Repository Asset Layout Standard

```text
public/
  env/
    hdri/
  audio/
    acts/
  textures/
    pbr/
      rock063/
      metal049a/
      ground103/
    volumetric/
  social/
    og-image-1200x630.png

src/
  app/
    opengraph-image.tsx
    twitter-image.tsx
```

## Procurement Execution Sequence

1. **Legal lock (blocking)**
   - Record source URL + explicit license page URL for every selected asset.
   - Reject assets with unclear license terms.

2. **HDRI lock**
   - Choose primary + 2 backups.
   - Validate EXR opens and renders cleanly in current environment flow.

3. **Audio lock**
   - One track per act.
   - Normalize target loudness and confirm loop friendliness.

4. **PBR lock**
   - Prefer 2K maps by default.
   - Reserve 4K only for hero closeups.

5. **Volumetric generation**
   - Produce 1 seamless monochrome 1K texture.
   - Validate visible tiling = none at target camera distances.

6. **Social metadata pack**
  - Keep generated fallback routes in place:
    - `src/app/opengraph-image.tsx`
    - `src/app/twitter-image.tsx`
  - (Optional override) add static `public/social/og-image-1200x630.png` if design team provides a finalized card.
  - Ensure metadata remains wired in `src/app/layout.tsx`.

7. **Manifest + signoff**
   - Complete `docs/ASSET_MANIFEST.csv`.
   - Ensure all acceptance gates pass before implementation starts.

## Definition of Done (Procurement)

1. Each asset has a recorded source URL and license-proof URL.
2. HDRI selected (primary + backups) and EXR validity checked.
3. Five act tracks assigned and loop suitability validated.
4. PBR bundles contain required maps (normal, roughness, metalness, AO; albedo where available).
5. One seamless 1K monochrome volumetric texture exists.
6. Social preview is available via generated routes:
  - `src/app/opengraph-image.tsx`
  - `src/app/twitter-image.tsx`
  (Optional static override: `public/social/og-image-1200x630.png`)
7. `docs/ASSET_MANIFEST.csv` is complete, including:
   - `maxRuntimeSizeMB`
   - `fallbackAsset`

## Handoff Notes

- This document defines procurement and verification only.
- Runtime integration should be executed in a separate implementation pass.
- Keep all filenames lowercase and hyphenated for consistency and cache predictability.
