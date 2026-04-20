import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SortableList, SortableHandle } from "./sortable-list";

function Item({ label }: { label: string }) {
  return (
    <div>
      <SortableHandle aria-label={`Drag ${label}`} />
      <span>{label}</span>
    </div>
  );
}

test("renders items in order", () => {
  render(
    <SortableList
      items={["a", "b", "c"]}
      keyFor={(x) => x}
      onReorder={() => {}}
      renderItem={(x) => <Item label={x} />}
    />,
  );
  const labels = screen.getAllByText(/^[abc]$/);
  expect(labels.map((el) => el.textContent)).toEqual(["a", "b", "c"]);
  cleanup();
});

// TODO(verify-in-browser): dnd-kit's KeyboardSensor relies on layout measurement
// (ResizeObserver, getBoundingClientRect) that happy-dom does not fully implement,
// so the keyboard drag never fires onDragEnd under bun test. Cover this path in
// a real-browser e2e instead of a happy-dom unit test.
test.skip("keyboard reorder moves item down", async () => {
  const onReorder = mock((_from: number, _to: number) => {});
  const user = userEvent.setup();
  render(
    <SortableList
      items={["a", "b", "c"]}
      keyFor={(x) => x}
      onReorder={onReorder}
      renderItem={(x) => <Item label={x} />}
    />,
  );
  const handleA = screen.getByRole("button", { name: "Drag a" });
  handleA.focus();
  await user.keyboard(" ");
  await user.keyboard("{ArrowDown}");
  await user.keyboard(" ");
  expect(onReorder).toHaveBeenCalledWith(0, 1);
  cleanup();
});
