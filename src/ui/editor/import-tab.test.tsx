import { test, expect, beforeEach } from "bun:test";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportTab } from "./import-tab";
import { resumeStore } from "../../state/store";
import { emptyResume } from "../../schema/defaults";

const VALID_MDX = `---
name: Plan Test
---

<Contact email="plan@example.com" />

## Experience

<Experience company="Acme" role="Engineer" start="2023-01" end="present">
- Did work
</Experience>
`;

const INVALID_MDX = `---
name: Broken
---

<Experience company="x"
- no closing tag
`;

beforeEach(() => {
  resumeStore.setState({ resume: emptyResume, tab: "import" });
});

test("empty state renders headline, Browse button, and paste kbd hint", () => {
  render(<ImportTab />);
  expect(screen.getByText(/Drop an \.mdx file here/i)).toBeDefined();
  expect(screen.getByRole("button", { name: /Browse files/i })).toBeDefined();
  expect(screen.getByText(/paste to fill the canvas/i)).toBeDefined();
  expect(screen.getByText(/Empty/i)).toBeDefined();
  cleanup();
});

test("typing valid MDX populates the parsed pill and enables Import", async () => {
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(VALID_MDX);

  await waitFor(() =>
    expect(screen.getByText(/Plan Test/)).toBeDefined(),
  );
  expect(screen.getByText(/1 experience entry/)).toBeDefined();
  const importBtn = screen.getByRole("button", { name: /^Import$/ }) as HTMLButtonElement;
  expect(importBtn.disabled).toBe(false);
  cleanup();
});

test("typing invalid MDX shows the error pill and disables Import", async () => {
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(INVALID_MDX);

  await waitFor(() => {
    const pill = screen.getByRole("status");
    expect(pill.textContent ?? "").toMatch(/error|parse/i);
  });
  const importBtn = screen.getByRole("button", { name: /^Import$/ }) as HTMLButtonElement;
  expect(importBtn.disabled).toBe(true);
  cleanup();
});

test("Import click commits parsed resume and switches to form tab", async () => {
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(VALID_MDX);
  await waitFor(() => expect(screen.getByText(/Plan Test/)).toBeDefined());

  await user.click(screen.getByRole("button", { name: /^Import$/ }));

  expect(resumeStore.getState().resume.meta.name).toBe("Plan Test");
  expect(resumeStore.getState().tab).toBe("form");
  cleanup();
});

test("dirty draft shows Replaces current draft warning and renames Import to Replace draft", async () => {
  resumeStore.setState({
    resume: { ...emptyResume, meta: { ...emptyResume.meta, name: "Existing" } },
    tab: "import",
  });
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(VALID_MDX);
  await waitFor(() => expect(screen.getByText(/Plan Test/)).toBeDefined());

  expect(screen.getByText(/Replaces current draft/i)).toBeDefined();
  expect(screen.getByRole("button", { name: /Replace draft/i })).toBeDefined();
  cleanup();
});

test("Clear button resets the canvas to empty and does not touch the store", async () => {
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(VALID_MDX);
  await waitFor(() => expect(screen.getByText(/Plan Test/)).toBeDefined());

  await user.click(screen.getByRole("button", { name: /Clear/i }));

  expect(screen.getByText(/Drop an \.mdx file here/i)).toBeDefined();
  expect(resumeStore.getState().resume).toEqual(emptyResume);
  cleanup();
});

test("dropping an .mdx file loads content and fires parse", async () => {
  render(<ImportTab />);
  const region = screen.getByRole("region", { name: /Import MDX/i });

  const file = new File([VALID_MDX], "plan.mdx", { type: "text/markdown" });
  fireEvent.drop(region, { dataTransfer: { files: [file] } });

  await waitFor(() => expect(screen.getByText(/Plan Test/)).toBeDefined());
  expect(screen.getByText(/Loaded from plan\.mdx/i)).toBeDefined();
  cleanup();
});
