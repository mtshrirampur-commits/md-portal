$dbPath = "backend\db.json"
$json = Get-Content -Raw $dbPath -Encoding utf8
$db = $json | ConvertFrom-Json

# 1. Update exams assigned to "All Batches" to "JEE Advanced 2026"
foreach ($ex in $db.exams) {
    if ($ex.assignedBatch -eq 'All Batches') {
        $ex.assignedBatch = 'JEE Advanced 2026'
    }
}

# 2. Update dpqs assigned to "All Batches" to "JEE Advanced 2026"
foreach ($d in $db.dpqs) {
    if ($d.homeworkForBatch -eq 'All Batches') {
        $d.homeworkForBatch = 'JEE Advanced 2026'
    }
}

# 3. Add MHT-CET student if not exists
$exists = $false
foreach ($u in $db.users) {
    if ($u.username -eq "mhtcet") {
        $exists = $true
        break
    }
}

if (-not $exists) {
    $u11 = New-Object PSObject -Property @{ id=11; username='mhtcet'; password='student123'; role='student'; name='Aditya Deshmukh'; batch='MHT-CET 2026' }
    $db.users += $u11
}

$jsonOut = $db | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $dbPath), $jsonOut, [System.Text.Encoding]::UTF8)
Write-Host "Database strict isolation patched successfully."
