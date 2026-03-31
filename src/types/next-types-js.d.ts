declare module "next/types.js" {
  export type ResolvingMetadata = Promise<unknown>;
  export type ResolvingViewport = Promise<unknown>;
}

declare module "next" {
  export interface NextConfig {
    [key: string]: unknown;
  }

  export interface Metadata {
    [key: string]: unknown;
  }

  export interface Viewport {
    [key: string]: unknown;
  }
}

declare module "next/dist/lib/metadata/types/metadata-interface.js" {
  export type ResolvingMetadata = Promise<unknown>;
  export type ResolvingViewport = Promise<unknown>;
}

declare module "next/dist/build/segment-config/app/app-segment-config.js" {
  export interface InstantConfigForTypeCheckInternal {
    maxDuration?: number;
    memory?: number;
    seconds?: number;
  }
}

declare module "next/dynamic" {
  import type { ComponentType } from "react";

  const dynamic: <TProps = Record<string, never>>(
    loader: () => Promise<unknown>,
    options?: Record<string, unknown>
  ) => ComponentType<TProps>;
  export default dynamic;
}

declare module "next/font/google" {
  export interface LocalFontResult {
    className: string;
    style: Record<string, unknown>;
    variable?: string;
  }

  export const Geist: (options?: Record<string, unknown>) => LocalFontResult;
  export const Geist_Mono: (options?: Record<string, unknown>) => LocalFontResult;
  export const Space_Grotesk: (
    options?: Record<string, unknown>
  ) => LocalFontResult;
}

declare module "next/og" {
  export class ImageResponse {
    constructor(content: unknown, init?: Record<string, unknown>);
  }
}
