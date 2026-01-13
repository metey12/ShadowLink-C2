# 🕵️‍♂️ ShadowLink C2 - Gelişmiş Uzaktan Yönetim Aracı

ShadowLink, eğitim amaçlı geliştirilmiş web tabanlı bir **Command & Control (C2)** kontrol panelidir. **ASP.NET Core**, **SignalR** ve **React** teknolojilerini kullanarak gerçek zamanlı sistem izleme ve uzaktan yönetim yeteneklerini sergiler.

![Proje Durumu](https://img.shields.io/badge/Durum-Tamamlandı-success)
![Teknoloji](https://img.shields.io/badge/Stack-FullStack-blue)

## 🚀 Özellikler

### 📡 Gerçek Zamanlı İzleme
- **Canlı Kalp Atışı:** WebSocket üzerinden anlık CPU kullanım takibi.
- **Matrix Dashboard:** Cyberpunk temalı arayüz ve canlı akan grafikler.

### ⚡ Uzaktan Komut Çalıştırma (RCE)
- **Terminal Emülatörü:** Uzaktan CMD komutları gönderin ve yanıtları canlı görün.
- **Görev Yöneticisi:** Çalışan işlemleri listeleyin ve sonlandırın (`kill <pid>`).
- **Dosya İşlemleri:** Hedef bilgisayardan dosya indirin (`download <dosyayolu>`).

### 👁️ Gözetleme
- **Casus Kamera:** Hedef ekranın anlık görüntüsünü (Screenshot) yakalayın.

### 🤡 Eğlence & Trol Modülleri
- **Konuştur:** Hedef bilgisayara metin okutun (Text-to-Speech).
- **URL Aç:** Hedef tarayıcıda istediğiniz web sitesini zorla açın.
- **Sahte Hata:** Ekranda Windows hata mesajı kutusu çıkartın.

## 🛠️ Teknoloji Yığını

* **Backend:** ASP.NET Core, SignalR (WebSockets)
* **Agent:** .NET Worker Service, System.Diagnostics, WinAPI
* **Frontend:** React (Vite), Recharts, Lucide Icons
* **İletişim:** Çift yönlü SignalR Hub

## 📦 Kurulum ve Kullanım

### 1. Projeyi Klonlayın
```bash
git clone [https://github.com/metey12/ShadowLink-C2.git](https://github.com/metey12/ShadowLink-C2.git)
cd ShadowLink-C2
```

### 2. C2 Sunucusunu (Server) Başlatın
```bash
cd Server
dotnet run
# http://localhost:5000 adresinde çalışır
```

### 3. Ajanı (Agent) Başlatın (Hedef Makine)
```bash
cd Agent
dotnet run
# localhost:5000 sunucusuna bağlanır
```

### 4. Paneli (Dashboard) Başlatın
```bash
cd Client
npm install
npm run dev
# Tarayıcıyı verilen adreste açın
```

## ⚠️ Yasal Uyarı
**SADECE EĞİTİM AMAÇLIDIR.**
Bu yazılım, **SignalR** ve **Sistem Programlama** yeteneklerini göstermek amacıyla geliştirilmiştir. Geliştirici, bu programın kötüye kullanımından veya neden olabileceği zararlardan sorumlu değildir. Sahibi olmadığınız bilgisayarlarda kullanmayın.

---
Geliştirici: [Mete Yıldırım](https://mete.wtf)
