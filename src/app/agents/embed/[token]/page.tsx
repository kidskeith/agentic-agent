import { queryOne } from '@/lib/db';
import ChatWidget from '@/components/ChatWidget/ChatWidget';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';

interface Agent {
    id: string;
    name: string;
    embed_token: string;
    description: string | null;
    allowed_domains: string | null;
}

async function getAgentByToken(token: string): Promise<Agent | null> {
    return queryOne<Agent>(
        'SELECT id, name, embed_token, description, allowed_domains FROM agents WHERE embed_token = ? AND status = "active"',
        [token]
    );
}

export async function generateMetadata({ 
    params 
}: { 
    params: Promise<{ token: string }> 
}): Promise<Metadata> {
    const { token } = await params;
    const agent = await getAgentByToken(token);

    return {
        title: agent ? `${agent.name} - Chat` : 'Chat Assistant',
        description: agent?.description || 'AI Chat Assistant',
    };
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default async function EmbedPage({
    params,
    searchParams
}: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { token } = await params;
    const sParams = await searchParams;
    const agent = await getAgentByToken(token);

    if (!agent) {
        notFound();
    }

    // Domain validation
    const headerList = await headers();
    const referer = headerList.get('referer');
    
    if (agent.allowed_domains) {
        // Normalize allowed domains: remove protocols, paths, and trailing slashes
        // e.g., "http://localhost:8080/" -> "localhost:8080"
        const allowedDomains = agent.allowed_domains.split(',')
            .map(d => {
                let clean = d.trim().toLowerCase();
                // Remove protocol
                clean = clean.replace(/^https?:\/\//, '');
                // Remove path and trailing slash
                clean = clean.split('/')[0];
                return clean;
            })
            .filter(Boolean);

        if (allowedDomains.length > 0) {
            let isAllowed = false;
            
            if (referer) {
                try {
                    const refererUrl = new URL(referer);
                    const refererHost = refererUrl.host.toLowerCase(); // includes port if present
                    const refererHostname = refererUrl.hostname.toLowerCase(); // no port
                    
                    isAllowed = allowedDomains.some(domain => {
                        // Exact match (e.g. "localhost:8080" matches "localhost:8080")
                        if (refererHost === domain) return true;
                        // Hostname match (e.g. "localhost" matches "localhost")
                        if (refererHostname === domain) return true;
                        
                        // Subdomain match (e.g. "app.example.com" ends with ".example.com")
                        // We check against hostname to be safe about ports on subdomains
                        return refererHostname.endsWith('.' + domain) || refererHost.endsWith('.' + domain);
                    });
                } catch (e) {
                    console.error('Error parsing referer URL:', e);
                    isAllowed = false;
                }
            }
            
            // If domains are specified, we REQUIRE a matching Referer.
            if (!isAllowed) {
                return (
                    <main className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
                        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-100 max-w-md">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-slate-800 mb-2">Domain Not Authorized</h1>
                            <p className="text-slate-600 mb-6">This agent is configured to only work on specific domains. Please check your domain settings in the agent dashboard.</p>
                            <div className="text-xs text-slate-400 font-mono break-all p-2 bg-slate-100 rounded">
                                {referer || 'No referer header detected'}
                            </div>
                        </div>
                    </main>
                );
            }
        }
    }

    // specific helper to get string param
    const getParam = (key: string): string | undefined => {
        const val = sParams[key];
        return typeof val === 'string' ? val : undefined;
    };

    // Helper to format color (add # if missing)
    const formatColor = (color?: string): string | undefined => {
        if (!color) return undefined;
        return color.startsWith('#') ? color : `#${color}`;
    };

    // Extract customization from search params (support camelCase and kebab-case)
    const title = getParam('title');
    const subtitle = getParam('subtitle');
    
    // Visuals
    const primaryColor = formatColor(getParam('primaryColor') || getParam('primary-color'));
    const secondaryColor = formatColor(getParam('secondaryColor') || getParam('secondary-color'));
    const textColor = formatColor(getParam('textColor') || getParam('text-color'));
    const bgColor = formatColor(getParam('bgColor') || getParam('bg-color'));
    const logoUrl = getParam('logoUrl') || getParam('logo-url');
    const avatarUrl = getParam('avatarUrl') || getParam('avatar-url');

    // Text
    const welcomeMessage = getParam('welcomeMessage') || getParam('welcome-message');
    const placeholder = getParam('placeholder');

    // Client Info
    const clientId = getParam('clientId') || getParam('client-id');
    const clientName = getParam('clientName') || getParam('client-name');
    const clientLevel = getParam('clientLevel') || getParam('client-level');

    return (
        <main className="w-full h-screen h-[100dvh]">
            <ChatWidget 
                agentId={agent.id} 
                agentName={agent.name} 
                isEmbed={true}
                token={agent.embed_token}
                title={title}
                subtitle={subtitle}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                textColor={textColor}
                bgColor={bgColor}
                logoUrl={logoUrl}
                avatarUrl={avatarUrl}
                welcomeMessage={welcomeMessage}
                placeholder={placeholder}
                clientId={clientId}
                clientName={clientName}
                clientLevel={clientLevel}
            />
        </main>
    );
}
