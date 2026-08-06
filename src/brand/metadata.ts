/**
 * RescueLoop metadata helpers — environment-safe metadata and index policy.
 */

import type { Metadata, MetadataRoute } from "next";

/** Derive metadataBase from environment, safe for preview/local. */
export function getMetadataBase(): URL {
  const appUrl = process.env.APP_URL;
  if (appUrl && appUrl.length > 0) return new URL(appUrl);

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.length > 0) return new URL(`https://${vercelUrl}`);

  return new URL("http://localhost:3000");
}

/** Index policy for public pages. */
export function publicIndexMetadata(): Metadata {
  return {
    robots: { index: true, follow: true },
  };
}

/** Noindex policy for private/internal/demo/student pages. */
export function noIndexMetadata(): Metadata {
  return {
    robots: { index: false, follow: false },
  };
}

/** Default OG image path. */
export const OG_IMAGE_PATH = "/brand/og-default-1200x630.png";
export const OG_IMAGE_ALT = "RescueLoop — Activation rescue for Whop creators";

/** Default Twitter image path. */
export const TWITTER_IMAGE_PATH = "/brand/twitter-default-1200x630.png";
export const TWITTER_IMAGE_ALT = "RescueLoop — Activation rescue for Whop creators";

/** Web manifest. */
export function generateManifest(): MetadataRoute.Manifest {
  return {
    name: "RescueLoop",
    short_name: "RescueLoop",
    description: "Activation rescue for Whop creators.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F1EA",
    theme_color: "#147D68",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
