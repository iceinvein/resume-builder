export const RESUME_COMPONENTS = ["Contact","Experience","Education","Skills","Project","Extra","Item"] as const;
export type ResumeComponentName = (typeof RESUME_COMPONENTS)[number];
export function isResumeComponent(name: string): name is ResumeComponentName {
  return (RESUME_COMPONENTS as readonly string[]).includes(name);
}
