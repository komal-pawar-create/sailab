export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cluster: string;
  keywords: string[];
  datePublished: string;
  dateModified: string;
  readTime: string;
  author: string;
  ogImage?: string;
}

const OG_BASE = 'https://labflow.mywebz.in/og';

export const blogPosts: BlogPost[] = [
  {
    slug: 'what-is-lims-software',
    title: 'What is LIMS Software? A Complete Guide for Indian Labs',
    excerpt: 'Learn what Laboratory Information Management System (LIMS) software is, how it works, and why pathology and diagnostic labs in India need it to streamline operations.',
    category: 'Lab Management',
    cluster: 'lab-management',
    keywords: ['LIMS software', 'laboratory information management system', 'lab software India', 'LIMS meaning'],
    datePublished: '2026-01-15',
    dateModified: '2026-02-17',
    readTime: '8 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-what-is-lims.jpg`,
  },
  {
    slug: 'how-to-digitize-pathology-lab',
    title: 'How to Digitize Your Pathology Lab in 2026',
    excerpt: 'A step-by-step guide to transforming your pathology lab from paper-based processes to a fully digital workflow using modern LIMS software.',
    category: 'Lab Management',
    cluster: 'lab-management',
    keywords: ['digitize pathology lab', 'paperless lab', 'lab automation India', 'digital lab transformation'],
    datePublished: '2026-01-20',
    dateModified: '2026-02-17',
    readTime: '10 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-digitize-pathology-lab.jpg`,
  },
  {
    slug: 'gst-billing-for-pathology-labs',
    title: 'GST Billing for Pathology Labs: Complete Guide',
    excerpt: 'Everything you need to know about GST compliance for pathology labs in India — tax rates, invoicing requirements, and how billing software simplifies it.',
    category: 'Lab Billing',
    cluster: 'lab-billing',
    keywords: ['GST billing pathology lab', 'lab billing software', 'GST for diagnostic labs', 'medical lab invoice'],
    datePublished: '2026-01-25',
    dateModified: '2026-02-17',
    readTime: '7 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-gst-billing-labs.jpg`,
  },
  {
    slug: 'lab-billing-software-features',
    title: '7 Must-Have Features in Lab Billing Software',
    excerpt: 'Discover the essential features every pathology lab billing software should have — from automated invoicing to payment tracking and GST compliance.',
    category: 'Lab Billing',
    cluster: 'lab-billing',
    keywords: ['lab billing software features', 'pathology billing software', 'lab invoice software', 'billing features labs'],
    datePublished: '2026-02-01',
    dateModified: '2026-02-17',
    readTime: '6 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-billing-features.jpg`,
  },
  {
    slug: 'digital-lab-reports-guide',
    title: 'Digital Lab Reports: Why Your Lab Should Switch Today',
    excerpt: 'Manual reports are costing your lab time and money. Learn how digital lab report software improves accuracy, speeds up delivery, and enhances patient trust.',
    category: 'Lab Reports',
    cluster: 'lab-reports',
    keywords: ['digital lab reports', 'online lab report software', 'pathology report software', 'lab report management'],
    datePublished: '2026-02-05',
    dateModified: '2026-02-17',
    readTime: '7 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-digital-lab-reports.jpg`,
  },
  {
    slug: 'nabl-accreditation-guide',
    title: 'NABL Accreditation for Labs: Requirements and How Software Helps',
    excerpt: 'Understand NABL accreditation requirements for pathology labs and how LIMS software helps you achieve and maintain compliance effortlessly.',
    category: 'Compliance',
    cluster: 'compliance',
    keywords: ['NABL accreditation', 'NABL lab software', 'ISO 15189 lab management', 'lab compliance software India'],
    datePublished: '2026-02-08',
    dateModified: '2026-02-17',
    readTime: '9 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-nabl-accreditation.jpg`,
  },
  {
    slug: 'multi-branch-lab-management',
    title: 'Managing Multiple Lab Branches: Challenges and Solutions',
    excerpt: 'Running multiple lab branches? Learn the common challenges of multi-branch lab management and how centralized LIMS software solves them.',
    category: 'Multi-Branch',
    cluster: 'multi-branch',
    keywords: ['multi-branch lab software', 'multi-location lab management', 'chain lab software India', 'centralized lab management'],
    datePublished: '2026-02-10',
    dateModified: '2026-02-17',
    readTime: '8 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-multi-branch-management.jpg`,
  },
  {
    slug: 'best-lims-software-india',
    title: 'Best LIMS Software in India 2026: How to Choose',
    excerpt: 'A comprehensive buyer\'s guide to choosing the best LIMS software for your pathology or diagnostic lab in India — features, pricing, and what to look for.',
    category: 'Buying Guide',
    cluster: 'comparison',
    keywords: ['best LIMS software India', 'top lab software India 2026', 'LIMS comparison India', 'choose lab management software'],
    datePublished: '2026-02-15',
    dateModified: '2026-02-17',
    readTime: '12 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-best-lims-india.jpg`,
  },
  {
    slug: 'reduce-lab-report-turnaround-time',
    title: 'How to Reduce Report Turnaround Time in Your Pathology Lab',
    excerpt: 'Delayed reports frustrate patients and hurt your lab\'s reputation. Learn how to identify bottlenecks and cut turnaround time with digital workflows and automation.',
    category: 'Lab Owner Challenges',
    cluster: 'lab-owner-challenges',
    keywords: ['reduce lab TAT', 'report turnaround time pathology', 'faster lab reports', 'lab report delay solutions'],
    datePublished: '2026-02-18',
    dateModified: '2026-02-21',
    readTime: '9 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-reduce-turnaround-time.jpg`,
  },
  {
    slug: 'lab-staff-management-challenges',
    title: '5 Staff Management Challenges Every Lab Owner Faces (And How to Fix Them)',
    excerpt: 'From unclear roles to human errors — discover the top staff management problems in pathology labs and practical solutions using modern lab software.',
    category: 'Lab Owner Challenges',
    cluster: 'lab-owner-challenges',
    keywords: ['lab staff management', 'pathology lab HR challenges', 'lab employee errors', 'lab role management software'],
    datePublished: '2026-02-19',
    dateModified: '2026-02-21',
    readTime: '8 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-reduce-patient-complaints.jpg`,
  },
  {
    slug: 'reduce-patient-complaints-pathology-lab',
    title: 'How to Reduce Patient Complaints in Your Pathology Lab',
    excerpt: 'Patient complaints can damage your lab\'s reputation. Learn the top complaint types, their root causes, and systematic fixes to improve patient satisfaction.',
    category: 'Lab Owner Challenges',
    cluster: 'lab-owner-challenges',
    keywords: ['reduce patient complaints lab', 'pathology lab patient satisfaction', 'lab complaint management', 'improve lab service quality'],
    datePublished: '2026-02-20',
    dateModified: '2026-02-21',
    readTime: '8 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-staff-management.jpg`,
  },
  {
    slug: 'lab-revenue-leakage-prevention',
    title: 'Revenue Leakage in Labs: Where You\'re Losing Money Without Knowing',
    excerpt: 'Unbilled tests, unapproved discounts, and outstanding dues silently drain your lab\'s profits. Learn 6 common leakage points and how software plugs each one.',
    category: 'Lab Owner Challenges',
    cluster: 'lab-owner-challenges',
    keywords: ['lab revenue leakage', 'unbilled tests pathology', 'lab billing losses', 'lab financial management software'],
    datePublished: '2026-02-21',
    dateModified: '2026-02-21',
    readTime: '10 min read',
    author: 'LabFlow Team',
    ogImage: `${OG_BASE}/og-revenue-leakage.jpg`,
  },
];

export const blogClusters = [
  { id: 'lab-management', label: 'Lab Management' },
  { id: 'lab-billing', label: 'Lab Billing' },
  { id: 'lab-reports', label: 'Lab Reports' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'multi-branch', label: 'Multi-Branch' },
  { id: 'comparison', label: 'Buying Guide' },
  { id: 'lab-owner-challenges', label: 'Lab Owner Challenges' },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, count = 3): BlogPost[] {
  const current = getBlogPost(slug);
  if (!current) return blogPosts.slice(0, count);
  // Same cluster first, then others
  const sameCluster = blogPosts.filter((p) => p.cluster === current.cluster && p.slug !== slug);
  const others = blogPosts.filter((p) => p.cluster !== current.cluster);
  return [...sameCluster, ...others].slice(0, count);
}
