import type { Resume } from "./resume";

export const emptyResume: Resume = {
  meta: { name: "Your Name" },
  contact: {},
  experience: [],
  education: [],
  skills: [],
};

export const exampleResume: Resume = {
  meta: {
    name: "Dik Rana",
    title: "Senior Software Engineer",
    summary: [{ t: "text", v: "Backend-leaning full-stack engineer focused on developer tooling." }],
  },
  contact: {
    email: "dik@example.com",
    phone: "+61 400 000 000",
    location: "Perth, AU",
    links: [
      { label: "GitHub", url: "https://github.com/dikrana" },
      { label: "LinkedIn", url: "https://linkedin.com/in/dikrana" },
    ],
  },
  experience: [
    {
      company: "Mechanical Rock",
      role: "Senior Software Engineer",
      location: "Perth, AU",
      start: "2024-01",
      end: "present",
      bullets: [
        [
          { t: "text", v: "Shipped " },
          { t: "strong", c: [{ t: "text", v: "X" }] },
          { t: "text", v: " that reduced latency by 40%." },
        ],
        [
          { t: "text", v: "Led a team of 4 on " },
          { t: "link", u: "https://example.com", c: [{ t: "text", v: "Project Y" }] },
          { t: "text", v: "." },
        ],
      ],
      tech: ["TypeScript", "Bun", "AWS"],
    },
  ],
  education: [
    { institution: "University of Western Australia", degree: "BSc", field: "Computer Science", start: "2018", end: "2021" },
  ],
  skills: [
    { group: "Languages", items: ["TypeScript", "Rust", "Python"] },
    { group: "Infra", items: ["AWS", "Docker", "Kubernetes"] },
  ],
};
