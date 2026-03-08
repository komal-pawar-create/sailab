import type { BlogPost } from './blogData';

export function getArticleJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    author: { '@type': 'Organization', name: 'LabFlow', url: 'https://labflow.mywebz.in' },
    publisher: {
      '@type': 'Organization',
      name: 'LabFlow',
      url: 'https://labflow.mywebz.in',
      logo: { '@type': 'ImageObject', url: 'https://labflow.mywebz.in/images/labflow-logo.png' },
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    mainEntityOfPage: `https://labflow.mywebz.in/blog/${post.slug}`,
    image: post.ogImage || 'https://labflow.mywebz.in/images/labflow-logo.png',
    inLanguage: 'en-IN',
  };
}
