Param(
  [string]$Root = "app-web"
)

Write-Host "Normalizando acentos corrompidos em: $Root" -ForegroundColor Cyan

$files = Get-ChildItem -Recurse -File $Root -Include *.html,*.ts,*.scss

# Mapeamento de substituições (adicione mais se necessário)
$repls = @{
  'Autentica��ǜo' = 'Autenticação'
  'usuǭrio'       = 'usuário'
  'usu�rio'       = 'usuário'
  'sessǜo'        = 'sessão'
  'a��es'         = 'ações'
  'Atalhos rǭpidos' = 'Atalhos rápidos'
  'catǭlogo'      = 'catálogo'
  'Cartǜo'        = 'Cartão'
  'Hist��rico'     = 'Histórico'
  'Mǭximo'        = 'Máximo'
  'unitǭrios'     = 'unitários'
  'lan��amento'   = 'lançamento'
  'lan��amentos'  = 'lançamentos'
  'Pǭgina'        = 'Página'
  'Pr��xima'      = 'Próxima'
  'invǭlido'      = 'inválido'
  'an��nimo'      = 'anônimo'
  'c��digo'       = 'código'
  'posi��ǜo'      = 'posição'
  'botǜo'         = 'botão'
  's�'            = 'só'
  'est�'          = 'está'
  'nǜo'           = 'não'
  'intera��ǜo'    = 'interação'
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$count = 0
foreach ($f in $files) {
  $raw = Get-Content -Raw $f.FullName
  $orig = $raw
  foreach ($k in $repls.Keys) {
    $raw = $raw -replace [regex]::Escape($k), [string]$repls[$k]
  }
  if ($raw -ne $orig) {
    [IO.File]::WriteAllText($f.FullName, $raw, $utf8NoBom)
    Write-Host "Corrigido:" $f.FullName
    $count++
  }
}

Write-Host "Arquivos atualizados:" $count -ForegroundColor Green

# Relatório de pendências (caso ainda haja caracteres de substituição)
$left = @()
foreach ($f in $files) {
  $raw = Get-Content -Raw $f.FullName
  if ($raw -match "�|ǭ|ǜ") { $left += $f.FullName }
}
if ($left.Count -gt 0) {
  Write-Warning "Ainda há ocorrências suspeitas nestes arquivos:" 
  $left | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
} else {
  Write-Host "Nenhuma ocorrência suspeita restante (�, ǭ, ǜ)." -ForegroundColor Green
}

