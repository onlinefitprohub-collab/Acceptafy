import { useEffect } from 'react';
import { useLocation } from 'wouter';

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Acceptafy",
  "url": "https://acceptafy.com",
  "logo": "https://acceptafy.com/logo.png",
  "description": "Email deliverability and campaign optimization platform",
  "sameAs": [],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "hello@updates.acceptafy.com"
  }
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Acceptafy",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Email deliverability and campaign optimization platform with intelligent grading, spam checking, and ESP integrations.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Starter",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier with 3 email grades per month"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "59",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31",
      "description": "Professional tier with 600 grades, ESP integrations, and advanced tools"
    },
    {
      "@type": "Offer",
      "name": "Scale",
      "price": "149",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31",
      "description": "Enterprise tier with 2,500 grades, white-label reports, and priority support"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Acceptafy",
  "url": "https://acceptafy.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://acceptafy.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const pricingFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is included in the free Starter plan?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Starter plan includes 3 email grades per month, basic spam checking, and access to the email grader tool."
      }
    },
    {
      "@type": "Question",
      "name": "Can I upgrade my plan at any time?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, you can upgrade from Starter to Pro or Scale at any time. Your new features will be available immediately."
      }
    },
    {
      "@type": "Question",
      "name": "What ESP integrations are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Acceptafy supports integrations with SendGrid, Mailchimp, HubSpot, Klaviyo, Ontraport, and HighLevel (limited support)."
      }
    },
    {
      "@type": "Question",
      "name": "Is there a limit on daily usage?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, each plan has daily limits to ensure fair usage. Starter has 3 grades/day, Pro has 50 grades/day, and Scale has 150 grades/day."
      }
    }
  ]
};

export function StructuredData() {
  const [location] = useLocation();
  
  useEffect(() => {
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
    
    const addSchema = (schema: object) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };
    
    addSchema(organizationSchema);
    addSchema(websiteSchema);
    
    if (location === '/' || location === '') {
      addSchema(softwareApplicationSchema);
    }
    
    if (location === '/pricing') {
      addSchema(pricingFAQSchema);
    }
    
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());
    };
  }, [location]);
  
  return null;
}
