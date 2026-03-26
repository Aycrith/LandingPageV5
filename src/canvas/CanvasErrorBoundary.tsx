"use client";

import React, { Component, ReactNode } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CanvasErrorBoundary] WebGL or Canvas error caught:", error, errorInfo);
    // Force UI completion so user isn't stuck on a loading screen
    useUIStore.getState().setLoadProgress(1);
    useUIStore.getState().setReady();
    useSceneLoadStore.getState().markFallbackTriggered();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ width: "100%", height: "100%", background: "#050507", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#666", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Visuals limited (Safe Mode)</span>
          {process.env.NODE_ENV !== "production" && this.state.errorMessage && (
            <span style={{ fontSize: "0.65rem", opacity: 0.35, maxWidth: "60ch", textAlign: "center" }}>
              {this.state.errorMessage}
            </span>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight boundary that wraps PostProcessingStack only.
 * @react-three/postprocessing + React 19 concurrent rendering can throw
 * EffectComposer.addPass(null) during reconciliation. Catching this here
 * silently disables postprocessing without tearing down the canvas.
 */
export class PostFxErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[PostFxErrorBoundary] Postprocessing suppressed:", error.message);
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
