Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\claude-app"
WshShell.Run "node server.js", 0, False
