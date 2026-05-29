$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Full-Stack Server running at http://localhost:8080/"

$dbPath = Join-Path (Get-Location) "backend\db.json"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        $method = $request.HttpMethod
        
        # Route API requests
        if ($localPath.StartsWith("/api/")) {
            $response.ContentType = "application/json; charset=utf-8"
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
            
            # Handle Preflight OPTIONS request
            if ($method -eq "OPTIONS") {
                $response.StatusCode = 200
                $response.Close()
                continue
            }
            
            # Helper to read DB
            function Read-Db {
                if (Test-Path $dbPath) {
                    $json = Get-Content -Raw $dbPath -Encoding utf8
                    return $json | ConvertFrom-Json
                }
                return @{ users=@(); exams=@(); results=@(); dpqs=@(); dpq_attempts=@(); pyps=@() }
            }
            
            # Helper to write DB
            function Write-Db($dbObj) {
                $json = $dbObj | ConvertTo-Json -Depth 10
                [System.IO.File]::WriteAllText($dbPath, $json, [System.Text.Encoding]::UTF8)
            }
            
            try {
                if ($localPath -eq "/api/users" -and $method -eq "GET") {
                    $db = Read-Db
                    $resData = ConvertTo-Json -InputObject @($db.users) -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/users" -and $method -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $newUser = $body | ConvertFrom-Json
                    
                    if (-not $newUser.id) {
                        $newUser.id = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    }
                    
                    $db = Read-Db
                    $db.users = @($db.users) + @($newUser)
                    Write-Db $db
                    
                    $resData = $newUser | ConvertTo-Json -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath.StartsWith("/api/users/") -and $method -eq "DELETE") {
                    $idStr = $localPath.Substring(11)
                    $id = [int64]$idStr
                    $db = Read-Db
                    
                    $newUsers = @()
                    $deletedUser = $null
                    foreach ($u in $db.users) {
                        if ($u.id -eq $id) {
                            $deletedUser = $u
                        } else {
                            $newUsers += $u
                        }
                    }
                    
                    if ($deletedUser -ne $null) {
                        $db.users = $newUsers
                        Write-Db $db
                        $resData = $deletedUser | ConvertTo-Json -Depth 10
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    } else {
                        $response.StatusCode = 404
                    }
                }
                elseif ($localPath -eq "/api/exams" -and $method -eq "GET") {
                    $db = Read-Db
                    $resData = ConvertTo-Json -InputObject @($db.exams) -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/exams" -and $method -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $newExam = $body | ConvertFrom-Json
                    
                    if (-not $newExam.id) {
                        $newExam.id = "exam-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    }
                    
                    $db = Read-Db
                    $db.exams = @($newExam) + @($db.exams)
                    Write-Db $db
                    
                    $resData = $newExam | ConvertTo-Json -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath.StartsWith("/api/exams/") -and $method -eq "DELETE") {
                    $id = $localPath.Substring(11)
                    $db = Read-Db
                    
                    $newExams = @()
                    $deletedExam = $null
                    foreach ($e in $db.exams) {
                        if ($e.id -eq $id) {
                            $deletedExam = $e
                        } else {
                            $newExams += $e
                        }
                    }
                    
                    if ($deletedExam -ne $null) {
                        $db.exams = $newExams
                        Write-Db $db
                        $resData = $deletedExam | ConvertTo-Json -Depth 10
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    } else {
                        $response.StatusCode = 404
                    }
                }
                elseif ($localPath -eq "/api/results" -and $method -eq "GET") {
                    $db = Read-Db
                    $resData = ConvertTo-Json -InputObject @($db.results) -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/results" -and $method -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $newResult = $body | ConvertFrom-Json
                    
                    if (-not $newResult.id) {
                        $newResult.id = "res-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    }
                    
                    $db = Read-Db
                    $db.results = @($newResult) + @($db.results)
                    Write-Db $db
                    
                    $resData = $newResult | ConvertTo-Json -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/dpqs" -and $method -eq "GET") {
                    $db = Read-Db
                    $resData = ConvertTo-Json -InputObject @($db.dpqs) -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/dpqs" -and $method -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $newDpq = $body | ConvertFrom-Json
                    
                    if (-not $newDpq.id) {
                        $newDpq.id = "dpq-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    }
                    
                    $db = Read-Db
                    $db.dpqs = @($newDpq) + @($db.dpqs)
                    Write-Db $db
                    
                    $resData = $newDpq | ConvertTo-Json -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath.StartsWith("/api/dpqs/") -and $method -eq "DELETE") {
                    $id = $localPath.Substring(10)
                    $db = Read-Db
                    
                    $newDpqs = @()
                    $deletedDpq = $null
                    foreach ($d in $db.dpqs) {
                        if ($d.id -eq $id) {
                            $deletedDpq = $d
                        } else {
                            $newDpqs += $d
                        }
                    }
                    
                    if ($deletedDpq -ne $null) {
                        $db.dpqs = $newDpqs
                        Write-Db $db
                        $resData = $deletedDpq | ConvertTo-Json -Depth 10
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    } else {
                        $response.StatusCode = 404
                    }
                }
                elseif ($localPath -eq "/api/dpq_attempts" -and $method -eq "GET") {
                    $db = Read-Db
                    $attempts = $db.dpq_attempts
                    if (-not $attempts) { $attempts = @() }
                    $resData = ConvertTo-Json -InputObject @($attempts) -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/dpq_attempts" -and $method -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $newAttempt = $body | ConvertFrom-Json
                    
                    if (-not $newAttempt.id) {
                        $newAttempt.id = "dpq-att-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    }
                    
                    $db = Read-Db
                    if (-not $db.dpq_attempts) {
                        $db.dpq_attempts = @()
                    }
                    $db.dpq_attempts = @($newAttempt) + @($db.dpq_attempts)
                    Write-Db $db
                    
                    $resData = $newAttempt | ConvertTo-Json -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/pyps" -and $method -eq "GET") {
                    $db = Read-Db
                    $pyps = $db.pyps
                    if (-not $pyps) { $pyps = @() }
                    $resData = ConvertTo-Json -InputObject @($pyps) -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/pyps" -and $method -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $newPyp = $body | ConvertFrom-Json
                    
                    if (-not $newPyp.id) {
                        $newPyp.id = "pyp-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    }
                    
                    $db = Read-Db
                    if (-not $db.pyps) {
                        $db.pyps = @()
                    }
                    $db.pyps = @($newPyp) + @($db.pyps)
                    Write-Db $db
                    
                    $resData = $newPyp | ConvertTo-Json -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath.StartsWith("/api/pyps/") -and $method -eq "DELETE") {
                    $id = $localPath.Substring(10)
                    $db = Read-Db
                    
                    $newPyps = @()
                    $deletedPyp = $null
                    if ($db.pyps) {
                        foreach ($p in $db.pyps) {
                            if ($p.id -eq $id) {
                                $deletedPyp = $p
                            } else {
                                $newPyps += $p
                            }
                        }
                    }
                    
                    if ($deletedPyp -ne $null) {
                        $db.pyps = $newPyps
                        Write-Db $db
                        $resData = $deletedPyp | ConvertTo-Json -Depth 10
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    } else {
                        $response.StatusCode = 404
                    }
                }
                elseif ($localPath -eq "/api/upload" -and $method -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $uploadData = $body | ConvertFrom-Json
                    
                    $fileName = $uploadData.filename
                    $base64 = $uploadData.data
                    
                    if (-not (Test-Path "uploads")) {
                        New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
                    }
                    
                    $uniqueName = [guid]::NewGuid().ToString() + "_" + $fileName
                    $filePath = Join-Path (Get-Location) "uploads\$uniqueName"
                    
                    if ($base64 -match "^data:.*?;base64,(.*)$") {
                        $base64 = $matches[1]
                    }
                    
                    $bytes = [System.Convert]::FromBase64String($base64)
                    [System.IO.File]::WriteAllBytes($filePath, $bytes)
                    
                    $resObj = @{ url = "/uploads/$uniqueName" }
                    $resData = $resObj | ConvertTo-Json
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/settings" -and $method -eq "GET") {
                    $db = Read-Db
                    $settings = $db.settings
                    if (-not $settings) { $settings = @{} }
                    $resData = ConvertTo-Json -InputObject $settings -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                elseif ($localPath -eq "/api/settings" -and $method -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $newSettings = $body | ConvertFrom-Json
                    
                    $db = Read-Db
                    $db.settings = $newSettings
                    Write-Db $db
                    
                    $resData = $newSettings | ConvertTo-Json -Depth 10
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($resData)
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                else {
                    $response.StatusCode = 404
                }
            } catch {
                $response.StatusCode = 500
                $errMsg = @{ error = $_.Exception.Message } | ConvertTo-Json
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($errMsg)
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }
        else {
            # Serve Static Assets
            $trimPath = $localPath.TrimStart('/')
            if ($trimPath -eq "") { $trimPath = "index.html" }
            
            $filePath = Join-Path (Get-Location) $trimPath
            
            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html; charset=utf-8" }
                    ".js" { $response.ContentType = "application/javascript; charset=utf-8" }
                    ".css" { $response.ContentType = "text/css; charset=utf-8" }
                    ".png" { $response.ContentType = "image/png" }
                    ".jpg" { $response.ContentType = "image/jpeg" }
                    ".jpeg" { $response.ContentType = "image/jpeg" }
                    ".pdf" { $response.ContentType = "application/pdf" }
                    ".doc" { $response.ContentType = "application/msword" }
                    ".docx" { $response.ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
                    default { $response.ContentType = "application/octet-stream" }
                }
                $buffer = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } else {
                $response.StatusCode = 404
            }
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
