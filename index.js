const express = require("express");
const ejs = require("ejs");
const mysql = require("mysql");
const session = require("express-session");

const bodyParser = require("body-parser");
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secret" }));
app.listen(3000);

app.get("/", function (req, res) {
  var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });
  conn.query("select * from products", (error, result) => {
    res.render("pages/index", { result });
  });
});
