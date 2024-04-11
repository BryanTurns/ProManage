CREATE TABLE alerts (
    user_id VARCHAR(50) PRIMARY KEY,
    message VARCHAR(200) NOT NULL,
    organization VARCHAR(50) NOT NULL
);
