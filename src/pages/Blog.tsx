import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts, blogClusters } from '@/lib/blogData';
import BlogCard from '@/components/blog/BlogCard';
import BlogLayout from '@/components/blog/BlogLayout';
import { Badge } from '@/components/ui/badge';

const Blog = () => {
  return (
    <BlogLayout
      title="Blog - Lab Management Insights"
      description="Expert articles on LIMS software, pathology lab management, billing, compliance, and digital transformation for Indian labs."
      canonicalSlug=""
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'LabFlow Blog',
        description: 'Expert articles on LIMS software and lab management for Indian pathology and diagnostic labs.',
        url: 'https://labflow.mywebz.in/blog',
        publisher: { '@type': 'Organization', name: 'LabFlow', url: 'https://labflow.mywebz.in' },
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Lab Management Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expert guides on LIMS software, lab billing, digital reports, compliance, and multi-branch management for Indian pathology &amp; diagnostic labs.
          </p>
        </div>

        {/* Cluster filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {blogClusters.map((c) => (
            <a key={c.id} href={`#${c.id}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5">
                {c.label}
              </Badge>
            </a>
          ))}
        </div>

        {/* Articles by cluster */}
        {blogClusters.map((cluster) => {
          const posts = blogPosts.filter((p) => p.cluster === cluster.id);
          if (posts.length === 0) return null;
          return (
            <section key={cluster.id} id={cluster.id} className="mb-16">
              <h2 className="text-2xl font-bold text-foreground mb-6 border-l-4 border-primary pl-4">
                {cluster.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <BlogCard key={post.slug} {...post} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Bottom internal links */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-muted-foreground mb-4">Looking for a complete lab management solution?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/#features" className="text-primary hover:underline font-medium">Explore Features</Link>
            <Link to="/#pricing" className="text-primary hover:underline font-medium">View Pricing</Link>
            <Link to="/product-tour" className="text-primary hover:underline font-medium">Product Tour</Link>
          </div>
        </div>
      </div>
    </BlogLayout>
  );
};

export default Blog;
