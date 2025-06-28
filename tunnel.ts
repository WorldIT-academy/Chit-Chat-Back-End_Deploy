import { Client, ConnectConfig } from "ssh2";
import net, { Server, Socket } from "net";

interface Tunnel {
  conn: Client;
  server: Server;
}

export const createTunnel = (): Promise<Tunnel> => {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on("ready", () => {
      const server = net.createServer((localSocket: Socket) => {
        conn.forwardOut(
          localSocket.remoteAddress || "0.0.0.0",
          localSocket.remotePort || 0,
          "worlditAcademy.mysql.pythonanywhere-services.com",
          3306,
          (err, stream) => {
            if (err) {
              console.error("❌ Ошибка форварда:", err);
              localSocket.end();
              return;
            }

            localSocket.pipe(stream).pipe(localSocket);
          }
        );
      });

      server.on("error", (error: Error) => {
        console.error("❌ Ошибка сервера туннеля:", error);
        reject(error);
      });

      server.listen(3307, "0.0.0.0", () => {
        console.log("✅ SSH-туннель открыт на 0.0.0.0:3307");
        resolve({ conn, server });
      });
    });

    conn.on("error", (err: Error) => {
      console.error("❌ SSH-туннель ошибка:", err);
      reject(err);
    });

    const config: ConnectConfig = {
      host: "ssh.pythonanywhere.com",
      port: 22,
      username: "worlditAcademy",
      password: "2025_Django",
      algorithms: {
        serverHostKey: ["ssh-rsa", "rsa-sha2-256", "rsa-sha2-512"],
      },
    };

    conn.connect(config);
  });
};

