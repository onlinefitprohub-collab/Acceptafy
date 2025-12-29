import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOConfig {
  title: string;
  description: string;
  path: string;
}

const routeSEO: Record<string, SEOConfig> = {
  '/': {
    title: 'Acceptafy - Email Deliverability & Campaign Optimization Platform',
    description: 'Optimize your email campaigns with intelligent grading, deliverability tools, and actionable insights. Improve inbox placement and boost engagement rates.',
    path: '/'
  },
  '/pricing': {
    title: 'Pricing Plans | Acceptafy',
    description: 'Choose the perfect plan for your email marketing needs. From Starter to Scale, get access to powerful deliverability tools and campaign optimization features.',
    path: '/pricing'
  },
  '/account': {
    title: 'My Account | Acceptafy',
    description: 'Manage your Acceptafy account settings, subscription, and preferences.',
    path: '/account'
  },
  '/contact': {
    title: 'Contact Us | Acceptafy',
    description: 'Get in touch with the Acceptafy team. We\'re here to help with your email deliverability questions and support needs.',
    path: '/contact'
  },
  '/terms': {
    title: 'Terms of Service | Acceptafy',
    description: 'Read our terms of service to understand the rules and guidelines for using Acceptafy\'s email optimization platform.',
    path: '/terms'
  },
  '/privacy': {
    title: 'Privacy Policy | Acceptafy',
    description: 'Learn how Acceptafy protects your data and respects your privacy. Read our comprehensive privacy policy.',
    path: '/privacy'
  },
  '/admin': {
    title: 'Admin Dashboard | Acceptafy',
    description: 'Acceptafy administration dashboard for managing users, analytics, and system settings.',
    path: '/admin'
  },
  '/reset-password': {
    title: 'Reset Password | Acceptafy',
    description: 'Reset your Acceptafy account password securely.',
    path: '/reset-password'
  }
};

export function SEOHead() {
  const [location] = useLocation();
  
  useEffect(() => {
    const seo = routeSEO[location];
    const currentPath = location.split('?')[0].split('#')[0];
    
    if (seo) {
      document.title = seo.title;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', seo.description);
      }
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', seo.title);
      }
      
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', seo.description);
      }
      
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute('content', seo.title);
      }
      
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (twitterDescription) {
        twitterDescription.setAttribute('content', seo.description);
      }
    }
    
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://acceptafy.com${currentPath}`);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', `https://acceptafy.com${currentPath}`);
    }
    
    const twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute('content', `https://acceptafy.com${currentPath}`);
    }
  }, [location]);
  
  return null;
}
