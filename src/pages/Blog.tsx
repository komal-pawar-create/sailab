import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Send } from 'lucide-react';
import { blogPosts, blogClusters } from '@/lib/blogData';
import BlogCard from '@/components/blog/BlogCard';
import BlogLayout from '@/components/blog/BlogLayout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { submitToIndexNow } from '@/lib/indexNow';
import { toast } from '@/hooks/use-toast';

const Blog = () => {
  const [search, setSearch] = useState('');
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const debouncedSearch = useDebounce(search, 250);

  const filteredPosts = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return blogPosts.filter((p) => {
      const matchesCluster = !activeCluster || p.cluster === activeCluster;
      if (!q) return matchesCluster;
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesCluster && matchesSearch;
    });
  }, [debouncedSearch, activeCluster]);

  const clustersToShow = useMemo(() => {
    if (activeCluster) return blogClusters.filter((c) => c.id === activeCluster);
    return blogClusters;
  }, [activeCluster]);

  return (
    <BlogLayout
      title="Blog - Lab Management Insights"
      description="Expert articles on LIMS software, pathology lab management, billing, compliance, and digital transformation for Indian labs."
      canonicalSlug=""
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'LabFlow Blog — Lab Management Insights',
        description: 'Expert articles on LIMS software and lab management for Indian pathology and diagnostic labs.',
        url: 'https://labflow.mywebz.in/blog',
        publisher: {
          '@type': 'Organization',
          name: 'LabFlow',
          url: 'https://labflow.mywebz.in',
          logo: { '@type': 'ImageObject', url: 'https://labflow.mywebz.in/images/labflow-logo.png' },
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: blogPosts.length,
          itemListElement: blogPosts.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://labflow.mywebz.in/blog/${p.slug}`,
            name: p.title,
          })),
        },
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Lab Management Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Expert guides on LIMS software, lab billing, digital reports, compliance, and multi-branch management for Indian pathology &amp; diagnostic labs.
          </p>
          {user && (
            <Button
              size="sm"
              variant="outline"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  const slugs = blogPosts.map((p) => p.slug);
                  const { error } = await submitToIndexNow(slugs);
                  if (error) throw error;
                  toast({ title: 'Submitted to IndexNow', description: `${slugs.length} URLs sent to search engines.` });
                } catch (e: any) {
                  toast({ title: 'IndexNow failed', description: e?.message || 'Unknown error', variant: 'destructive' });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitting ? 'Submitting…' : 'Notify Search Engines'}
            </Button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Cluster filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button onClick={() => setActiveCluster(null)}>
            <Badge
              variant={activeCluster === null ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5"
            >
              All
            </Badge>
          </button>
          {blogClusters.map((c) => (
            <button key={c.id} onClick={() => setActiveCluster(activeCluster === c.id ? null : c.id)}>
              <Badge
                variant={activeCluster === c.id ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5"
              >
                {c.label}
              </Badge>
            </button>
          ))}
        </div>

        {/* Results count */}
        {debouncedSearch && (
          <p className="text-sm text-muted-foreground text-center mb-6">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'} found
          </p>
        )}

        {/* Articles by cluster */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No articles match your search.</p>
            <button onClick={() => { setSearch(''); setActiveCluster(null); }} className="text-primary hover:underline mt-2 text-sm">
              Clear filters
            </button>
          </div>
        ) : (
          clustersToShow.map((cluster) => {
            const posts = filteredPosts.filter((p) => p.cluster === cluster.id);
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
          })
        )}

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
