import { generateFullArticle } from '../server/gemini';
import { storage } from '../server/storage';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

function linkifyHtmlContent(html: string): string {
  const urlRegex = /(?<![='"(])(https?:\/\/[^\s<>"')\],]+)/g;
  return html.replace(/>([^<]*)</g, (match, textContent) => {
    const linked = textContent.replace(urlRegex, (url: string) => {
      const clean = url.replace(/[.,;:!?]+$/, '');
      const trailing = url.slice(clean.length);
      return `<a href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>${trailing}`;
    });
    return `>${linked}<`;
  });
}

const topics = [
  "Why Your Emails Are Going to Spam (And How to Fix It in 24 Hours)",
  "The Cold Email Deliverability Checklist: 15 Things to Check Before You Hit Send",
  "SPF, DKIM, and DMARC Explained: The Non-Technical Guide for Marketers",
  "How to Warm Up a New Email Domain Without Destroying Your Reputation",
  "What Is a Good Sender Score? (And How to Check Yours for Free)",
  "Gmail Promotions Tab vs Primary: Why You're Losing 40% of Your Opens",
  "Email Deliverability Testing: Free Tools vs. Paid Solutions (2026 Guide)",
  "Is Your Email Domain Blacklisted? Here's How to Check and Get Removed",
  "B2B Cold Outreach: Why Your Emails Stop Working After 500 Sends",
  "The Email Marketer's First 90 Days: Building Reputation From Scratch"
];

async function generateArticles() {
  console.log('Starting article generation...');
  
  // Get existing articles for internal linking
  const existingArticles = await storage.getArticles(true);
  const existingArticleData = existingArticles.map(a => ({
    title: a.title,
    slug: a.slug
  }));
  
  const recentFormats = existingArticles
    .slice(0, 10)
    .map((a: any) => a.articleFormat)
    .filter(Boolean);
  
  // Get admin user ID - find first admin user
  const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (!adminUser) {
    console.error('Admin user not found');
    process.exit(1);
  }
  console.log(`Using admin user: ${adminUser.email}`);
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    console.log(`\n[${i + 1}/${topics.length}] Generating: ${topic}`);
    
    try {
      const rawArticle = await generateFullArticle({
        topic,
        existingArticles: existingArticleData,
        existingFormats: recentFormats
      });
      
      // Generate slug from title
      const slug = (rawArticle.slug || rawArticle.title || topic)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      // Convert bare URLs to clickable hyperlinks
      const linkedContent = linkifyHtmlContent(rawArticle.content || '');

      // Save to database
      const article = await storage.createArticle({
        title: rawArticle.title || topic,
        slug,
        excerpt: rawArticle.excerpt || '',
        content: linkedContent,
        featuredImage: null,
        tags: rawArticle.tags || [],
        metaTitle: rawArticle.metaTitle || rawArticle.title || topic,
        metaDescription: rawArticle.metaDescription || rawArticle.excerpt || '',
        published: false, // Save as draft for review
        authorId: adminUser.id
      });
      
      console.log(`  ✓ Created: ${article.title} (slug: ${article.slug})`);
      
      // Add to existing articles for next iteration's internal linking
      existingArticleData.push({ title: article.title, slug: article.slug });
      if (rawArticle.articleFormat) {
        recentFormats.unshift(rawArticle.articleFormat);
      }
      
    } catch (error) {
      console.error(`  ✗ Failed: ${error}`);
    }
  }
  
  console.log('\n✅ Article generation complete!');
}

generateArticles().catch(console.error);
