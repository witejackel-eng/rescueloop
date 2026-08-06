import { describe, it, expect } from "vitest";
import { sanitizeVariant } from "@/hooks/use-reduced-motion-contract";
import type { Variant } from "framer-motion";

describe("sanitizeVariant (reduced motion contract)", () => {
  describe("when reduced = false", () => {
    it("returns the variant unchanged", () => {
      const variant: Variant = { opacity: 0, y: 12, filter: "blur(8px)" };
      expect(sanitizeVariant(variant, false)).toEqual(variant);
    });

    it("preserves x and y translations", () => {
      const variant: Variant = { x: -24, y: 8 };
      expect(sanitizeVariant(variant, false)).toEqual({ x: -24, y: 8 });
    });

    it("preserves filter/blur", () => {
      const variant: Variant = { filter: "blur(6px)" };
      expect(sanitizeVariant(variant, false)).toEqual({ filter: "blur(6px)" });
    });

    it("preserves scale", () => {
      const variant: Variant = { scale: 0.98 };
      expect(sanitizeVariant(variant, false)).toEqual({ scale: 0.98 });
    });

    it("preserves transition with repetition", () => {
      const variant: Variant = {
        opacity: 1,
        transition: { repeat: Infinity, duration: 2 },
      };
      expect(sanitizeVariant(variant, false)).toEqual(variant);
    });
  });

  describe("when reduced = true", () => {
    it("removes y translation (no positional movement)", () => {
      const variant: Variant = { opacity: 0, y: 12 };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).not.toHaveProperty("y");
      expect(result).toHaveProperty("opacity", 0);
    });

    it("removes x translation (no positional movement)", () => {
      const variant: Variant = { opacity: 0, x: -24 };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).not.toHaveProperty("x");
      expect(result).toHaveProperty("opacity", 0);
    });

    it("removes filter/blur (no blur filter)", () => {
      const variant: Variant = { opacity: 0, filter: "blur(8px)" };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).not.toHaveProperty("filter");
      expect(result).toHaveProperty("opacity", 0);
    });

    it("resets scale to 1 (no parallax-like scaling)", () => {
      const variant: Variant = { opacity: 1, scale: 0.98 };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).toHaveProperty("scale", 1);
    });

    it("resets scaleX to 1", () => {
      const variant: Variant = { scaleX: 1.2 };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).toHaveProperty("scaleX", 1);
    });

    it("resets scaleY to 1", () => {
      const variant: Variant = { scaleY: 0.8 };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).toHaveProperty("scaleY", 1);
    });

    it("removes translateX (no positional movement)", () => {
      const variant: Variant = { translateX: 10 };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).not.toHaveProperty("translateX");
    });

    it("removes translateY (no positional movement)", () => {
      const variant: Variant = { translateY: 20 };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).not.toHaveProperty("translateY");
    });

    it("strips repeat from transition (no continuous animation)", () => {
      const variant: Variant = {
        opacity: 1,
        transition: { repeat: Infinity, duration: 2, ease: "linear" },
      };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      const transition = result.transition as Record<string, unknown>;
      expect(transition).not.toHaveProperty("repeat");
      expect(transition).toHaveProperty("duration", 0.15);
    });

    it("strips repeatDelay from transition", () => {
      const variant: Variant = {
        opacity: 1,
        transition: { repeatDelay: 0.5, duration: 2 },
      };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      const transition = result.transition as Record<string, unknown>;
      expect(transition).not.toHaveProperty("repeatDelay");
    });

    it("forces transition duration to 0.15", () => {
      const variant: Variant = {
        opacity: 1,
        transition: { duration: 2, ease: "easeOut" },
      };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      const transition = result.transition as Record<string, unknown>;
      expect(transition).toHaveProperty("duration", 0.15);
    });

    it("preserves opacity (fallback is opacity-only)", () => {
      const variant: Variant = { opacity: 0.5, y: 12, filter: "blur(4px)" };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      expect(result).toHaveProperty("opacity", 0.5);
      expect(result).not.toHaveProperty("y");
      expect(result).not.toHaveProperty("filter");
    });

    it("handles non-object variants (numbers) — returns as-is", () => {
      // Variant can be a number in framer-motion (stagger etc.)
      // sanitizeVariant only processes objects; numbers pass through
      const result = sanitizeVariant(0.5 as unknown as Variant, true);
      expect(result).toBe(0.5);
    });

    it("handles null variant — returns as-is", () => {
      const result = sanitizeVariant(null as unknown as Variant, true);
      expect(result).toBeNull();
    });

    it("handles empty object variant", () => {
      const result = sanitizeVariant({}, true);
      expect(result).toEqual({});
    });

    it("removes all motion from a full motion variant", () => {
      const variant: Variant = {
        opacity: 0,
        y: 24,
        x: -12,
        scale: 0.95,
        filter: "blur(10px)",
        transition: { duration: 0.6, repeat: 3, ease: "easeOut" },
      };
      const result = sanitizeVariant(variant, true) as Record<string, unknown>;
      // Should only have opacity, scale (reset to 1), and sanitized transition
      expect(result).toHaveProperty("opacity", 0);
      expect(result).toHaveProperty("scale", 1);
      expect(result).not.toHaveProperty("y");
      expect(result).not.toHaveProperty("x");
      expect(result).not.toHaveProperty("filter");
      const transition = result.transition as Record<string, unknown>;
      expect(transition).toHaveProperty("duration", 0.15);
      expect(transition).not.toHaveProperty("repeat");
    });
  });
});

describe("sanitizeVariant edge cases", () => {
  it("preserves unknown properties (forward-compatible)", () => {
    const variant = { opacity: 1, rotate: 45 } as Variant;
    const result = sanitizeVariant(variant, true) as Record<string, unknown>;
    expect(result).toHaveProperty("rotate", 45);
  });

  it("preserves unknown properties when not reduced", () => {
    const variant = { opacity: 1, rotate: 45 } as Variant;
    const result = sanitizeVariant(variant, false) as Record<string, unknown>;
    expect(result).toHaveProperty("rotate", 45);
  });
});
