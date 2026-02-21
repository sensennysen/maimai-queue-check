import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).send('Missing slug');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Fetch profile data
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('display_name, display_photo_url, dx_display_photo_url, is_public')
      .eq('slug', slug.toLowerCase())
      .maybeSingle();

    if (error || !profile) {
      return res.status(404).send('Profile not found');
    }

    // 2. Prepare metadata
    const name = profile.display_name || 'Anonymous Player';
    const photo = profile.display_photo_url || profile.dx_display_photo_url || 'https://maipaqueuecheck.vercel.app/icon.png';
    const title = `${name} | maiPaQueueCheck PH`;
    const description = `Check out ${name}'s maimai profile and best scores on maiPaQueueCheck PH.`;
    const url = `https://maipaqueuecheck.vercel.app/p/${slug}`;
    
    // We'll use a dynamic OG image if we can, otherwise fallback to profile photo
    // For now, let's use the profile photo directly as requested
    const ogImage = photo;

    // 3. Generate HTML with Meta Tags
    // We use a template based on the project's index.html
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/jpeg" href="/icon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${ogImage}">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script>
    // Redirect to the actual profile page for regular users if they somehow land here
    // but the middleware should handle the rewrite so this is just a safety net
    window.location.href = "${url}";
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Metadata injection error:', err);
    return res.status(500).send('Internal Server Error');
  }
}
