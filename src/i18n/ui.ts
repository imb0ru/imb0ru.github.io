/**
 * UI strings (English only). Use `{name}` placeholders and pass values via the
 * second argument of `t()`.
 */
export const ui = {
  'a11y.skip': 'Skip to content',
  'a11y.menu': 'Open menu',

  'nav.home': 'Home',
  'nav.blog': 'Blog',
  'nav.about': 'About',

  'site.role': 'Digital Forensics & Incident Response',
  'site.description':
    'Marco Ferrara - Digital Forensics & Incident Response. Research, forensic CTF writeups, and challenges I build.',

  'hero.eyebrow': 'DFIR · Forensic CTF player',
  'hero.lede':
    'I investigate compromised systems and take forensic CTF challenges apart. Here I publish my research works, ctf writeups, and the challenges I design.',
  'hero.cta.writeups': 'Read an article',
  'hero.cta.about': 'About me',

  'blog.title': 'Blog',
  'blog.lede': 'Everything in one place, writeups, challenges, research, and notes.',
  'blog.empty': 'Nothing here yet, check back soon.',
  'filter.all': 'All',

  'type.writeups': 'Writeups',
  'type.challenges': 'Challenges',
  'type.research': 'Research',
  'type.notes': 'Notes',
  'type.writeups.lede': 'Step-by-step breakdowns of forensic CTF challenges and real investigations.',
  'type.challenges.lede': 'Forensic challenges I designed for CTF competitions and training.',
  'type.research.lede': 'Notes, tooling, and findings from my digital forensics work.',
  'type.notes.lede': 'Talks, experiences, and shorter notes from work and the community.',

  'home.latest.title': 'Latest',
  'home.latest.lede': 'Fresh from the blog.',
  'home.viewAll': 'View all',

  'meta.minRead': '{n} min read',
  'meta.draft': 'Draft',
  'meta.updated': 'Updated {date}',
  'meta.published': 'Published {date}',
  'meta.read': 'Read',

  'post.back': 'All {section}',
  'post.toc': 'On this page',
  'post.tags': 'Tags',
  'post.details': 'Details',
  'post.event': 'Event',
  'post.category': 'Category',
  'post.difficulty': 'Difficulty',
  'post.author': 'Author',

  'challenge.download': 'Download files',
  'challenge.source': 'Source / solution',
  'challenge.event': 'Used at',
  'challenge.flagFormat': 'Flag format',
  'challenge.solves': '{n} solves',

  'research.external': 'Read the full publication',
  'research.pdf': 'Download PDF',
  'research.venue': 'Published in',

  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.insane': 'Insane',

  'about.title': 'About',
  'about.lede':
    'Bridging digital forensics, incident response, and cybersecurity research to investigate and understand complex threats.',
  'about.bio1':
    "Digital Forensics & Incident Response specialist, currently pursuing a Master's degree in Cybersecurity at the University of Bari Aldo Moro. I work in Crisis Management & Incident Response at Deloitte and actively contribute to digital forensics and blue team research within the Mntcrl laboratory. I gained hands-on experience in high-pressure cyber defense environments, including Locked Shields 2025 (NATO CCDCOE), where I worked on ICS and mobile forensics as part of a Blue Team that ranked 3rd worldwide. My technical focus includes memory forensics, malware analysis, and detection engineering, with hands-on experience developing a YARA extension for VolWeb (Volatility 3) as part of my Bachelor's thesis.",
  'about.bio2':
    'As part of the {team} team, I participate in forensic CTF competitions and develop forensic challenges aimed at teaching investigative methodologies and technical skills. This website gathers my research, technical writeups, and challenge development work.',
  'about.experience.title': 'Experience',
  'about.education.title': 'Education',
  'about.certs.title': 'Certifications',
  'about.present': 'Present',
  'about.focus.title': 'Focus areas',
  'about.contact.title': 'Get in touch',
  'about.contact.lede': 'Happy to talk about forensics, CTFs, or collaboration. Reach me here:',

  'footer.built': 'Built with Astro',
  'footer.source': 'Source',

  'notfound.title': 'Page not found',
  'notfound.lede': "It looks like this page doesn't exist or has been moved elsewhere.",
  'notfound.cta': 'Back to home',
} as const;

export type UIKey = keyof typeof ui;

/** Translate a key, with `{placeholder}` interpolation. */
export function t(key: UIKey, vars?: Record<string, string | number>): string {
  let s: string = ui[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}
