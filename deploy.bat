@echo off
setlocal enabledelayedexpansion
title MinMax Workout - Push und Deploy

set "PROJEKT_ORDNER=C:\Users\roman\Desktop\AI Projekte\Trainings-App"
set "BRANCH=claude/training-documentation-app-pl65iu"

echo ============================================
echo   MinMax Workout - Push und Deploy
echo ============================================
echo.

cd /d "%PROJEKT_ORDNER%"
if errorlevel 1 (
    echo FEHLER: Ordner nicht gefunden:
    echo %PROJEKT_ORDNER%
    echo.
    pause
    exit /b 1
)

echo Arbeite in: %CD%
echo.

REM Pruefen, ob ueberhaupt Aenderungen vorliegen
git status --porcelain > "%TEMP%\minmax_gitstatus.tmp"
set "GITSTATUS="
set /p GITSTATUS=<"%TEMP%\minmax_gitstatus.tmp"
del "%TEMP%\minmax_gitstatus.tmp"

if "%GITSTATUS%"=="" (
    echo Keine Aenderungen gefunden - nichts zu committen.
    echo.
    pause
    exit /b 0
)

echo Gefundene Aenderungen:
echo ----------------------------------------------
git status --short
echo ----------------------------------------------
echo.

set "COMMIT_MSG="
set /p COMMIT_MSG="Commit-Nachricht eingeben (leer = automatische Nachricht): "
if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=Aktualisierung vom %date% %time%"
)

echo.
echo Fuege Aenderungen hinzu...
git add -A

echo Erstelle Commit: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo.
    echo FEHLER beim Commit. Siehe Meldung oben.
    echo.
    pause
    exit /b 1
)

echo.
echo Push zu GitHub (Branch: %BRANCH%)...
git push origin %BRANCH%
if errorlevel 1 (
    echo.
    echo FEHLER beim Push. Pruefe Internetverbindung und GitHub-Anmeldung.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Erfolgreich gepusht!
echo   GitHub Pages baut automatisch neu.
echo   In 1-2 Minuten verfuegbar unter:
echo   https://kandello.github.io/Trainingsplan/
echo.
echo   Tipp: Auf dem Handy die App danach einmal
echo   komplett schliessen und neu oeffnen, damit
echo   der Service Worker das Update laedt.
echo ============================================
echo.
pause
