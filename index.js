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
  const conn = mysql.createConnection({
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
  res.redirect("/products");
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

app.get("/checkout", function (req, res) {
  const total = req.session.total;
  res.render("pages/checkout", { total: total });
});

app.post("/place_order", function (req, res) {
  const { name, email, phone, city, address } = req.body;
  req.session.order_id = Date.now();
  const product_ids = req.session.cart
    .map((item) => {
      return item.id;
    })
    .join(",");
  var status = "not paid";
  const cost = req.session.total;
  var date = new Date();
  const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });
  conn.connect((error) => {
    if (error) {
      console.log(error);
    } else {
      var query =
        "INSERT INTO orders(id,name,email,phone,city,address,status,cost,date,product_ids) values ?";
      var values = [
        [
          req.session.order_id,
          name,
          email,
          phone,
          city,
          address,
          status,
          cost,
          date,
          product_ids,
        ],
      ];
      conn.query(query, [values], function (err, result) {
        const values = req.session.cart.map((item) => [
          id,
          item.id,
          item.name,
          item.price,
          item.image,
          item.quantity,
          new Date(),
        ]);

        const query =
          "INSERT INTO order_items (order_id, product_id, product_name, product_price, product_image, product_quantity, order_date) VALUES ?";
        conn.query(query, [values], (err, result) => {
          if (err) {
            // Handle error
            console.error("Error inserting order items:", err);
          } else {
            // Handle success
            console.log("Order items inserted successfully");
          }
        });
        res.redirect("/payment");
      });
    }
  });
});

app.get("/payment", function (req, res) {
  res.render("pages/payment", { total: req.session.total });
});

app.get("/verify_payment", function (req, res) {
  const transaction_id = req.query.transaction_id;
  const order_id = req.session.order_id;
  const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });
  conn.connect((error) => {
    if (error) {
      console.log(error);
    } else {
      var query = "INSERT INTO payments(order_id,transaction_id,date) values ?";
      var values = [[order_id, transaction_id, new Date()]];
      conn.query(query, [values], function (error, result) {
        if (!error) {
          conn.query(
            "UPDATE orders set status='paid' where id='" + order_id + "'",
            (err, result) => {}
          );
          res.redirect("/thank_you");
        }
      });
    }
  });
});

app.get("/thank_you", function (req, res) {
  res.render("pages/thank_you", { order_id: req.session.order_id });
});
app.get("/single_product", function (req, res) {
  var id = req.query.id;
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  con.query("SELECT * FROM products WHERE id='" + id + "'", (err, result) => {
    res.render("pages/single_product", { result: result });
  });
});

app.get("/about", function (req, res) {
  res.render("pages/about");
});
app.get("/products", function (req, res) {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  con.query("SELECT * FROM products", (err, result) => {
    res.render("pages/products", { result: result });
  });
});
app.get("/orders", function (req, res) {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  con.query("SELECT * FROM orders ", (err, result) => {
    res.render("pages/orders", { result: result });
  });
});
