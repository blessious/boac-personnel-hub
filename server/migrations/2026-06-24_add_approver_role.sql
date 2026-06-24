ALTER TABLE users
  MODIFY role ENUM('Admin', 'HR', 'Approver', 'Employee', 'Viewer') NOT NULL;
