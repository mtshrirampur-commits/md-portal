$dbPath = "backend\db.json"
$json = Get-Content -Raw $dbPath -Encoding utf8
$db = $json | ConvertFrom-Json

$q1 = @{
    id = 'q1'
    questionText = 'The focal length of a plane mirror is:'
    options = @('Zero', 'Negative', 'Positive', 'Infinity')
    correctOption = 3
    marks = 10
    solutionExplanation = 'The focal length of a plane mirror is infinity as parallel rays of light reflecting off a plane mirror do not actually converge at any point.'
}

$q2 = @{
    id = 'q2'
    questionText = 'Which mirror is used as a rear-view mirror in vehicles?'
    options = @('Concave', 'Convex', 'Plane', 'Cylindrical')
    correctOption = 1
    marks = 10
    solutionExplanation = 'Convex mirrors are used in vehicles because they always form an erect, virtual, and diminished image, providing a wider field of view.'
}

foreach ($ex in $db.exams) {
    if ($ex.id -eq 'exam-4') {
        $ex.questions = @($q1, $q2)
    }
}

$jsonOut = $db | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $dbPath), $jsonOut, [System.Text.Encoding]::UTF8)
Write-Host "exam-4 questions patched successfully."
