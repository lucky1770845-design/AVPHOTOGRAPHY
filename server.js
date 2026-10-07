import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(__dirname));

app.post('/api/upload', (req, res) => {
  try {
    const { filename, data, category } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const base64Data = matches ? matches[2] : data;
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = filename && filename.includes('.') ? filename.split('.').pop().toLowerCase() : 'jpg';
    const cleanName = (filename ? filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") : "photo")
      .slice(0, 30);
    const uniqueName = `${Date.now()}_${cleanName}.${ext}`;
    const filePath = join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${uniqueName}`;

    return res.json({
      success: true,
      url: publicUrl,
      filename: uniqueName,
      category: category || 'Wedding'
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

const defaultInstagramPosts = [
  {
    id: 'post-1',
    caption: 'A regal bridal entry woven with emotional tears, gold kaleeras, and timeless heritage grace in Jhansi. Every candid frame reflects a royal celebration. Congratulations Shreya & Ankit! ✨💍',
    hashtags: ['#BridalEntry', '#JhansiWedding', '#RoyalBride', '#AVPhotography', '#IndianWedding'],
    date: '2 days ago',
    likes: '1.8K',
    img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.instagram.com/av_photography_jhansi/'
  },
  {
    id: 'post-2',
    caption: 'Golden hour romance among the heritage Orchha chhatris. When two souls speak in effortless laughter, every frame turns into cinematic poetry. Sunset pre-wedding series out now! 🌅📸',
    hashtags: ['#PreWeddingJhansi', '#OrchhaDiaries', '#SunsetRomance', '#CoupleGoals', '#CinematicFilm'],
    date: '4 days ago',
    likes: '2.4K',
    img: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.instagram.com/av_photography_jhansi/'
  },
  {
    id: 'post-3',
    caption: 'Pure Haldi euphoria! Turmeric splashes, spontaneous dhol beats, and unfiltered happiness with family and cousins. Capturing the authentic warmth of Jhansi weddings. 💛🎊',
    hashtags: ['#HaldiCeremony', '#SipriBazar', '#CandidMoments', '#IndianTraditions', '#WeddingJoy'],
    date: '6 days ago',
    likes: '1.2K',
    img: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.instagram.com/av_photography_jhansi/'
  }
];

let cachedInstagramPosts = [...defaultInstagramPosts];

let lastSyncTime = new Date().toISOString();

app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

app.get('/api/instagram/recent', (req, res) => {
  const handle = 'av_photography_jhansi';
  res.json({
    handle,
    posts: cachedInstagramPosts && cachedInstagramPosts.length ? cachedInstagramPosts : defaultInstagramPosts,
    trendingHashtags: [
      '#AVPhotography',
      '#JhansiWedding',
      '#OrchhaPreWedding',
      '#BundelkhandBrides',
      '#HaldiCeremonyJhansi',
      '#SipriBazarShoots',
      '#IndianWeddingPhotographer'
    ],
    updatedAt: lastSyncTime
  });
});

app.post('/api/instagram/update', (req, res) => {
  if (req.body && Array.isArray(req.body.posts) && req.body.posts.length > 0) {
    cachedInstagramPosts = req.body.posts.slice(0, 3);
    lastSyncTime = new Date().toISOString();
    return res.json({ success: true, posts: cachedInstagramPosts, updatedAt: lastSyncTime });
  } else if (req.body && Array.isArray(req.body.posts) && req.body.posts.length === 0) {
    cachedInstagramPosts = [...defaultInstagramPosts];
    lastSyncTime = new Date().toISOString();
    return res.json({ success: true, posts: cachedInstagramPosts, updatedAt: lastSyncTime });
  }
  res.status(400).json({ error: 'Invalid posts data' });
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
