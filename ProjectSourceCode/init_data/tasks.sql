CREATE TABLE Tasks (
    TaskID SERIAL PRIMARY KEY,
    EmployeeName VARCHAR(100),
    TaskName VARCHAR(100),
    TaskDescription TEXT,
    TaskStatus VARCHAR(50)
);
