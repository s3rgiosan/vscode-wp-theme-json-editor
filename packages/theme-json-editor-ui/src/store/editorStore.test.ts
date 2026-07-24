import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";

const activeSection = () => useEditorStore.getState().activeSection;

beforeEach(() => {
  useEditorStore.setState({ activeSection: "settings" });
});

describe("setInitialData — landing section", () => {
  it("opens a style variation on the Variation section", () => {
    useEditorStore
      .getState()
      .setInitialData({ title: "Primary" }, "styles/primary.json");
    expect(activeSection()).toBe("variation");
  });

  it("opens a partial that declares blockTypes on the Variation section", () => {
    useEditorStore
      .getState()
      .setInitialData(
        { blockTypes: ["core/group"] },
        "src/theme-json/primary.json",
      );
    expect(activeSection()).toBe("variation");
  });

  it("opens a plain theme.json on Settings", () => {
    useEditorStore
      .getState()
      .setInitialData({ version: 3, settings: {} }, "theme.json");
    expect(activeSection()).toBe("settings");
  });

  it("resets the section when switching from a variation to theme.json", () => {
    useEditorStore.setState({ activeSection: "variation" });
    useEditorStore
      .getState()
      .setInitialData({ version: 3 }, "theme.json");
    expect(activeSection()).toBe("settings");
  });
});
