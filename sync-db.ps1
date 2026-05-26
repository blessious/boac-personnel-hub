$connString = "Server=192.168.1.93,1433;Database=hrmQtech_db;User Id=bless_user;Password=Bless@2025!;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "
SELECT 
    id,
    first_name,
    last_name,
    middle_name,
    department_id,
    position_id,
    status_id,
    employment_date,
    birth_date,
    gender,
    email_address,
    contact_number,
    residential_address
FROM hrmQt_Employee
"
$reader = $cmd.ExecuteReader()
$employees = @()

while ($reader.Read()) {
    $emp = @{
        id = $reader["id"].ToString()
        refId = "EMP-" + $reader["id"].ToString()
        firstname = if ([DBNull]::Value.Equals($reader["first_name"])) { "" } else { $reader["first_name"].ToString() }
        lastname = if ([DBNull]::Value.Equals($reader["last_name"])) { "" } else { $reader["last_name"].ToString() }
        middlename = if ([DBNull]::Value.Equals($reader["middle_name"])) { "" } else { $reader["middle_name"].ToString() }
        department = "Human Resource Mgmt. Office" # Map ID to actual string later or hardcode for now
        position = "Administrative Officer V"
        status = "PERMANENT"
        level = "First Level"
        statusClass = "Administrative"
        dateEmployed = if ([DBNull]::Value.Equals($reader["employment_date"])) { "" } else { [datetime]::Parse($reader["employment_date"].ToString()).ToString("yyyy-MM-dd") }
        empStatus = "Employed"
        birthday = if ([DBNull]::Value.Equals($reader["birth_date"])) { "" } else { [datetime]::Parse($reader["birth_date"].ToString()).ToString("yyyy-MM-dd") }
        gender = if ($reader["gender"] -eq $true) { "Male" } else { "Female" }
        civilStatus = "Single"
        citizenship = "Filipino"
        cellphoneNo = if ([DBNull]::Value.Equals($reader["contact_number"])) { "" } else { $reader["contact_number"].ToString() }
        email = if ([DBNull]::Value.Equals($reader["email_address"])) { "" } else { $reader["email_address"].ToString() }
        residentialAddress = if ([DBNull]::Value.Equals($reader["residential_address"])) { "" } else { $reader["residential_address"].ToString() }
    }
    $employees += $emp
}

$conn.Close()

$json = @(,$employees) | ConvertTo-Json -Depth 10
Set-Content -Path "c:\Users\admin\Videos\HRPMIS\src\lib\db-employees.json" -Value $json
Write-Host "Sync complete. Wrote $($employees.Count) employees to db-employees.json"
