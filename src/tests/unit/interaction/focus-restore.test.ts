// @vitest-environment jsdom

/**
 * Unit tests for focus restoration hooks and utilities.
 *
 * Tests cover the pure logic of FocusTrap utilities and
 * the state transitions tracked by useFocusRestore.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FocusTrap,
} from "@/hooks/use-focus-restore";
import type { DataState } from "@/components/interaction/state-presence";
import { getStateMeta } from "@/components/interaction/state-presence";

// Helper to create a container that is attached to the DOM
function createAttachedContainer(): HTMLDivElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function cleanupContainer(container: HTMLDivElement) {
  container.remove();
}

// ─── FocusTrap.getFocusableElements ───

describe("FocusTrap.getFocusableElements", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = createAttachedContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  it("returns an empty array for a container with no focusable elements", () => {
    container.innerHTML = "<span>Hello</span><p>World</p>";
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toEqual([]);
  });

  it("finds anchor elements with href", () => {
    container.innerHTML = '<a href="/test">Link</a>';
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(1);
    expect(result[0].tagName).toBe("A");
  });

  it("finds button elements", () => {
    container.innerHTML = "<button>Click</button>";
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(1);
    expect(result[0].tagName).toBe("BUTTON");
  });

  it("finds input elements that are not disabled or hidden", () => {
    container.innerHTML =
      '<input type="text" /><input type="hidden" /><input type="text" disabled />';
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(1);
  });

  it("finds select elements that are not disabled", () => {
    container.innerHTML = "<select><option>A</option></select><select disabled></select>";
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(1);
  });

  it("finds textarea elements that are not disabled", () => {
    container.innerHTML = "<textarea></textarea><textarea disabled></textarea>";
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(1);
  });

  it("finds elements with tabindex != -1", () => {
    container.innerHTML = '<div tabindex="0">Focusable</div><div tabindex="-1">Not focusable</div>';
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(1);
  });

  it("skips disabled buttons", () => {
    container.innerHTML = "<button disabled>Disabled</button><button>Enabled</button>";
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(1);
    expect(result[0].textContent).toBe("Enabled");
  });

  it("finds contenteditable elements", () => {
    container.innerHTML = '<div contenteditable="true">Edit me</div>';
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(1);
  });

  it("finds multiple focusable elements in order", () => {
    container.innerHTML = `
      <button>First</button>
      <a href="/link">Second</a>
      <input type="text" />
      <div tabindex="0">Fourth</div>
    `;
    const result = FocusTrap.getFocusableElements(container);
    expect(result).toHaveLength(4);
  });
});

// ─── FocusTrap.createTrapHandler ───

describe("FocusTrap.createTrapHandler", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = createAttachedContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
    vi.restoreAllMocks();
  });

  it("returns a function", () => {
    const handler = FocusTrap.createTrapHandler(container);
    expect(typeof handler).toBe("function");
  });

  it("does nothing for non-Tab keys", () => {
    container.innerHTML = "<button>A</button><button>B</button>";
    const handler = FocusTrap.createTrapHandler(container);

    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    handler(event);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("wraps focus from last to first on Tab", () => {
    container.innerHTML = "";
    const first = document.createElement("button");
    const last = document.createElement("button");
    first.textContent = "First";
    last.textContent = "Last";
    container.appendChild(first);
    container.appendChild(last);

    // Mock activeElement as the last button
    vi.spyOn(document, "activeElement", "get").mockReturnValue(last);

    const handler = FocusTrap.createTrapHandler(container);
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const focusSpy = vi.spyOn(first, "focus");

    handler(event);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("wraps focus from first to last on Shift+Tab", () => {
    container.innerHTML = "";
    const first = document.createElement("button");
    const last = document.createElement("button");
    first.textContent = "First";
    last.textContent = "Last";
    container.appendChild(first);
    container.appendChild(last);

    // Mock activeElement as the first button
    vi.spyOn(document, "activeElement", "get").mockReturnValue(first);

    const handler = FocusTrap.createTrapHandler(container);
    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
    const focusSpy = vi.spyOn(last, "focus");

    handler(event);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("does not wrap when focus is in the middle on Tab", () => {
    container.innerHTML = "";
    const first = document.createElement("button");
    const middle = document.createElement("button");
    const last = document.createElement("button");
    first.textContent = "First";
    middle.textContent = "Middle";
    last.textContent = "Last";
    container.appendChild(first);
    container.appendChild(middle);
    container.appendChild(last);

    vi.spyOn(document, "activeElement", "get").mockReturnValue(middle);

    const handler = FocusTrap.createTrapHandler(container);
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    handler(event);
    // Focus is in the middle, no wrapping should occur
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});

// ─── DataState metadata (06_STATE_SYSTEM.md) ───

describe("getStateMeta", () => {
  const allStates: DataState[] = [
    "idle",
    "loading",
    "empty",
    "populated",
    "partial",
    "stale",
    "permission-error",
    "network-error",
    "server-error",
    "plan-limit",
    "paused",
  ];

  it("returns metadata for every data state", () => {
    for (const state of allStates) {
      const meta = getStateMeta(state);
      expect(meta).toBeDefined();
      expect(typeof meta.what).toBe("string");
      expect(meta.what.length).toBeGreaterThan(0);
      expect(typeof meta.isIncomplete).toBe("boolean");
      expect(typeof meta.action).toBe("string");
      expect(meta.action.length).toBeGreaterThan(0);
      expect(typeof meta.retrySafe).toBe("boolean");
      expect(typeof meta.actionOccurred).toBe("boolean");
    }
  });

  it("marks loading states as incomplete", () => {
    expect(getStateMeta("idle").isIncomplete).toBe(true);
    expect(getStateMeta("loading").isIncomplete).toBe(true);
    expect(getStateMeta("partial").isIncomplete).toBe(true);
  });

  it("marks populated and empty as complete", () => {
    expect(getStateMeta("populated").isIncomplete).toBe(false);
    expect(getStateMeta("empty").isIncomplete).toBe(false);
  });

  it("marks error states as incomplete", () => {
    expect(getStateMeta("permission-error").isIncomplete).toBe(true);
    expect(getStateMeta("network-error").isIncomplete).toBe(true);
    expect(getStateMeta("server-error").isIncomplete).toBe(true);
    expect(getStateMeta("plan-limit").isIncomplete).toBe(true);
  });

  it("marks network-error and server-error as retry-safe", () => {
    expect(getStateMeta("network-error").retrySafe).toBe(true);
    expect(getStateMeta("server-error").retrySafe).toBe(true);
  });

  it("marks permission-error as NOT retry-safe", () => {
    expect(getStateMeta("permission-error").retrySafe).toBe(false);
  });

  it("marks plan-limit and paused as action-occurred", () => {
    expect(getStateMeta("plan-limit").actionOccurred).toBe(true);
    expect(getStateMeta("paused").actionOccurred).toBe(true);
  });

  it("marks normal states as NOT action-occurred", () => {
    expect(getStateMeta("populated").actionOccurred).toBe(false);
    expect(getStateMeta("empty").actionOccurred).toBe(false);
    expect(getStateMeta("loading").actionOccurred).toBe(false);
  });

  it("stale data is NOT incomplete but is retry-safe", () => {
    const meta = getStateMeta("stale");
    expect(meta.isIncomplete).toBe(false);
    expect(meta.retrySafe).toBe(true);
  });

  it("partial data is incomplete and retry-safe", () => {
    const meta = getStateMeta("partial");
    expect(meta.isIncomplete).toBe(true);
    expect(meta.retrySafe).toBe(true);
  });
});
