import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BlockTypesField } from "./BlockTypesField";
import { useEditorStore } from "../../store/editorStore";

const BLOCK_NAMES = ["core/column", "core/group", "core/paragraph"];

function renderField(blockTypes?: unknown) {
  useEditorStore.setState({
    themeJson: blockTypes === undefined ? {} : { blockTypes },
  });
  render(<BlockTypesField path={["blockTypes"]} blockNames={BLOCK_NAMES} />);
}

/** Current value of `blockTypes` in the store. */
const storedBlockTypes = () => useEditorStore.getState().themeJson["blockTypes"];

const openSelector = () =>
  fireEvent.click(screen.getByRole("button", { name: "+ Add block" }));

const filterInput = () => screen.getByPlaceholderText(/Search blocks/i);

beforeEach(() => {
  useEditorStore.setState({ themeJson: {} });
});
afterEach(cleanup);

describe("BlockTypesField", () => {
  it("lists the selected blocks", () => {
    renderField(["core/group", "core/column"]);
    expect(screen.getByText("core/group")).toBeInTheDocument();
    expect(screen.getByText("core/column")).toBeInTheDocument();
  });

  it("prompts when no blocks are selected", () => {
    renderField();
    expect(screen.getByText(/No block types/i)).toBeInTheDocument();
  });

  it("adds a block picked from the list", () => {
    renderField();
    openSelector();
    fireEvent.click(screen.getByRole("button", { name: /core\/group/ }));
    expect(storedBlockTypes()).toEqual(["core/group"]);
  });

  it("appends to the existing selection", () => {
    renderField(["core/column"]);
    openSelector();
    fireEvent.click(screen.getByRole("button", { name: /core\/group/ }));
    expect(storedBlockTypes()).toEqual(["core/column", "core/group"]);
  });

  it("omits already-selected blocks from the list", () => {
    renderField(["core/group"]);
    openSelector();
    // The chip's remove button remains; only the add-list entry is gone.
    expect(
      screen.queryByRole("button", { name: "core/group" }),
    ).not.toBeInTheDocument();
  });

  it("adds a custom block name that is not in the core list", () => {
    renderField();
    openSelector();
    fireEvent.change(filterInput(), { target: { value: "acme/hero" } });
    fireEvent.click(screen.getByRole("button", { name: /Add custom block/ }));
    expect(storedBlockTypes()).toEqual(["acme/hero"]);
  });

  it("trims a typed custom block name", () => {
    renderField();
    openSelector();
    fireEvent.change(filterInput(), { target: { value: "  acme/hero  " } });
    fireEvent.click(screen.getByRole("button", { name: /Add custom block/ }));
    expect(storedBlockTypes()).toEqual(["acme/hero"]);
  });

  it("offers no custom entry for an empty filter", () => {
    renderField();
    openSelector();
    expect(
      screen.queryByRole("button", { name: /Add custom block/ }),
    ).not.toBeInTheDocument();
  });

  it("does not add a duplicate of an already-selected block", () => {
    renderField(["acme/hero"]);
    openSelector();
    fireEvent.change(filterInput(), { target: { value: "acme/hero" } });
    expect(
      screen.queryByRole("button", { name: /Add custom block/ }),
    ).not.toBeInTheDocument();
    expect(storedBlockTypes()).toEqual(["acme/hero"]);
  });

  it("removes a block", () => {
    renderField(["core/group", "core/column"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove core/group" }));
    expect(storedBlockTypes()).toEqual(["core/column"]);
  });

  it("removes the key entirely when the last block is removed", () => {
    renderField(["core/group"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove core/group" }));
    expect(useEditorStore.getState().themeJson).not.toHaveProperty("blockTypes");
  });

  it("treats a non-array value as no selection", () => {
    renderField("core/group");
    expect(screen.getByText(/No block types/i)).toBeInTheDocument();
  });

  it("shows the schema description", () => {
    useEditorStore.setState({ themeJson: {} });
    render(
      <BlockTypesField
        path={["blockTypes"]}
        blockNames={BLOCK_NAMES}
        description="List of block types."
      />,
    );
    expect(screen.getByText(/List of block types\./)).toBeInTheDocument();
  });
});
