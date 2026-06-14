import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeFilePicker } from "./ThemeFilePicker";
import type { HostMode } from "../host/HostAdapter";

afterEach(cleanup);

const modes: HostMode[] = [
  { id: "theme", label: "theme.json" },
  { id: "styles/dark.json", label: "dark.json", indent: true },
  { id: "styles/pastel.json", label: "pastel.json", indent: true },
  { id: "user", label: "User Global Styles", disabled: true, disabledReason: "Needs permission" },
];

function renderPicker(activeId = "theme", onSelect = vi.fn()) {
  render(
    <ThemeFilePicker modes={modes} activeId={activeId} onSelect={onSelect} />,
  );
  return onSelect;
}

describe("ThemeFilePicker", () => {
  it("shows the active mode label on the trigger", () => {
    renderPicker("styles/dark.json");
    expect(
      screen.getByRole("button", { name: /dark\.json/ }),
    ).toBeInTheDocument();
  });

  it("opens the listbox on click and lists all modes", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button"));
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4);
  });

  it("selects an enabled mode and closes", () => {
    const onSelect = renderPicker();
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: /pastel\.json/ }));
    expect(onSelect).toHaveBeenCalledWith("styles/pastel.json");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select a disabled mode", () => {
    const onSelect = renderPicker();
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(
      screen.getByRole("option", { name: /User Global Styles/ }),
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not re-select the active mode", () => {
    const onSelect = renderPicker("theme");
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: /theme\.json/ }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("marks the active mode as selected", () => {
    renderPicker("styles/dark.json");
    fireEvent.click(screen.getByRole("button"));
    const active = screen.getByRole("option", { name: /dark\.json/ });
    expect(active).toHaveAttribute("aria-selected", "true");
  });

  it("closes on Escape", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
