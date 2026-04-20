import { test, expect, mock } from "bun:test";
import { useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulletList } from "./bullet-list";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";
import type { InlineNode } from "../../schema/inline";

test("renders one row per bullet", () => {
  const bullets = [mdToInlineNodes("first"), mdToInlineNodes("second")];
  render(<BulletList bullets={bullets} onChange={() => {}} />);
  const rows = screen.getAllByRole("textbox");
  expect(rows).toHaveLength(2);
  expect((rows[0] as HTMLTextAreaElement).value).toBe("first");
  expect((rows[1] as HTMLTextAreaElement).value).toBe("second");
  cleanup();
});

test("Enter at end splits to a new bullet below", async () => {
  const onChange = mock((_next: unknown[]) => {});
  const user = userEvent.setup();
  render(<BulletList bullets={[mdToInlineNodes("hello")]} onChange={onChange} />);
  const row = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
  row.focus();
  row.setSelectionRange(row.value.length, row.value.length);
  await user.keyboard("{Enter}");
  const last = onChange.mock.calls.at(-1)?.[0] as unknown[];
  expect(last.length).toBe(2);
  expect(inlineNodesToMd(last[1] as ReturnType<typeof mdToInlineNodes>)).toBe("");
  cleanup();
});

test("Backspace at start of empty row removes it", async () => {
  const onChange = mock((_next: unknown[]) => {});
  const user = userEvent.setup();
  render(
    <BulletList
      bullets={[mdToInlineNodes("first"), mdToInlineNodes("")]}
      onChange={onChange}
    />,
  );
  const rows = screen.getAllByRole("textbox") as HTMLTextAreaElement[];
  rows[1]!.focus();
  rows[1]!.setSelectionRange(0, 0);
  await user.keyboard("{Backspace}");
  const last = onChange.mock.calls.at(-1)?.[0] as unknown[];
  expect(last.length).toBe(1);
  cleanup();
});

test("edits round-trip through InlineNode[]", async () => {
  const onChange = mock((_next: unknown[]) => {});
  const user = userEvent.setup();

  function Harness() {
    const [bullets, setBullets] = useState<InlineNode[][]>([mdToInlineNodes("")]);
    return (
      <BulletList
        bullets={bullets}
        onChange={(next) => {
          onChange(next);
          setBullets(next);
        }}
      />
    );
  }

  render(<Harness />);
  const row = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
  await user.click(row);
  await user.paste("**bold** yes");
  const last = onChange.mock.calls.at(-1)?.[0] as ReturnType<typeof mdToInlineNodes>[];
  expect(inlineNodesToMd(last[0]!)).toBe("**bold** yes");
  cleanup();
});
