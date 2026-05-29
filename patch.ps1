$dbPath = "backend\db.json"
$json = Get-Content -Raw $dbPath -Encoding utf8
$db = $json | ConvertFrom-Json

# Check if student10 exists
$exists = $false
foreach ($u in $db.users) {
    if ($u.username -eq "student10") {
        $exists = $true
        break
    }
}

if (-not $exists) {
    # Add new users
    $u8 = New-Object PSObject -Property @{ id=8; username='student8'; password='student123'; role='student'; name='Arjun Verma'; batch='Class 8' }
    $u9 = New-Object PSObject -Property @{ id=9; username='student9'; password='student123'; role='student'; name='Riya Singh'; batch='Class 9' }
    $u10 = New-Object PSObject -Property @{ id=10; username='student10'; password='student123'; role='student'; name='Karan Patel'; batch='Class 10' }
    
    $db.users += $u8
    $db.users += $u9
    $db.users += $u10

    # Add assignedBatch to existing exams
    foreach ($ex in $db.exams) {
        if (-not $ex.PSobject.Properties.Match('assignedBatch').Count) {
            $ex | Add-Member -MemberType NoteProperty -Name "assignedBatch" -Value "All Batches"
        }
    }

    # Add exam-4
    $exam4 = New-Object PSObject -Property @{
        id = 'exam-4'
        title = 'Class 10 Physics - Light Reflection & Refraction'
        subject = 'Physics'
        assignedBatch = 'Class 10'
        durationMinutes = 5
        totalMarks = 20
        passingMarks = 10
        description = 'Mock test for Class 10 board preparation.'
        questions = @(
            New-Object PSObject -Property @{
                id = 'q1'
                questionText = 'The focal length of a plane mirror is:'
                options = @('Zero', 'Negative', 'Positive', 'Infinity')
                correctOption = 3
                marks = 10
                solutionExplanation = 'The focal length of a plane mirror is infinity as parallel rays of light reflecting off a plane mirror do not actually converge at any point.'
            },
            New-Object PSObject -Property @{
                id = 'q2'
                questionText = 'Which mirror is used as a rear-view mirror in vehicles?'
                options = @('Concave', 'Convex', 'Plane', 'Cylindrical')
                correctOption = 1
                marks = 10
                solutionExplanation = 'Convex mirrors are used in vehicles because they always form an erect, virtual, and diminished image, providing a wider field of view.'
            }
        )
    }
    $db.exams += $exam4

    # Add dpq-3
    $dpq3 = New-Object PSObject -Property @{
        id = 'dpq-3'
        questionText = 'A car travels 100 km in 2 hours. What is its average speed?'
        subject = 'Physics'
        options = @('40 km/h', '50 km/h', '60 km/h', '100 km/h')
        correctOption = 1
        date = '2026-05-26'
        homeworkForBatch = 'Class 8'
        solutionExplanation = 'Speed = Distance / Time = 100 / 2 = 50 km/h.'
    }
    $db.dpqs += $dpq3

    $jsonOut = $db | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $dbPath), $jsonOut, [System.Text.Encoding]::UTF8)
    Write-Host "Database patched successfully."
} else {
    Write-Host "Database already patched."
}
