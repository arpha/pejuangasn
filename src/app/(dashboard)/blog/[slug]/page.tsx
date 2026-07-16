import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

import BlogDetailClient from './BlogDetailClient';
import { Blog } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Fetch helper on the server side (uses service key to bypass RLS limits in server context)
async function getBlog(slug: string): Promise<Blog | null> {
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!supabaseUrl || !key) return null;
  
  try {
    const supabase = createClient(supabaseUrl, key);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as Blog;
  } catch (err) {
    console.error('Error fetching blog inside Server Component:', err);
    return null;
  }
}

// Generate Dynamic SEO tags (Metadata Next.js generateMetadata function)
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await getBlog(params.slug);
  
  if (!blog) {
    return {
      title: 'Artikel Tidak Ditemukan | Kawan ASN',
      description: 'Artikel yang Anda cari tidak dapat ditemukan.',
    };
  }

  const seoTitle = blog.seo_title || blog.title;
  const seoDescription = blog.seo_description || blog.content.substring(0, 160).replace(/[#*`>|\-]/g, '').trim();
  const seoKeywords = blog.seo_keywords || 'cpns, pppk, tryout cat, asn, materi belajar, tips lolos';

  const metadata: Metadata = {
    title: `${seoTitle} | Kawan ASN`,
    description: seoDescription,
    keywords: seoKeywords,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: blog.image_url ? [{ url: blog.image_url }] : [],
      type: 'article',
      url: `/blog/${blog.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: blog.image_url ? [blog.image_url] : [],
    }
  };

  // If the blog is not published (draft), tell search engines not to index it
  if (!blog.is_published) {
    metadata.robots = {
      index: false,
      follow: false
    };
  }

  return metadata;
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const blog = await getBlog(params.slug);

  return <BlogDetailClient blog={blog} slug={params.slug} />;
}
