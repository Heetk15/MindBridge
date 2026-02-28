# Run this script as Administrator to add firewall rules for LAN access
netsh advfirewall firewall delete rule name="MindBridge8080" 2>$null
netsh advfirewall firewall delete rule name="MindBridge5004" 2>$null
netsh advfirewall firewall delete rule name="MindBridgePing" 2>$null

netsh advfirewall firewall add rule name="MindBridge8080" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="MindBridge5004" dir=in action=allow protocol=TCP localport=5004
netsh advfirewall firewall add rule name="MindBridgePing" dir=in action=allow protocol=ICMPv4

Write-Host "`nFirewall rules added successfully!" -ForegroundColor Green
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
