"use client";

import { Component, type ReactNode } from "react";
import { director } from "@/lib/director";

/**
 * Si WebGL refuse de démarrer (pilote bloqué, mémoire saturée…), la page
 * continue sans la scène 3D : ciel fixe et textes, au lieu d'une page vide.
 */
export class GlBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    director.setGlActive(false);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
