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

describe("setVariations", () => {
  it("stores the summaries the host sends", () => {
    useEditorStore.getState().setVariations([
      { path: "styles/primary.json", title: "Primary", slug: "primary", blockTypes: ["core/group"] },
    ]);
    expect(useEditorStore.getState().variations).toHaveLength(1);
  });

  it("starts empty", () => {
    useEditorStore.setState({ variations: [] });
    expect(useEditorStore.getState().variations).toEqual([]);
  });

  it("replaces a previous list", () => {
    const { setVariations } = useEditorStore.getState();
    setVariations([
      { path: "styles/a.json", title: "A", slug: "a", blockTypes: [] },
    ]);
    setVariations([
      { path: "styles/b.json", title: "B", slug: "b", blockTypes: [] },
    ]);
    expect(useEditorStore.getState().variations.map((v) => v.slug)).toEqual(["b"]);
  });
});
