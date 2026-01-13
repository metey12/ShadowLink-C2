using Microsoft.AspNetCore.SignalR;

namespace Server.Hubs;

public class AgentHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"[+] Ajan Online: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"[-] Ajan Offline: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendHeartbeat(string machineName, string cpuUsage)
    {
        await Clients.All.SendAsync("ReceiveHeartbeat", machineName, cpuUsage);
    }

    public async Task SendLog(string log)
    {
        await Clients.All.SendAsync("ReceiveLog", log);
    }

    public async Task DispatchCommand(string command)
    {
        await Clients.All.SendAsync("ReceiveCommand", command);
    }

    public async Task SendScreenshot(string base64Image)
    {
        await Clients.All.SendAsync("ReceiveScreenshot", base64Image);
    }

    public async Task SendProcessList(string processJson)
    {
        await Clients.All.SendAsync("ReceiveProcessList", processJson);
    }
    
    public async Task SendFile(string fileName, string base64Data)
    {
        await Clients.All.SendAsync("ReceiveFile", fileName, base64Data);
    }
}