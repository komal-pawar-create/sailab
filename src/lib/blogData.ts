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
}

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
  },
];

export const blogClusters = [
  { id: 'lab-management', label: 'Lab Management' },
  { id: 'lab-billing', label: 'Lab Billing' },
  { id: 'lab-reports', label: 'Lab Reports' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'multi-branch', label: 'Multi-Branch' },
  { id: 'comparison', label: 'Buying Guide' },
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
