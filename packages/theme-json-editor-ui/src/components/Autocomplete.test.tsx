import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { TextInputWithAutocomplete } from "./Autocomplete";
import type { CssVariable } from "../utils/cssVariables";

// Mock useCssVariables to return controlled test data
const mockVariables: CssVariable[] = [
  { name: "--wp--preset--color--primary", value: "#ff0000", category: "Color" },
  { name: "--wp--preset--color--secondary", value: "#00ff00", category: "Color" },
  { name: "--wp--preset--font-size--large", value: "2rem", category: "Font Size" },
  { name: "--wp--custom--line-height--small", value: "1.3", category: "Custom" },
];

vi.mock("../hooks/useCssVariables", () => ({
  useCssVariables: () => mockVariables,
}));

/**
 * Helper: render the input with an empty value, simulate typing the target
 * value, then rerender with the new value so the dropdown can filter against it.
 * This mirrors how a controlled component works in production (parent rerenders
 * with the new value after onChange).
 */
function renderAndType(value: string, onChange: (value: string) => void, placeholder: string) {
  const { rerender } = render(
    <TextInputWithAutocomplete
      value=""
      onChange={onChange}
      placeholder={placeholder}
    />,
  );

  const input = screen.getByPlaceholderText(placeholder) as HTMLInputElement;

  // Fire the change event — this sets open=true and cursorPos
  act(() => {
    fireEvent.change(input, { target: { value } });
  });

  // Rerender with the new value as a controlled component would
  rerender(
    <TextInputWithAutocomplete
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />,
  );

  return { input, rerender };
}

describe("TextInputWithAutocomplete", () => {
  let onChange: (value: string) => void;

  beforeEach(() => {
    onChange = vi.fn<(value: string) => void>();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders an input element", () => {
    render(
      <TextInputWithAutocomplete
        value=""
        onChange={onChange}
        placeholder="Test input"
      />,
    );
    expect(screen.getByPlaceholderText("Test input")).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    render(
      <TextInputWithAutocomplete
        value=""
        onChange={onChange}
        placeholder="Type here"
      />,
    );
    const input = screen.getByPlaceholderText("Type here") as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: "hello" } });
    });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("shows dropdown when typing var(--", () => {
    renderAndType("var(--", onChange, "Var trigger");
    expect(screen.queryByRole("listbox")).toBeInTheDocument();
  });

  it("shows dropdown when typing --wp", () => {
    renderAndType("--wp", onChange, "Wp trigger");
    expect(screen.queryByRole("listbox")).toBeInTheDocument();
  });

  it("filters suggestions by typed fragment", () => {
    renderAndType("var(--wp--preset--color", onChange, "Filter test");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("--wp--preset--color--primary");
    expect(options[1]).toHaveTextContent("--wp--preset--color--secondary");
  });

  it("does not show dropdown for plain text", () => {
    render(
      <TextInputWithAutocomplete
        value="hello world"
        onChange={onChange}
        placeholder="Plain text"
      />,
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("dismisses dropdown on Escape", () => {
    const { input } = renderAndType("var(--", onChange, "Escape test");

    expect(screen.queryByRole("listbox")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(input, { key: "Escape" });
    });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("passes through additional input props", () => {
    render(
      <TextInputWithAutocomplete
        value=""
        onChange={onChange}
        placeholder="Custom props"
        className="custom-class"
        id="test-id"
      />,
    );
    const input = screen.getByPlaceholderText("Custom props");
    expect(input).toHaveClass("custom-class");
    expect(input).toHaveAttribute("id", "test-id");
  });
});
