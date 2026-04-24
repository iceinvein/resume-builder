import { useResumeStore } from "../shell/use-store";

function sectionCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function SharedResumePanel() {
  const resume = useResumeStore((s) => s.resume);
  const links = resume.contact.links ?? [];

  return (
    <div
      style={{
        padding: "var(--space-lg)",
        display: "grid",
        gap: "var(--space-md)",
        alignContent: "start",
      }}
    >
      <div className="card" style={{ display: "grid", gap: "var(--space-md)" }}>
        <div style={{ display: "grid", gap: "var(--space-2xs)" }}>
          <span
            className="caption"
            style={{
              color: "var(--color-text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Shared Resume
          </span>
          <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", lineHeight: 1.05 }}>
            {resume.meta.name || "Resume"}
          </h1>
          {resume.meta.title && (
            <p
              style={{
                margin: 0,
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-base)",
              }}
            >
              {resume.meta.title}
            </p>
          )}
        </div>

        <div
          className="caption"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-xs)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span>{sectionCountLabel(resume.experience.length, "experience entry", "experience entries")}</span>
          <span>{sectionCountLabel(resume.education.length, "education entry", "education entries")}</span>
          {resume.projects?.length ? <span>{sectionCountLabel(resume.projects.length, "project")}</span> : null}
          {resume.extras?.length ? <span>{sectionCountLabel(resume.extras.length, "extra section")}</span> : null}
        </div>

        <div style={{ display: "grid", gap: "var(--space-xs)" }}>
          {resume.contact.email && (
            <a href={`mailto:${resume.contact.email}`}>{resume.contact.email}</a>
          )}
          {resume.contact.phone && <span>{resume.contact.phone}</span>}
          {resume.contact.location && (
            <span style={{ color: "var(--color-text-secondary)" }}>{resume.contact.location}</span>
          )}
          {links.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
