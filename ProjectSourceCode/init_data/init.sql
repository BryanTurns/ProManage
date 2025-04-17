CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  confirmpassword TEXT,
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  branch VARCHAR(100),
  manager BOOLEAN
);