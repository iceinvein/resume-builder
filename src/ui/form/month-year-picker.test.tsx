import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthYearPicker } from "./month-year-picker";

test("renders placeholder when value is empty", () => {
  render(<MonthYearPicker value="" onChange={() => {}} />);
  expect(screen.getByRole("button", { name: /pick date/i }).textContent).toMatch(/-/);
  cleanup();
});

test("formats YYYY-MM value as Mon YYYY", () => {
  render(<MonthYearPicker value="2024-03" onChange={() => {}} />);
  expect(screen.getByRole("button", { name: /pick date/i }).textContent).toMatch(/Mar 2024/);
  cleanup();
});

test("formats YYYY value as just the year", () => {
  render(<MonthYearPicker value="2021" onChange={() => {}} />);
  expect(screen.getByRole("button", { name: /pick date/i }).textContent).toMatch(/2021/);
  cleanup();
});

test("formats 'present' as Present when allowed", () => {
  render(<MonthYearPicker value="present" allowPresent onChange={() => {}} />);
  expect(screen.getByRole("button", { name: /pick date/i }).textContent).toMatch(/Present/);
  cleanup();
});

test("selecting month+year emits YYYY-MM", async () => {
  const onChange = mock((_v: string) => {});
  const user = userEvent.setup();
  render(<MonthYearPicker value="" onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: /pick date/i }));
  await user.selectOptions(screen.getByLabelText(/month/i), "3");
  await user.selectOptions(screen.getByLabelText(/year/i), "2024");
  expect(onChange).toHaveBeenLastCalledWith("2024-03");
  cleanup();
});

test("toggling Present emits 'present' then clears back", async () => {
  const onChange = mock((_v: string) => {});
  const user = userEvent.setup();
  render(<MonthYearPicker value="2024-03" allowPresent onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: /pick date/i }));
  await user.click(screen.getByLabelText(/present/i));
  expect(onChange).toHaveBeenCalledWith("present");
  cleanup();
});
