import { resumeStore } from "../../state/store";
import { exampleResume, emptyResume } from "../../schema/defaults";

export function EmptyState() {
  return (
    <div style={{ padding: 40, textAlign: "center", display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Start your resume</h2>
      <p style={{ color: "#4a4a4a" }}>Fill the form, paste MDX, or load the example.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button onClick={() => resumeStore.setState({ resume: emptyResume, tab: "form" })}>Fill the form</button>
        <button onClick={() => resumeStore.setState({ tab: "import" })}>Paste MDX</button>
        <button onClick={() => resumeStore.setState({ resume: exampleResume, tab: "form" })}>See example</button>
      </div>
    </div>
  );
}
