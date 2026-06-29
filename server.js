const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

function sanitizeString(x) {
  return typeof x === 'string' ? x : '';
}

// Health
app.get('/health', (req, res) => {
  res.type('html').send('SalesZen backend running. POST /chat');
});

// Serve the main frontend page at root
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'saleszen-ai.html'));
});

// Chat endpoint
app.get('/chat', (req, res) => {
  res.status(405).json({ reply: 'Use POST /chat with JSON body.' });
});

function makeLocalReply(messages) {
  const lastUser = [...messages].reverse().find(m => m && m.role === 'user');
  const text = sanitizeString(lastUser?.content || '');
  const lc = text.toLowerCase();

  if (!text) {
    return 'Hello! I am SalesZen, your AI sales assistant. What would you like to ask today?';
  }

  const replies = [
    { re: /\b(price|pricing|cost|quote|budget)\b/, reply: 'Our pricing depends on your needs. What budget range are you considering and how many users will need access?' },
    { re: /\b(demo|trial|show|see|present)\b/, reply: 'I can walk you through a demo. What specific part of your sales process would you like to improve?' },
    { re: /\b(product|feature|features|service|offer)\b/, reply: 'We offer AI sales automation, chatbots, and analytics. Which part of your business would you like to improve?' },
    { re: /\b(help|support|issue|problem|setup)\b/, reply: 'I can help with onboarding or solving issues. What challenge are you facing today?' },
    { re: /\b(thank|thanks|thank you)\b/, reply: 'You’re welcome! If you have more questions, just ask.' },
    { re: /\b(hi|hello|hey|namaste|good morning|good evening)\b/, reply: 'Hi there! I’m SalesZen, your AI sales assistant. How can I help your business today?' }
  ];

  for (const candidate of replies) {
    if (candidate.re.test(lc)) {
      return candidate.reply;
    }
  }

  return 'Thanks for your message. Could you tell me a bit more about your goals so I can suggest the best solution?';
}

app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ reply: 'Invalid request: messages array missing.' });
    }

    const reply = makeLocalReply(messages);
    return res.json({ reply });
  } catch (e) {
    console.error('POST /chat error:', e);
    return res.status(500).json({ reply: 'Server error while generating response.' });
  }
});

// Serve static frontend
// Frontend file is in the same folder as this server: `SalesZen/saleszen-ai.html`.
app.use(express.static(__dirname));

// Explicit route so `/saleszen-ai.html` always works
app.get('/saleszen-ai.html', (req, res) => {
  const filePath = path.resolve(__dirname, 'saleszen-ai.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('sendFile error:', err);
      res.status(500).type('text/plain').send('Unable to send saleszen-ai.html');
    }
  });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SalesZen backend running on http://localhost:${PORT}`);
});

