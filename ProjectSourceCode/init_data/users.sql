CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(200) NOT NULL,
    confirmpassword VARCHAR(200) NOT NULL,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    manager BOOLEAN NOT NULL
);