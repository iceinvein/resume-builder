export type EnvStatus = { wasm: boolean; idb: boolean };

export async function probeEnv(): Promise<EnvStatus> {
  const wasm = typeof WebAssembly === "object" && typeof Worker === "function";
  let idb = true;
  try {
    const { set, get, del } = await import("idb-keyval");
    const key = "__probe__";
    await set(key, 1);
    await get(key);
    await del(key);
  } catch {
    idb = false;
  }
  return { wasm, idb };
}
