const express = require("express");
const ejs = require("ejs");

const app = express();
app.listen(5000);
app.get("/", function (req, res) {
  res.send("hello");
});
