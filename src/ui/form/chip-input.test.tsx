import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChipInput } from "./chip-input";

function setup(initial: string[] = []) {
  const onChange = mock((_next: string[]) => {});
  render(<ChipInput value={initial} onChange={onChange} placeholder="Add tag" />);
  return { onChange, user: userEvent.setup() };
}

test("renders existing chips", () => {
  render(<ChipInput value={["a", "b"]} onChange={() => {}} />);
  expect(screen.getByText("a")).toBeDefined();
  expect(screen.getByText("b")).toBeDefined();
  cleanup();
});

test("Enter commits a new chip", async () => {
  const { onChange, user } = setup(["a"]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("b{Enter}");
  expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  cleanup();
});

test("Comma commits a new chip", async () => {
  const { onChange, user } = setup([]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("x,");
  expect(onChange).toHaveBeenCalledWith(["x"]);
  cleanup();
});

test("Backspace on empty input removes last chip", async () => {
  const { onChange, user } = setup(["a", "b"]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("{Backspace}{Backspace}");
  expect(onChange).toHaveBeenLastCalledWith(["a"]);
  cleanup();
});

test("paste splits on commas and newlines", async () => {
  const { onChange, user } = setup([]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.paste("x, y\nz");
  expect(onChange).toHaveBeenCalledWith(["x", "y", "z"]);
  cleanup();
});

test("dedupes case-insensitively", async () => {
  const { onChange, user } = setup(["Foo"]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("foo{Enter}");
  expect(onChange).not.toHaveBeenCalled();
  cleanup();
});

test("trims chip length to 64 chars", async () => {
  const { onChange, user } = setup([]);
  const long = "a".repeat(100);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.paste(long);
  await user.keyboard("{Enter}");
  expect(onChange).toHaveBeenCalledWith(["a".repeat(64)]);
  cleanup();
});

test("chip remove button removes that chip", async () => {
  const { onChange, user } = setup(["a", "b"]);
  const removeA = screen.getByRole("button", { name: /remove a/i });
  await user.click(removeA);
  expect(onChange).toHaveBeenCalledWith(["b"]);
  cleanup();
});
