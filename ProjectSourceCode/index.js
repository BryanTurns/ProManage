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

Handlebars.registerHelper("json", function (obj) {
  return new Handlebars.SafeString(JSON.stringify(obj));
});

app.use(express.json());

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

//database configuration
const dbConfig = {
  host: "db", // the database server
  port: process.env.DB_PORT, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};
const db = pgp(dbConfig);

// const deployConfig = {
//   host: process.env.host, // the database server
//   port: process.env.DB_PORT, // the database port
//   database: process.env.POSTGRES_DB, // the database name
//   user: process.env.POSTGRES_USER, // the user account to connect with
//   password: process.env.POSTGRES_PASSWORD, // the password of the user account
// };

// const db = pgp(dbConfig);

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

app.get("/home", async (req, res) => {
  try{
    const query2 = "SELECT * FROM alerts WHERE organization = $1;";
    const alerts = await db.any(query2, [req.session.user.branch]);
    res.render("./pages/home", { auth: req.session.user,  alerts: alerts,});
  }
  catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
  
  
});
app.get("/home", (req, res) => {
  res.redirect("/");
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/tasks", async (req, res) => {
  try {
    test = req.session.user.username;
    if (req.session.user.manager) {
      try {
        const query = "SELECT u.username, u.firstname, u.lastname, COUNT(t.taskid) AS task_count FROM users u LEFT JOIN tasks t ON t.employeename = u.username WHERE u.branch = $1 AND u.username != $2 GROUP BY u.username, u.firstname, u.lastname;";
        //console.log("Branch:", req.session.user.branch, "Username: ", req.session.user.username);
        const users = await db.any(query, [req.session.user.branch, req.session.user.username]);
        const message = req.query.message;
        res.render("./pages/managerTasks", {
          auth: req.session.user,
          users: users,
          message: message,
        });
      } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal Server Error");
      }
    } else {
      const query = "SELECT * FROM tasks WHERE employeeName = $1 ORDER BY taskpriority DESC";
      // console.log(req.session.user);
      const message = req.query.message;
      const tasks = await db.any(query, [req.session.user.username]);
      // console.log(tasks);
      var completed = 0;
      for (var i = 0; i < tasks.length; i++) {
        console.log(tasks[i]);
        if (tasks[i].complete) {
          completed++;
        }
      }
      res.render("./pages/employeeTasks", {
        auth: req.session.user,
        progress: completed / tasks.length,
        message: message,
        tasks: tasks,
      });
    }
  } catch (error) {
    console.error("Error handling tasks route:", error);
    res.status(500).send("Unknown Error");
  }
});

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
      return res.render("pages/registerManager", {
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
        auth: req.session.user,
      });
    }
    // Authenticate first, last, and username on backend
    const upperLowerNumeric = /^[a-z\d]+$/i;
    if (!upperLowerNumeric.test(req.body.username)) {
      return res.render("pages/registerEmployee", {
        message:
          "Invalid format. Username must contain only numbers and letters.",
        error: true,
        auth: req.session.user,
      });
    }
    if (!upperLowerNumeric.test(req.body.firstname)) {
      return res.render("pages/registerEmployee", {
        message:
          "Invalid format. First name must contain only numbers and letters.",
        error: true,
        auth: req.session.user,
      });
    }
    if (!upperLowerNumeric.test(req.body.lastname)) {
      return res.render("pages/registerEmployee", {
        message:
          "Invalid format. First name must contain only numbers and letters.",
        error: true,
        auth: req.session.user,
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
        auth: req.session.user,
      });
    } else {
      res.render("pages/registerEmployee", {
        message: "an error has occurred",
        error: true,
        auth: req.session.user,
      });
    }
    console.log("Failed to register employee.");
    console.error("Error inserting into Database", error);
  }
});

