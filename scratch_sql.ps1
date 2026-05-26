$connString = "Server=192.168.1.93,1433;Database=hrmQtech_db;User Id=bless_user;Password=Bless@2025!;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT COUNT(*) FROM hrmQt_Employee"
$count = $cmd.ExecuteScalar()
Write-Host "Employees Count: $count"

$cmd.CommandText = "SELECT name FROM sys.tables"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host $reader["name"]
}
$conn.Close()
