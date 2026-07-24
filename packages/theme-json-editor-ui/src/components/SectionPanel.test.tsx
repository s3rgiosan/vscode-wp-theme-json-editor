import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SectionPanel } from "./SectionPanel";
import { useEditorStore } from "../store/editorStore";

const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    slug: { type: "string" },
    description: { type: "string" },
    blockTypes: {
      type: "array",
      items: { type: "string" },
      "x-wpthemejsoneditor-block-types": true,
      "x-wpthemejsoneditor-block-names": ["core/group", "core/column"],
    },
    settings: { type: "object", properties: { color: { type: "object" } } },
  },
};

function renderVariation(themeJson: Record<string, unknown> = {}) {
  useEditorStore.setState({
    schema,
    themeJson,
    filePath: "styles/primary.json",
    showExperimental: false,
    validationErrors: [],
  });
  render(<SectionPanel section="variation" />);
}

const themeJson = () => useEditorStore.getState().themeJson;

beforeEach(() => {
  useEditorStore.setState({ themeJson: {}, validationErrors: [] });
});
afterEach(cleanup);

describe("SectionPanel — variation section", () => {
  it("renders the section heading", () => {
    renderVariation();
    expect(
      screen.getByRole("heading", { name: "Variation" }),
    ).toBeInTheDocument();
  });

  it("renders the variation keys as fields", () => {
    renderVariation();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("renders blockTypes as the block picker", () => {
    renderVariation();
    expect(
      screen.getByRole("button", { name: "+ Add block" }),
    ).toBeInTheDocument();
  });

  it("shows the values already in the document", () => {
    renderVariation({ title: "Primary", blockTypes: ["core/group"] });
    expect(screen.getByLabelText("Title")).toHaveValue("Primary");
    expect(screen.getByText("core/group")).toBeInTheDocument();
  });

  it("writes edits to the document root", () => {
    renderVariation();
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "primary" },
    });
    expect(themeJson()["slug"]).toBe("primary");
  });

  it("does not offer to create a container section", () => {
    renderVariation();
    expect(screen.queryByText(/not configured/i)).not.toBeInTheDocument();
  });

  it("leaves other sections untouched", () => {
    useEditorStore.setState({ schema, themeJson: { settings: {} } });
    render(<SectionPanel section="settings.color" />);
    expect(
      screen.queryByRole("heading", { name: "Variation" }),
    ).not.toBeInTheDocument();
  });
});
