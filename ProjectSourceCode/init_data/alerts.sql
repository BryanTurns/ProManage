CREATE TABLE alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    message VARCHAR(200) NOT NULL,
    organization VARCHAR(50) NOT NULL
);
