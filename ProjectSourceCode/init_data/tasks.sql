CREATE TABLE Tasks (
    taskID SERIAL PRIMARY KEY,
    employeeName VARCHAR(100),
    taskName VARCHAR(100),
    taskDescription TEXT,
    taskStatus VARCHAR(50),
    complete BOOLEAN 
);
