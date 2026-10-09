$ErrorActionPreference = "Stop"
# 1. Establish Landlord Session
$loginSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginRes = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/auth/login" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body '{"email":"feeza@example.com","password":"password123"}' -WebSession $loginSession
Write-Host "Logged in as landlord: $($loginRes.name)"
# 2. Extract JWT cookie
$cookieUri = New-Object System.Uri("http://127.0.0.1:5000")
$jwtCookie = $loginSession.Cookies.GetCookies($cookieUri)["jwt"]
if (-not $jwtCookie) {
    Write-Error "Failed to obtain JWT cookie."
    exit
}
# 3. Create dummy image in current working folder
$testImagePath = Join-Path (Get-Location) "test_property.jpg"
$dummyJpegBytes = [byte[]]@(
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
    0x00, 0xBF, 0x80, 0xFF, 0xD9
)
[System.IO.File]::WriteAllBytes($testImagePath, $dummyJpegBytes)
# 4. Construct Multipart Request
Add-Type -AssemblyName System.Net.Http
$handler = New-Object System.Net.Http.HttpClientHandler
$cookieContainer = New-Object System.Net.CookieContainer
$cookieContainer.Add($cookieUri, (New-Object System.Net.Cookie("jwt", $jwtCookie.Value)))
$handler.CookieContainer = $cookieContainer
$client = New-Object System.Net.Http.HttpClient($handler)
$form = New-Object System.Net.Http.MultipartFormDataContent
$form.Add((New-Object System.Net.Http.StringContent("Modern Studio Apartment")), "title")
$form.Add((New-Object System.Net.Http.StringContent("Fully furnished flat with high-speed internet.")), "description")
$form.Add((New-Object System.Net.Http.StringContent("35000")), "price")
$form.Add((New-Object System.Net.Http.StringContent("F-1 Kotli Road, Mirpur")), "address")
$form.Add((New-Object System.Net.Http.StringContent("[73.7516, 33.1484]")), "coordinates")
$fileBytes = [System.IO.File]::ReadAllBytes($testImagePath)
$fileContent = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/jpeg")
$form.Add($fileContent, "images", "test_property.jpg")
# 5. Dispatch Request
Write-Host "Uploading listing with image..."
$response = $client.PostAsync("http://127.0.0.1:5000/api/listings", $form).Result
$responseBody = $response.Content.ReadAsStringAsync().Result
Write-Host "HTTP Status:" $response.StatusCode
Write-Host "Response Body:" $responseBody
# 6. Cleanup
Remove-Item -Path $testImagePath -Force -ErrorAction SilentlyContinue
