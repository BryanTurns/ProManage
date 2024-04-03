const express = require("express");
const handlebars = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
// const bcrypt = require("bcrypt"); //  To hash passwords
// const bcrypt = require("bcrypt"); //  To hash passwords
const axios = require("axios");

const app = express();
let PORT;
if (process.env.WEB_PORT == undefined) {
  PORT = 3000;
  console.log("TEST");
} else {
  PORT = process.env.WEB_PORT;
}
const PORT = process.env.WEB_PORT == undefined ? 3000 : process.env.WEB_PORT;

app.use(express.static(path.join(__dirname, "public")));

const hbs = handlebars.create({
  extname: "hbs",
  layoutsDir: __dirname + "/views/layouts",
  partialsDir: __dirname + "/views/partials",
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// database configuration
const dbConfig = {
  host: "db", // the database server
  port: process.env.DB_PORT, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};
const db = pgp(dbConfig);

// test your database
db.connect()
  .then((obj) => {
    console.log("Database connection successful"); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
  });

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.render("./pages/home");
});
app.get("/home", (req, res) => {
  res.redirect("/");
});
app.get("/managerTasks", (req, res) => {
  res.render("./pages/managerTasks");
});

app.get("/register", (req, res) => {
  res.render("./pages/register");
});
app.get("/register_employee", (req, res) => {
  res.render("./pages/registerEmployee");
});
app.get("/register_manager", (req, res) => {
  res.render("./pages/registerManager");
});

// Needs to handle which page to render using session vars
app.get("/tasks", (req, res) => {
  var isManager = true;

  if (isManager) {
    res.render("./pages/managerTasks");
  } else {
    res.render("./pages/employeeTasks");
  }
});

app.get("/login", (req, res) => {
  res.render("./pages/login");
});

app.listen(PORT, (error) => {
  if (!error)
    console.log("Server is test Running, and App is listening on port " + PORT);
  else console.log("Error occurred, server can't start", error);
});
