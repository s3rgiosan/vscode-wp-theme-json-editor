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
