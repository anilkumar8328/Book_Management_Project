const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const route = require('./routes/routes.js');
const mongoose = require('mongoose');
const multer = require('multer')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any())

mongoose.connect("mongodb+srv://ridhi:ridhi13@cluster0.dh3hp.mongodb.net/Project-3-group-10-db?retryWrites=true&w=majority", {
        useNewUrlParser: true
    })
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err));

app.use('/', route);

app.listen(process.env.PORT || 3000, (err) => {
    console.log("Connected to port 3000")
});