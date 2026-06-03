/**
 * Site-wide constants. Plain data only — UI strings live in `src/i18n/ui.ts`.
 */

export const SITE = {
  author: 'Marco Ferrara',
  handle: 'b0ru',
  email: 'b0ru@mntcrl.it',
  location: 'Bari, Italy',
  employer: { name: 'Deloitte', url: 'https://www2.deloitte.com' },
  team: { name: 'Mntcrl', url: 'https://www.mntcrl.it' },
  repo: 'https://github.com/imb0ru/imb0ru.github.io',
} as const;

export const SOCIALS = [
  { key: 'github', label: 'GitHub', href: 'https://github.com/imb0ru' },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/ferrara-marco/' },
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/__marcoferrara__' },
] as const;

export const NAV = [
  { key: 'nav.home', path: '/' },
  { key: 'nav.blog', path: '/blog' },
  { key: 'nav.about', path: '/about' },
] as const;

export const SECTIONS = ['writeups', 'challenges', 'research', 'notes'] as const;
export type Section = (typeof SECTIONS)[number];

export const FOCUS_AREAS = [
  'Memory forensics',
  'Disk & filesystem analysis',
  'Incident response',
  'Windows internals',
  'Log & timeline analysis',
  'Network forensics',
  'Malware triage',
  'Threat hunting',
  'Cyber threat intelligence',
  'Osint',
  'CTF challenge design',
] as const;

export interface ExperienceItem {
  role: string;
  company: string;
  url?: string;
  location?: string;
  start?: string;
  end?: string;
  current?: boolean;
  summary?: string;
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    role: 'Cyber Incident Response Analyst',
    company: 'Deloitte',
    url: 'https://www2.deloitte.com',
    location: 'Bari, Italy',
    current: true,
    start: '10-2025',
    summary:
      'Handling incidents through detection, containment, eradication, and recovery to minimise impact and restore normal operations. Conducting proactive threat hunting based on threat intelligence to identify emerging threats within the organisation’s perimeter; analysing key Tactics, Techniques, and Procedures (TTPs) used by threat actors to compromise victim infrastructure. Collecting and analysing digital evidence from various sources and performing eDiscovery activities to support investigations and incident management.',
  },
  {
    role: 'Digital Forensics Specialist - Locked Shields 2025',
    company: 'NATO Cooperative Cyber Defence Centre of Excellence (CCDCOE)',
    url: 'https://www.ccdcoe.org',
    location: 'Live exercise in Ljubljana, Slovenia',
    start: '04-2025',
    end: '05-2025',
    summary:
      "Executed multi-domain digital forensics operations, including ICS/SCADA and mobile environments, as part of the world's largest and most complex live-fire cyber defence exercise. Collaborated cross-functionally with legal and CTI teams under extreme time pressure, contributing forensic evidence and threat intelligence within a realistic simulated international geopolitical crisis scenario.",
  },
  {
    role: 'Cyber Security Instructor',
    company: 'Cybersecurity National Lab',
    url: 'https://www.cyberchallenge.it',
    location: 'Bari, Italy',
    start: '01-2025',
    current: true,
    summary:
      "Mentoring the University of Bari's cybersecurity team, guiding them in developing offensive and defensive skills through tailored exercises and strategic coaching.",
  },
  {
    role: 'Digital Forensics Researcher & CTF Player',
    company: 'Mntcrl',
    url: 'https://www.mntcrl.it',
    location: 'Bari, Italy',
    start: '11-2022',
    current: true,
    summary:
      'Conducting research activities in Digital Forensics, with a focus on the analysis of digital evidence, incident reconstruction, memory forensics, and the identification of malicious artefacts to support cybersecurity investigations. Developing and evaluating defensive security techniques aimed at threat detection, anomaly identification, incident response, and the strengthening of organisational cyber resilience. Actively participating in Capture The Flag (CTF) competitions and military cybersecurity simulations, applying defensive methodologies in realistic adversarial scenarios to enhance technical expertise in cyber operations, threat analysis, and strategic decision-making.',
  },
];

export interface EducationItem {
  degree: string;
  school: string;
  url?: string;
  start?: string;
  end?: string;
}

export const EDUCATION: EducationItem[] = [
  { degree: 'MSc in Cybersecurity', school: 'University of Bari Aldo Moro', start: '2025', end: '2027' },
  { degree: 'BSc in Computer Science', school: 'University of Bari Aldo Moro', start: '2022', end: '2025' },

];

export interface CertItem {
  name: string;
  issuer: string;
  year?: string;
  url?: string;
}

export const CERTIFICATIONS: CertItem[] = [
  // { name: 'GIAC Certified Forensic Analyst (GCFA)', issuer: 'GIAC', year: '2024' },
];
