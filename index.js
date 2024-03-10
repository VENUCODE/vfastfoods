const express = require("express");
const ejs = require("ejs");
const mysql = require("mysql");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
//SECTION - helper functions
const isProductInCart = (cart, id) => {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id === id) return true;
  }
  return false;
};
const calculateTotal = (cart, req) => {
  let total = 0;
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].sale_price) {
      total += cart[i].sale_price * cart[i].quantity;
    } else {
      total += cart[i].price * cart[i].quantity;
    }
  }
  req.session.total = total;
  return total;
};

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
app.post("/add_to_cart", function (req, res) {
  const product = ({
    id,
    name,
    description,
    price,
    sale_price,
    quantity,
    image,
  } = req.body);
  if (req.session.cart) {
    var cart = req.session.cart;
    if (!isProductInCart(cart, id)) {
      cart.push(product);
      req.session.cart = cart;
    }
  } else {
    req.session.cart = [product];
    var cart = req.session.cart;
  }

  //calculate total amount and quantity
  calculateTotal(cart, req);
  //return to cart page
  res.redirect("/cart");
});

app.get("/cart", function (req, res) {
  const cart = req.session.cart;
  const total = req.session.total;
  res.render("pages/cart", { cart, total: total });
});

app.post("/remove_product", function (req, res) {
  var id = req.body.id;
  var cart = req.session.cart;
  console.log({ id });
  req.session.cart = cart.filter((item) => item.id !== id);
  calculateTotal(req.session.cart, req);
  res.redirect("/cart");
});

app.post("/edit_product_quantity", function (req, res) {
  const { id, quantity, increase_product_quantity, decrease_product_quantity } =
    req.body;
  var cart = req.session.cart;
  if (increase_product_quantity) {
    const itemToIncrease = cart.find((item) => item.id === id);
    if (itemToIncrease && itemToIncrease.quantity > 0) {
      itemToIncrease.quantity++;
    }
  }

  if (decrease_product_quantity) {
    const itemToDecrease = cart.find((item) => item.id === id);
    if (itemToDecrease && itemToDecrease.quantity > 1) {
      itemToDecrease.quantity--;
    }
  }

  calculateTotal(cart, req);

  res.redirect("/cart");
});
