import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { VariationsPanel } from "./VariationsPanel";
import { HostProvider } from "../host/HostContext";
import type { HostAdapter, VariationSummary } from "../host/HostAdapter";
import { useEditorStore } from "../store/editorStore";

const variations: VariationSummary[] = [
  {
    path: "styles/primary.json",
    title: "Primary",
    slug: "primary",
    blockTypes: ["core/group", "core/column"],
  },
  { path: "styles/dark.json", title: "Dark", slug: "dark", blockTypes: [] },
];

function makeHost(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return {
    start: () => () => undefined,
    save: vi.fn(),
    reportDirty: vi.fn(),
    ...overrides,
  };
}

function renderPanel(
  host: HostAdapter = makeHost(),
  list: VariationSummary[] = variations,
) {
  useEditorStore.setState({ variations: list });
  render(
    <HostProvider host={host}>
      <VariationsPanel />
    </HostProvider>,
  );
}

beforeEach(() => {
  useEditorStore.setState({ variations: [] });
});
afterEach(cleanup);

describe("VariationsPanel", () => {
  it("lists every variation the host reported", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /Primary/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dark/ })).toBeInTheDocument();
  });

  it("shows each file path", () => {
    renderPanel();
    expect(screen.getByText("styles/primary.json")).toBeInTheDocument();
  });

  it("shows the blocks a block style variation targets", () => {
    renderPanel();
    const entry = screen.getByRole("button", { name: /Primary/ });
    expect(entry).toHaveTextContent("core/group");
    expect(entry).toHaveTextContent("core/column");
  });

  it("marks a variation without block types as global", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /Dark/ })).toHaveTextContent(
      /whole site/i,
    );
  });

  it("asks the host to open the file that was clicked", () => {
    const openVariation = vi.fn();
    renderPanel(makeHost({ openVariation }));
    fireEvent.click(screen.getByRole("button", { name: /Primary/ }));
    expect(openVariation).toHaveBeenCalledWith("styles/primary.json");
  });

  it("asks the host to re-scan when refreshed", () => {
    const requestVariations = vi.fn();
    renderPanel(makeHost({ requestVariations }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(requestVariations).toHaveBeenCalled();
  });

  it("omits the refresh control for a host that cannot re-scan", () => {
    renderPanel(makeHost());
    expect(
      screen.queryByRole("button", { name: "Refresh" }),
    ).not.toBeInTheDocument();
  });

  it("explains the empty case", () => {
    renderPanel(makeHost(), []);
    expect(screen.getByText(/No style variations/i)).toBeInTheDocument();
  });
});
