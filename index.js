require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require('dns');
const { URL } = require('url');

const client = new MongoClient(process.env.DB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const db = client.db('Back-End-Projects');
const UrlList = db.collection("UrlList");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// Add middlewear
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  
  const urlInput = req.body.url;
  const urlObj = new URL(urlInput);

  const isValidUrl = dns.lookup(urlObj.hostname, async (err) => {
    if (err) {
      res.json({ error: "invalid url"});
      console.error('DNS lookup failed because of the following error: ', err);
      return;
    } else {
      try {
        const totalDocumentCount = await UrlList.countDocuments({});
        const documentUrls = {
          original_url: req.body.url,
          short_url: totalDocumentCount
        };
        await UrlList.insertOne(documentUrls);
        res.json(documentUrls);
      } catch (error) {
        res.status(500).json({ error: 'Database error' });
      }
    }
  })
});

app.get('/api/shorturl/:shorturl', async (req, res) => {
  const shortUrl = parseInt(req.params.shorturl);
  try {
    const documentUrl = await UrlList.findOne({ short_url: shortUrl })

    if (documentUrl) {
      res.redirect(documentUrl.original_url);
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
