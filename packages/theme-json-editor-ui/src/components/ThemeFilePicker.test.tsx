import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeFilePicker } from "./ThemeFilePicker";
import type { HostMode } from "../host/HostAdapter";

afterEach(cleanup);

const modes: HostMode[] = [
  { id: "theme", label: "theme.json" },
  { id: "styles/dark.json", label: "dark.json", indent: true },
  { id: "styles/pastel.json", label: "pastel.json", indent: true },
  { id: "styles/section/blue.json", label: "blue.json", indent: true },
  {
    id: "user",
    label: "User Global Styles",
    disabled: true,
    disabledReason: "Needs permission",
  },
];

function renderPicker(activeId = "theme", onSelect = vi.fn()) {
  render(
    <ThemeFilePicker modes={modes} activeId={activeId} onSelect={onSelect} />,
  );
  return onSelect;
}

const combo = () => screen.getByRole("combobox");

describe("ThemeFilePicker — structure", () => {
  it("exposes the trigger as a combobox with listbox popup", () => {
    renderPicker();
    expect(combo()).toHaveAttribute("aria-haspopup", "listbox");
    expect(combo()).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the active mode label on the trigger", () => {
    renderPicker("styles/dark.json");
    expect(combo()).toHaveTextContent("dark.json");
  });

  it("links the combobox to the listbox via aria-controls", () => {
    renderPicker();
    fireEvent.click(combo());
    const listbox = screen.getByRole("listbox");
    expect(combo()).toHaveAttribute("aria-controls", listbox.id);
    expect(listbox).toHaveAccessibleName();
  });

  it("marks the active mode as selected", () => {
    renderPicker("styles/dark.json");
    fireEvent.click(combo());
    expect(
      screen.getByRole("option", { name: /dark\.json/ }),
    ).toHaveAttribute("aria-selected", "true");
  });
});

describe("ThemeFilePicker — mouse", () => {
  it("opens on click and lists all modes", () => {
    renderPicker();
    fireEvent.click(combo());
    expect(screen.getAllByRole("option")).toHaveLength(5);
  });

  it("selects an enabled mode and closes", () => {
    const onSelect = renderPicker();
    fireEvent.click(combo());
    fireEvent.click(screen.getByRole("option", { name: /pastel\.json/ }));
    expect(onSelect).toHaveBeenCalledWith("styles/pastel.json");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select a disabled mode", () => {
    const onSelect = renderPicker();
    fireEvent.click(combo());
    fireEvent.click(screen.getByRole("option", { name: /User Global Styles/ }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not re-select the active mode", () => {
    const onSelect = renderPicker("theme");
    fireEvent.click(combo());
    fireEvent.click(screen.getByRole("option", { name: /theme\.json/ }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("ThemeFilePicker — keyboard", () => {
  it("opens on ArrowDown and activates the selected option", () => {
    renderPicker("theme");
    fireEvent.keyDown(combo(), { key: "ArrowDown" });
    expect(combo()).toHaveAttribute("aria-expanded", "true");
    const active = screen.getByRole("option", { name: /theme\.json/ });
    expect(combo()).toHaveAttribute("aria-activedescendant", active.id);
  });

  it("ArrowDown moves the active option to the next one", () => {
    renderPicker("theme");
    fireEvent.keyDown(combo(), { key: "ArrowDown" }); // open, active = theme
    fireEvent.keyDown(combo(), { key: "ArrowDown" }); // active = dark
    const dark = screen.getByRole("option", { name: /dark\.json/ });
    expect(combo()).toHaveAttribute("aria-activedescendant", dark.id);
  });

  it("ArrowUp moves the active option to the previous one", () => {
    renderPicker("styles/pastel.json");
    fireEvent.keyDown(combo(), { key: "ArrowDown" }); // open, active = pastel
    fireEvent.keyDown(combo(), { key: "ArrowUp" }); // active = dark
    const dark = screen.getByRole("option", { name: /dark\.json/ });
    expect(combo()).toHaveAttribute("aria-activedescendant", dark.id);
  });

  it("Home/End jump to first/last enabled option", () => {
    renderPicker("styles/dark.json");
    fireEvent.keyDown(combo(), { key: "ArrowDown" });
    fireEvent.keyDown(combo(), { key: "End" });
    const blue = screen.getByRole("option", { name: /blue\.json/ });
    expect(combo()).toHaveAttribute("aria-activedescendant", blue.id);
    fireEvent.keyDown(combo(), { key: "Home" });
    const theme = screen.getByRole("option", { name: /theme\.json/ });
    expect(combo()).toHaveAttribute("aria-activedescendant", theme.id);
  });

  it("skips disabled options during navigation", () => {
    renderPicker("styles/dark.json");
    fireEvent.keyDown(combo(), { key: "ArrowDown" });
    fireEvent.keyDown(combo(), { key: "End" }); // last enabled = blue (user is disabled)
    fireEvent.keyDown(combo(), { key: "ArrowDown" }); // stays on blue
    const blue = screen.getByRole("option", { name: /blue\.json/ });
    expect(combo()).toHaveAttribute("aria-activedescendant", blue.id);
  });

  it("Enter selects the active option and closes", () => {
    const onSelect = renderPicker("theme");
    fireEvent.keyDown(combo(), { key: "ArrowDown" }); // open, active = theme
    fireEvent.keyDown(combo(), { key: "ArrowDown" }); // active = dark
    fireEvent.keyDown(combo(), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("styles/dark.json");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Space selects the active option", () => {
    const onSelect = renderPicker("theme");
    fireEvent.keyDown(combo(), { key: "ArrowDown" });
    fireEvent.keyDown(combo(), { key: "ArrowDown" });
    fireEvent.keyDown(combo(), { key: " " });
    expect(onSelect).toHaveBeenCalledWith("styles/dark.json");
  });

  it("Escape closes without selecting", () => {
    const onSelect = renderPicker();
    fireEvent.keyDown(combo(), { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(combo(), { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
