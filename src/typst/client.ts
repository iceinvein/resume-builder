import type {
  WorkerRequest,
  WorkerResponse,
  CompileSuccess,
  ExportPdfSuccess,
} from "./types";

export class TypstClient {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, (r: WorkerResponse) => void>();

  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
      const cb = this.pending.get(ev.data.id);
      if (cb) {
        this.pending.delete(ev.data.id);
        cb(ev.data);
      }
    };
  }

  compile(mainSource: string, resumeJson: string): Promise<CompileSuccess> {
    return this.request({
      kind: "compile",
      id: this.nextId++,
      mainSource,
      resumeJson,
    }) as Promise<CompileSuccess>;
  }

  exportPdf(mainSource: string, resumeJson: string): Promise<ExportPdfSuccess> {
    return this.request({
      kind: "exportPdf",
      id: this.nextId++,
      mainSource,
      resumeJson,
    }) as Promise<ExportPdfSuccess>;
  }

  private request(req: WorkerRequest): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      this.pending.set(req.id, (res) => {
        if (res.kind === "error") reject(new Error(res.message));
        else resolve(res);
      });
      this.worker.postMessage(req);
    });
  }

  terminate(): void {
    this.worker.terminate();
  }
}
