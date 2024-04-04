const express = require("express");
const handlebars = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt'); //  To hash passwords
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const axios = require("axios");

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

app.use(session({
  secret: 'XASDASDA',
  saveUninitialized: true,
  resave: true
}))
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
app.get("/employeeTasks", (req, res) => {
  res.render("./pages/employeeTasks");
});

app.get("/register", (req, res) => {
  res.render("./pages/register");
});

app.get("/employeeTasks", (req, res) => {
  res.render("./pages/employeeTasks");
});

app.get("/register_employee", (req, res) => {
  res.render("./pages/registerEmployee");
});

app.get("/register_manager", (req, res) => {
  res.render("./pages/registerManager");
});

app.get("/login", (req, res) => {
  res.render("./pages/login");
});


app.get('/logout',(req, res) =>
{
  res.render('pages/logout');
});

app.post('/logout',(req, res) =>
{
  req.session.destroy((err =>
    {
      if(err)
      {
        console.log("Error Logging Out");
      };
    }));
    res.redirect('/login');
});
app.post("/registerManager", async (req, res) => 
{
  try 
  {
    const hash = await bcrypt.hash(req.body.password, 10); 
    await db.none("INSERT INTO users (username, password, firstname, lastname, branch, manager) VALUES ($1, $2, $3, $4, $5, $6)", [req.body.username, hash, req.body.firstname, req.body.lastname, req.body.branch, true]);
    console.log("successfully inserted into the database");
    res.redirect("/login");
  } 
  catch (error) 
  {
    console.log("Failed to register manager.");
    console.error('Error inserting into Database', error);
    res.redirect("/register_manager");
  }
});


app.post("/registerEmployee", async (req, res) => 
{
  try 
  {
    const hash = await bcrypt.hash(req.body.password, 10); // Correctly wait for the hash to complete
    await db.none("INSERT INTO users (username, password, firstname, lastname, branch, manager) VALUES ($1, $2, $3, $4, $5, $6)", [req.body.username, hash, req.body.firstname, req.body.lastname, req.body.branch, false]);
    console.log("successfully inserted into the database");
    res.redirect("/login");
  } 
  catch (error) 
  {
    console.log("Failed to register employee.");
    console.error('Error inserting into Database', error);
    res.redirect("/register_employee");
  }
});

app.post('/login', async(req, res) =>
{
  try
  {
    console.log(req.body.username);
    console.log('SELECT * FROM users WHERE username = $1;');
    const user = await db.one('SELECT * FROM users WHERE username = $1;', [req.body.username]);
    const match = await bcrypt.compare(req.body.password, user.password); 
    if (match & req.body.manager) 
    {
      req.session.user = user;
      req.session.save();
      res.redirect("/managerTasks"); 
    }
    else if(match & !req.body.manager)
    {
      req.session.user = user;
      req.session.save();
      res.redirect('/employeeTasks');
    };
     return res.render('pages/login', {message: 'incorrect user or password', error: true});
  }
  catch (error)
  {
    console.log(error);
    res.render("pages/login", {message: 'user not found', error: true});
  };
});
// Authentication Middleware.
const auth = (req, res, next) => 
{
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};



app.get("/login", (req, res) => {
  res.render("./pages/login");
});

app.listen(PORT, (error) => {
  if (!error)
    console.log("Server is test Running, and App is listening on port " + PORT);
  else console.log("Error occurred, server can't start", error);
});
