ALTER TABLE users
  MODIFY role ENUM('Super Admin', 'Admin', 'HR', 'Approver', 'Employee', 'Viewer') NOT NULL;
