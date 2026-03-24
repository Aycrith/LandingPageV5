import { useEffect, useMemo } from "react";
import * as THREE from "three";

interface SharedTextureOptions {
  repeat?: number;
  colorSpace?: THREE.ColorSpace;
  wrapS?: THREE.Wrapping;
  wrapT?: THREE.Wrapping;
}

interface CachedTexture {
  refs: number;
  texture: THREE.Texture;
}

const loader = new THREE.TextureLoader();
const textureCache = new Map<string, CachedTexture>();

function createTextureKey(
  url: string,
  { repeat = 1, colorSpace, wrapS, wrapT }: SharedTextureOptions
): string {
  return [
    url,
    repeat,
    colorSpace ?? "default",
    wrapS ?? THREE.ClampToEdgeWrapping,
    wrapT ?? THREE.ClampToEdgeWrapping,
  ].join("|");
}

function configureTexture(
  texture: THREE.Texture,
  {
    repeat = 1,
    colorSpace,
    wrapS = THREE.ClampToEdgeWrapping,
    wrapT = THREE.ClampToEdgeWrapping,
  }: SharedTextureOptions
) {
  texture.wrapS = wrapS;
  texture.wrapT = wrapT;
  texture.repeat.set(repeat, repeat);
  if (colorSpace) {
    texture.colorSpace = colorSpace;
  }
}

function acquireTexture(
  key: string,
  url: string,
  options: SharedTextureOptions
): THREE.Texture {
  const cached = textureCache.get(key);
  if (cached) {
    cached.refs += 1;
    return cached.texture;
  }

  const texture = loader.load(url, (loadedTexture) => {
    configureTexture(loadedTexture, options);
    loadedTexture.needsUpdate = true;
  });
  configureTexture(texture, options);
  textureCache.set(key, {
    refs: 1,
    texture,
  });

  return texture;
}

function releaseTexture(key: string) {
  const cached = textureCache.get(key);
  if (!cached) return;

  cached.refs -= 1;
  if (cached.refs > 0) return;

  cached.texture.dispose();
  textureCache.delete(key);
}

export function useSharedTexture(
  url: string,
  options: SharedTextureOptions = {}
): THREE.Texture {
  const {
    repeat = 1,
    colorSpace,
    wrapS = THREE.ClampToEdgeWrapping,
    wrapT = THREE.ClampToEdgeWrapping,
  } = options;

  const key = useMemo(
    () =>
      createTextureKey(url, {
        repeat,
        colorSpace,
        wrapS,
        wrapT,
      }),
    [url, repeat, colorSpace, wrapS, wrapT]
  );

  const texture = useMemo(
    () =>
      acquireTexture(key, url, {
        repeat,
        colorSpace,
        wrapS,
        wrapT,
      }),
    [key, url, repeat, colorSpace, wrapS, wrapT]
  );

  useEffect(() => () => releaseTexture(key), [key]);

  return texture;
}

export function useRepeatingTexture(
  url: string,
  options: Omit<SharedTextureOptions, "wrapS" | "wrapT"> = {}
): THREE.Texture {
  return useSharedTexture(url, {
    ...options,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
  });
}
