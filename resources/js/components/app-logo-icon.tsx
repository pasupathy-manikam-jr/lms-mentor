import type { SVGAttributes } from 'react';

// Logo mark: a diya (oil lamp), the traditional symbol for the light of knowledge.
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2.5c3.6 4.2 5 7.4 3.9 10.2A4.1 4.1 0 0 1 16 15.5a4.1 4.1 0 0 1-3.9-2.8C11 9.9 12.4 6.7 16 2.5Z" />
            <path d="M3 18.5h26c-.9 5.9-6.3 10-13 10s-12.1-4.1-13-10Z" />
        </svg>
    );
}
