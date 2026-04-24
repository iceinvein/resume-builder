import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { downloadBlob, downloadTextFile } from "./download";

describe("download helpers", () => {
  const realCreateElement = document.createElement.bind(document);
  const createObjectURL = URL.createObjectURL;
  const revokeObjectURL = URL.revokeObjectURL;
  const realSetTimeout = window.setTimeout.bind(window);

  let click: ReturnType<typeof mock>;
  let createAnchor: HTMLAnchorElement;

  beforeEach(() => {
    click = mock(() => {});
    createAnchor = realCreateElement("a");
    createAnchor.click = click as unknown as typeof createAnchor.click;

    document.createElement = mock((tagName: string) => {
      if (tagName === "a") return createAnchor;
      return realCreateElement(tagName);
    }) as typeof document.createElement;

    URL.createObjectURL = mock(() => "blob:resume") as typeof URL.createObjectURL;
    URL.revokeObjectURL = mock(() => {}) as typeof URL.revokeObjectURL;
    window.setTimeout = mock((fn: TimerHandler) => {
      if (typeof fn === "function") fn();
      return 0;
    }) as unknown as typeof window.setTimeout;
  });

  afterEach(() => {
    document.createElement = realCreateElement as typeof document.createElement;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    window.setTimeout = realSetTimeout as unknown as typeof window.setTimeout;
  });

  test("downloadBlob creates, clicks, and revokes a blob URL", () => {
    downloadBlob(new Blob(["pdf"], { type: "application/pdf" }), "resume.pdf");

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(createAnchor.href).toBe("blob:resume");
    expect(createAnchor.download).toBe("resume.pdf");
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:resume");
  });

  test("downloadTextFile wraps text in a blob download", () => {
    downloadTextFile("hello", "resume.mdx", "text/markdown;charset=utf-8");

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(createAnchor.download).toBe("resume.mdx");
    expect(click).toHaveBeenCalled();
  });
});
