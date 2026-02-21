import { NextResponse } from 'next/server';

export const config = {
  matcher: '/p/:slug*',
};

export function middleware(request) {
  const url = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  
  // List of common social media bot user agents
  const bots = [
    'twitterbot',
    'facebookexternalhit',
    'line-poker',
    'discordbot',
    'googlers',
    'whatsapp',
    'telegrambot',
    'slackbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest/0.',
    'developers.google.com/+/web/snippet',
    'slack-imgproxy'
  ];

  const isBot = bots.some(bot => userAgent.toLowerCase().includes(bot));

  if (isBot) {
    const slug = url.pathname.split('/').pop();
    if (slug) {
      // Rewrite to our metadata injection API
      url.pathname = '/api/profile-meta';
      url.searchParams.set('slug', slug);
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
