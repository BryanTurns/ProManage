const express = require("express");
const handlebars = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); //  To hash passwords
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const axios = require("axios");
const { error } = require("console");

const app = express();
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
  session({
    secret: "XASDASDA",
    saveUninitialized: true,
    resave: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const auth = (req, res, next) => {
  if (
    !req.session.user &&
    // req.url != "/login" &&
    // req.url != "/register" &&
    // req.url != "/register_manager" &&
    // req.url != "/register_employee"
    (req.url == "/tasks" ||
      req.url == "/logout" ||
      req.url == "/" ||
      req.url == "/home")
  ) {
    // Default to login page.
    return res.redirect("/login");
  }
  next();
};
// Authentication Required
app.use(auth);

app.get("/", (req, res) => {
  res.render("./pages/home", { auth: req.session.user });
});
app.get("/home", (req, res) => {
  res.redirect("/");
});
app.get("/tasks", async (req, res) => {
  try {
    test = req.session.user.username

    if (req.session.user.manager) {
    const query = 'SELECT * FROM users WHERE branch = $1';
    const users = await db.any(query, [req.session.user.branch]);
    console.log(users);
    console.log(req.session.user.branch);
    res.render("./pages/managerTasks", {auth: req.session.user, users: users});
    } else {
      res.render("./pages/employeeTasks", { auth: req.session.user });
    }
  } catch (error) {
    console.error("Error handling tasks route:", error);
    res.status(500).send("Unknown Error");
  }
});

// app.get("/managerTasks", (req, res) => {
//   res.render("./pages/managerTasks", { auth: req.session.user });
// });
// app.get("/employeeTasks", (req, res) => {
//   res.render("./pages/employeeTasks", { auth: req.session.user });
// });

app.get("/register", (req, res) => {
  res.render("./pages/register", { auth: req.session.user });
});

app.get("/registerEmployee", (req, res) => {
  res.render("./pages/registerEmployee", { auth: req.session.user });
});

app.get("/registerManager", (req, res) => {
  res.render("./pages/registerManager", { auth: req.session.user });
});

app.get("/login", (req, res) => {
  res.render("./pages/login", { auth: req.session.user });
});

app.get("/logout", (req, res) => {
  res.render("pages/logout", { auth: req.session.user });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error Logging Out");
    }
  });
  res.redirect("/login");
});
app.post("/registerManager", async (req, res) => {
  try {
    if (req.body.password != req.body.confirmpassword) {
      return res.render("pages/registerManager", {
        message: "Passwords do not match",
        error: true,
      });
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    await db.none(
      "INSERT INTO users (username, password, confirmpassword, firstname, lastname, branch, manager) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        req.body.username,
        hash,
        req.body.confirmpassword,
        req.body.firstname,
        req.body.lastname,
        req.body.branch,
        true,
      ]
    );
    console.log("successfully inserted into the database");
    res.redirect("/login");
  } catch (error) {
    if (error.code === "23505") {
      return res.render("pages/registerManager",{
        message: "Username taken",
        error: true,
      });
    } else {
      res.render("pages/registerManager", {
        message: "an error has occurred",
        error: true,
      });
    }
    console.log("Failed to register manager.");
    console.error("Error inserting into Database", error);
    return res.json({
      status: "Invalid input",
      message: "Test0 Already Added!",
      redirectTo: "/registerManager",
    });
  }
});

app.post("/registerEmployee", async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10); // Correctly wait for the hash to complete
    if (req.body.password != req.body.confirmpassword) {
      return res.render("pages/registerEmployee", {
        message: "Passwords do not match",
        error: true,
      });
    }
    // Authenticate first, last, and username on backend
    const upperLowerNumeric = /^[a-z\d]+$/i;
    if (!upperLowerNumeric.test(req.body.username)) {
      return res.render("pages/registerEmployee", {
        message:
          "Invalid format. Username must contain only numbers and letters.",
        error: true,
      });
    }
    if (!upperLowerNumeric.test(req.body.firstname)) {
      return res.render("pages/registerEmployee", {
        message:
          "Invalid format. First name must contain only numbers and letters.",
        error: true,
      });
    }
    if (!upperLowerNumeric.test(req.body.lastname)) {
      return res.render("pages/registerEmployee", {
        message:
          "Invalid format. First name must contain only numbers and letters.",
        error: true,
      });
    }
    await db.none(
      "INSERT INTO users (username, password, confirmpassword, firstname, lastname, branch, manager) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        req.body.username,
        hash,
        req.body.confirmpassword,
        req.body.firstname,
        req.body.lastname,
        req.body.branch,
        false,
      ]
    );
    console.log("successfully inserted into the database");
    res.redirect("/login");
  } catch (error) {
    if (error.code === "23505") {
      res.render("pages/registerEmployee", {
        message: "username taken",
        error: true,
      });
    } else {
      res.render("pages/registerEmployee", {
        message: "an error has occurred",
        error: true,
      });
    }
    console.log("Failed to register employee.");
    console.error("Error inserting into Database", error);
  }
});

app.post("/login", async (req, res) => {
  try {
    console.log(req.body.username);
    console.log("SELECT * FROM users WHERE username = $1;");
    const user = await db.one("SELECT * FROM users WHERE username = $1;", [
      req.body.username,
    ]);
    const match = await bcrypt.compare(req.body.password, user.password);
    if (match && req.body.manager) {
      req.session.user = user;
      req.session.save(() => {
        res.status(200).json({
          success: true,
          message: "Logged in succesfully",
          redirectTo: "/tasks",
        });
      });
    } else if (match && !req.body.manager) {
      req.session.user = user;
      req.session.save();
      res.redirect("/tasks");
    } else {
      res.render("pages/login", {
        message: "Incorrect Password",
        error: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.render("pages/login", { message: "user not found", error: true });
  }
});

app.get("/login", (req, res) => {
  res.render("./pages/login");
});

module.exports = app.listen(PORT, (error) => {
  if (!error)
    console.log("Server is test Running, and App is listening on port " + PORT);
  else console.log("Error occurred, server can't start", error);
});

app.get("/welcome", (req, res) => {
  res.json({ status: "success", message: "Welcome!" });
});

