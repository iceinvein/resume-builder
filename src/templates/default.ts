export const DEFAULT_TEMPLATE_SOURCE = String.raw`
#let resume = json("/resume.json")

#set document(title: resume.meta.name)
#set page(paper: "us-letter", margin: (x: 0.95in, y: 0.7in))
#set text(font: "Inter", size: 10.5pt, fill: rgb("#1a1a1a"))
#set par(leading: 0.55em, justify: false)

#let meta-color = rgb("#4a4a4a")

#let render-inline(nodes) = {
  for n in nodes {
    if n.t == "text" { n.v }
    else if n.t == "strong" [*#render-inline(n.c)*]
    else if n.t == "em" [_#render-inline(n.c)_]
    else if n.t == "code" { raw(n.v) }
    else if n.t == "link" [#link(n.u)[#render-inline(n.c)]]
  }
}

// sticky keeps the heading with the first entry under it, and breakable: false
// keeps the label and its rule together, so a section can never split across a
// page boundary the way "Professional Affiliations" did.
#let section-heading(body) = {
  v(0.8em)
  // above/below restate Typst's default block spacing, which wrapping the
  // heading in a block would otherwise suppress and tighten the section rhythm.
  block(sticky: true, breakable: false, above: 1.2em, below: 1.2em)[
    #text(size: 9.5pt, weight: 600, tracking: 0.10em, upper(body))
    #v(-0.15em)
    #line(length: 100%, stroke: 0.5pt + rgb("#1a1a1a"))
  ]
  v(0.3em)
}

#let entry-header(left-content, right-content) = grid(
  columns: (1fr, auto),
  column-gutter: 1em,
  align(left)[#left-content],
  align(right)[#text(fill: meta-color)[#right-content]],
)

#let daterange(start, end) = {
  let e = if end == "present" { "Present" } else { end }
  start + " - " + e
}

#let contact-line(c) = {
  let parts = ()
  if "email" in c { parts.push(c.email) }
  if "phone" in c { parts.push(c.phone) }
  if "location" in c { parts.push(c.location) }
  if "links" in c {
    for l in c.links { parts.push(link(l.url)[#l.label]) }
  }
  align(center, text(size: 9.5pt, fill: meta-color, parts.join("  ·  ")))
}

// Header
#align(center, text(size: 22pt, weight: 600)[#resume.meta.name])
#if "title" in resume.meta {
  v(-0.4em)
  align(center, text(size: 11pt, weight: 300, fill: meta-color)[#resume.meta.title])
}
#v(0.1em)
#contact-line(resume.contact)

// Summary
#if "summary" in resume.meta {
  section-heading("Summary")
  render-inline(resume.meta.summary)
}

// Experience
#if resume.experience.len() > 0 {
  section-heading("Experience")
  for job in resume.experience {
    block(breakable: false, width: 100%)[
      #entry-header(
        [#text(weight: 500)[#job.role], #job.company#if "location" in job [ · #job.location]],
        [#daterange(job.start, job.end)],
      )
    ]
    for b in job.bullets {
      list.item(render-inline(b))
    }
    if "tech" in job {
      v(0.2em)
      text(size: 9pt, fill: meta-color, job.tech.join(" · "))
    }
    v(0.5em)
  }
}

// Education
#if resume.education.len() > 0 {
  section-heading("Education")
  for ed in resume.education {
    let right = if "start" in ed and "end" in ed { ed.start + " - " + ed.end } else { "" }
    entry-header(
      [#text(weight: 500)[#ed.institution], #ed.degree#if "field" in ed [, #ed.field]],
      [#right],
    )
    v(0.3em)
  }
}

// Skills
#if resume.skills.len() > 0 {
  section-heading("Skills")
  for s in resume.skills {
    if "group" in s {
      [#text(weight: 500)[#s.group:] #s.items.join(", ")]
    } else {
      [#s.items.join(", ")]
    }
    v(0.2em)
  }
}

// Projects
#if "projects" in resume and resume.projects.len() > 0 {
  section-heading("Projects")
  for p in resume.projects {
    let right = if "tech" in p { p.tech.join(" · ") } else { "" }
    entry-header(
      [#text(weight: 500)[#if "url" in p [#link(p.url)[#p.name]] else [#p.name]]#if "description" in p [#text(" - ")#p.description]],
      [#right],
    )
    if "bullets" in p {
      for b in p.bullets { list.item(render-inline(b)) }
    }
    v(0.4em)
  }
}

// Extras
#if "extras" in resume {
  for ex in resume.extras {
    section-heading(ex.heading)
    for it in ex.items {
      let right = if "date" in it { it.date } else { "" }
      entry-header(
        [#text(weight: 500)[#it.title]#if "subtitle" in it [#text(" - ")#it.subtitle]],
        [#right],
      )
      v(0.2em)
    }
  }
}
`;