app.post("/login", async (req, res) => {
  try {
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
          auth: req.session.user,
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
        auth: req.session.user,
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

app.post("/createEmployeeTask", async (req, res) => {
  try {
    db.none(
      "INSERT INTO tasks (employeeName, taskName, taskDescription, taskstatus, taskpriority) VALUES ($1, $2, $3, 'N/A', $4)",
      [req.body.employee, req.body.taskName, req.body.description, req.body.taskPriority]
    )
      .then((msg) => {
        const query =
          "SELECT * FROM users WHERE branch = $1 AND username != $2";
        db.any(query, [
          req.session.user.branch,
          req.session.user.username,
        ]).then((users) => {
          res.redirect("/tasks?message=Task created successfully");
        });
      })
      .catch((err) => {
        return res.render("./pages/managerTasks", {
          message: `Unable to create task: ${err}`,
          error: true,
          auth: req.session.user,
        });
      });
    return;
  } catch (error) {
    console.error("Error handling tasks route:", error);
    res.status(500).send("Unknown Error");
  }
});

app.post("/updateStatus", async (req, res) => {
  const query =
    "UPDATE tasks SET taskstatus = $1, complete = $2 WHERE taskname = $3";
  try {
    await db.none(query, [
      req.body.status,
      req.body.complete ? req.body.complete : false,
      req.body.taskname,
    ]);
    const tasks = await getTasks(req.session.user);
    res.redirect("/tasks?message=Status updated successfully");
    // res.render("./pages/employeeTasks", {
    //   tasks: tasks,
    //   message: "Status updated!",
    //   error: false,
    //   auth: req.session.user,
    // });
  } catch (err) {
    console.error("Issue updating task status:", err);
    const tasks = await getTasks(req.session.user);
    res.render("./pages/employeeTasks", {
      tasks: tasks,
      message: `Error: ${err.message}`, // It's good to format error messages.
      error: true,
      auth: req.session.user,
    });
  }
});

app.get("/getListofEmployeeTasks", async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).send("Please select an employee");
  }
  try {
    const tasks = await db.any(
      "SELECT * FROM tasks WHERE employeename = $1 ORDER BY taskpriority DESC",
      [username]
    );
    res.json(tasks);
    console.log("Tasks fetched:", tasks);
  } catch (error) {
    console.error("Could not get tasks", error);
    res.status(500).send("Unknown Error");
  }
});
app.post("/updateTask", async (req, res) => {
  const query = "UPDATE tasks SET taskdescription = $1, taskpriority = $4 WHERE taskid = $2 AND employeename = $3";
  console.log(
    req.body.updatedDescription,
    req.body.employeeUsername,
    req.body.taskName,
    req.body.taskPriorityName
  );
  try {
    await db.none(query, [
      req.body.updatedDescription,
      req.body.taskName,
      req.body.employeeUsername,
      req.body.taskPriorityName,
    ]);
    const tasks = await getTasks(req.session.user);
    res.redirect("/tasks?message=Task updated successfully");
  } catch (error) {
    console.error("Could not get tasks", error);
    res.status(500).send("Unknown Error");
  }
});
app.post("/deleteTask", async (req, res) => {
  const query = "DELETE FROM tasks WHERE taskid = $1 AND employeename = $2";
  try {
    await db.none(query, [
      req.body.deleteTaskName,
      req.body.deleteEmployeeSelect,
    ]);
    const tasks = await getTasks(req.session.user);
    res.redirect("/tasks?message=Task deleted successfully");
  } catch (error) {
    console.error("Could Not Delete Task", error);
    res.status(500).send("Unknown Error");
  }
});
app.post("/notifyOrginization", async (req, res) => {
  const query = "INSERT INTO alerts (user_id, message, organization) VALUES ($1, $2, $3)"
  try
  {
    await db.none(query, [
      req.session.user.username,
      req.body.notificationText,
      req.session.user.branch,
    ]);
    res.redirect("/tasks?message=Notification sent!");
  }
  catch (error) {
    console.error("Could Not Create Notification", error);
    res.status(500).send("Unknown Error");
  }
});

app.get("/welcome", (req, res) => {
  res.json({ status: "success", message: "Welcome!" });
});

async function getTasks(user) {
  const query = "SELECT * FROM tasks WHERE employeename = $1";
  if (!user) return;
  return await db.any(query, [user.username]);
}

