import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { useEditorStore } from "../store/editorStore";

const schema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Title of the variation." },
    slug: { type: "string" },
    description: { type: "string" },
    blockTypes: {
      type: "array",
      description: "List of block types that can use this variation.",
    },
    settings: { type: "object", properties: { color: { type: "object" } } },
    styles: { type: "object", properties: { color: { type: "object" } } },
    patterns: { type: "array", items: { type: "string" } },
  },
};

function renderSidebar(
  filePath: string,
  themeJson: Record<string, unknown> = {},
) {
  useEditorStore.setState({
    schema,
    filePath,
    themeJson,
    activeSection: "settings",
    searchQuery: "",
    showExperimental: false,
  });
  render(<Sidebar />);
}

const activeSection = () => useEditorStore.getState().activeSection;
const variationItem = () => screen.queryByRole("button", { name: "Variation" });

beforeEach(() => {
  useEditorStore.setState({ searchQuery: "" });
});
afterEach(cleanup);

describe("Sidebar — Variation section", () => {
  it("lists Variation for a file under styles/", () => {
    renderSidebar("styles/primary.json");
    expect(variationItem()).toBeInTheDocument();
  });

  it("lists Variation for a document that declares blockTypes", () => {
    renderSidebar("src/theme-json/primary.json", {
      blockTypes: ["core/group"],
    });
    expect(variationItem()).toBeInTheDocument();
  });

  it("omits Variation for a plain theme.json", () => {
    renderSidebar("theme.json", { version: 3, settings: {} });
    expect(variationItem()).not.toBeInTheDocument();
  });

  it("lists Variation above Settings", () => {
    renderSidebar("styles/primary.json");
    const labels = screen
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(labels.indexOf("Variation")).toBeLessThan(labels.indexOf("Settings"));
  });

  it("activates the section when clicked", () => {
    renderSidebar("styles/primary.json");
    fireEvent.click(variationItem() as HTMLElement);
    expect(activeSection()).toBe("variation");
  });

  it("keeps the other sections available", () => {
    renderSidebar("styles/primary.json");
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Styles" })).toBeInTheDocument();
  });
});

describe("Sidebar — search navigation", () => {
  function search(query: string) {
    fireEvent.change(screen.getByLabelText("Search all properties"), {
      target: { value: query },
    });
  }

  /** Each result is a button inside an `option` list item. */
  function clickResult(index = 0) {
    const option = screen.getAllByRole("option")[index] as HTMLElement;
    fireEvent.click(within(option).getByRole("button"));
  }

  it("navigates a root variation key to the Variation section", () => {
    renderSidebar("styles/primary.json");
    search("block types");
    clickResult();
    expect(activeSection()).toBe("variation");
  });

  it("still navigates a nested result to its own section", () => {
    renderSidebar("styles/primary.json");
    search("color");
    clickResult();
    expect(activeSection()).toBe("settings.color");
  });
});

describe("Sidebar — Variations section", () => {
  const variations = [
    { path: "styles/primary.json", title: "Primary", slug: "primary", blockTypes: ["core/group"] },
  ];
  const variationsItem = () =>
    screen.queryByRole("button", { name: "Variations" });

  it("lists Variations on theme.json when the theme has some", () => {
    useEditorStore.setState({ variations });
    renderSidebar("theme.json", { version: 3 });
    expect(variationsItem()).toBeInTheDocument();
  });

  it("omits Variations when the theme has none", () => {
    useEditorStore.setState({ variations: [] });
    renderSidebar("theme.json", { version: 3 });
    expect(variationsItem()).not.toBeInTheDocument();
  });

  it("omits Variations while editing a variation file", () => {
    useEditorStore.setState({ variations });
    renderSidebar("styles/primary.json");
    expect(variationsItem()).not.toBeInTheDocument();
  });

  it("lists Variations on a theme.json that declares a root title", () => {
    useEditorStore.setState({ variations });
    renderSidebar("theme.json", { version: 3, title: "Acme" });
    expect(variationsItem()).toBeInTheDocument();
  });

  it("lists Variations after Patterns", () => {
    useEditorStore.setState({ variations });
    renderSidebar("theme.json", { version: 3 });
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels.indexOf("Variations")).toBeGreaterThan(labels.indexOf("Patterns"));
  });

  it("activates the section when clicked", () => {
    useEditorStore.setState({ variations });
    renderSidebar("theme.json", { version: 3 });
    fireEvent.click(variationsItem() as HTMLElement);
    expect(activeSection()).toBe("variations");
  });
});
