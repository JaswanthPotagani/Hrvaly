export default function sitemap() {
    return [
      {
        url: 'https://www.margi.live',
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 1,
      },
      {
        url: 'https://www.margi.live/dashboard',
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: 'https://www.margi.live/sign-in',
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: 'https://www.margi.live/sign-up',
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      // Add more routes here if needed
    ]
  }
