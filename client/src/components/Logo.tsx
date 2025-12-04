export const Logo: React.FC = () => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            {/* Main background gradient for the icon shape */}
            <linearGradient id="web2_bgGradient" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" /> {/* A nice purple */}
                <stop offset="100%" stopColor="#4F46E5" /> {/* A darker indigo */}
            </linearGradient>

            {/* Glossy overlay effect */}
            <linearGradient id="web2_gloss" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                <stop offset="100%" stopColor="white" stopOpacity="0.0" />
            </linearGradient>
            
            {/* Drop shadow filter */}
            <filter id="web2_dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="3" result="offsetblur"/>
                <feFlood floodColor="#000" floodOpacity="0.2"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            
            <clipPath id="glossClip">
                <rect x="10" y="10" width="80" height="40" rx="20" ry="20" />
            </clipPath>
        </defs>

        {/* Using a group for the shadow filter */}
        <g filter="url(#web2_dropShadow)">
            {/* Base rounded rectangle */}
            <rect x="10" y="10" width="80" height="80" rx="20" ry="20" fill="url(#web2_bgGradient)" />

            {/* Glossy overlay - clipped */}
            <rect x="10" y="10" width="80" height="80" rx="20" ry="20" fill="url(#web2_gloss)" clipPath="url(#glossClip)" />

            {/* Envelope icon in the center */}
            <g transform="translate(25, 32)" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                {/* Envelope body */}
                <path d="M 0 5 V 35 H 50 V 5 Z" />
                {/* Envelope flap */}
                <path d="M 0 5 L 25 20 L 50 5" />
            </g>
        </g>
    </svg>
);
