import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionRail } from "./section-rail";

const items = [
  { id: "meta", label: "Meta" },
  { id: "experience", label: "Experience", count: 3 },
  { id: "skills", label: "Skills" },
];

test("renders items with counts", () => {
  render(<SectionRail active="meta" items={items} onActivate={() => {}} />);
  expect(screen.getByRole("button", { name: /^Meta/i }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("button", { name: /Experience/i }).textContent).toMatch(/3/);
  cleanup();
});

test("click activates a section", async () => {
  const onActivate = mock((_id: string) => {});
  const user = userEvent.setup();
  render(<SectionRail active="meta" items={items} onActivate={onActivate} />);
  await user.click(screen.getByRole("button", { name: /Skills/i }));
  expect(onActivate).toHaveBeenCalledWith("skills");
  cleanup();
});

test("arrow keys move selection", async () => {
  const onActivate = mock((_id: string) => {});
  const user = userEvent.setup();
  render(<SectionRail active="meta" items={items} onActivate={onActivate} />);
  const meta = screen.getByRole("button", { name: /^Meta/i });
  meta.focus();
  await user.keyboard("{ArrowDown}");
  expect(onActivate).toHaveBeenCalledWith("experience");
  cleanup();
});
