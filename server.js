const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const Grid = require('gridfs-stream')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const crypto = require('crypto');
const fs = require('fs')
const bodyParser = require('body-parser')

const app = express(); // initialising the express app
//app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
// Mongo URI
const mongoURI = 'mongodb://aditya:aditya123@ds121673.mlab.com:21673/music_app'

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
  // Init Stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('musicfiles');
});

// creating a storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if(err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'musicfiles'
        };
        resolve(fileInfo);
      })
    })
  }
})
const upload = multer({ storage });

app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if(!files || files.length === 0) {
      res.send({ files: false});
    }


   res.send({ files: files });
  })
})
app.post('/upload', upload.single('file'), (req, res) => {
  //res.json({ file: req.file });
})

app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      if(!file || file.length === 0) {
        return res.status(404).json({
          err: 'No files exist'
        });
      }
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    });
})

const port = process.env.PORT || 5000 // This is for the heroku deployment


app.listen(port, () => console.log('Server is running'))  // creating the server
