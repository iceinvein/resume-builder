export type CompileRequest = {
  kind: "compile";
  id: number;
  mainSource: string;
  resumeJson: string;
};

export type CompileSuccess = {
  kind: "compiled";
  id: number;
  svgPages: string[];
  durationMs: number;
};

export type ExportPdfRequest = {
  kind: "exportPdf";
  id: number;
  mainSource: string;
  resumeJson: string;
};

export type ExportPdfSuccess = {
  kind: "pdfReady";
  id: number;
  pdf: Uint8Array;
};

export type WorkerError = { kind: "error"; id: number; message: string };

export type WorkerRequest = CompileRequest | ExportPdfRequest;
export type WorkerResponse = CompileSuccess | ExportPdfSuccess | WorkerError;
