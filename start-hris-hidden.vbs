Option Explicit

Dim shell
Dim fso
Dim projectRoot
Dim scriptPath
Dim command

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

projectRoot = fso.GetParentFolderName(WScript.ScriptFullName)
scriptPath = projectRoot & "\scripts\start-laragon-hris.ps1"

If Not fso.FileExists(scriptPath) Then
  WScript.Quit 1
End If

command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File " & _
  Quote(scriptPath) & " -ProjectRoot " & Quote(projectRoot)

shell.Run command, 0, False

Function Quote(value)
  Quote = Chr(34) & value & Chr(34)
End Function
