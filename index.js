const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
const port = 8000;

// reqular middleware
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


connectDB = mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(console.log("DB Connected Succesfully...."))
  .catch((err) => {
    console.log("DB Connection Failed!");
    console.log(err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use('/uploads', express.static('uploads'));
//Router middleware
const authRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes')

// Use middle ware 

app.use('/api/auth', authRoutes);
app.use('/api/auth', issueRoutes);