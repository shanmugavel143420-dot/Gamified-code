import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Matchmaking State
  const queues = {
    "1v1": [] as { socketId: string; userId: string; rank: string }[],
    "2v2": [] as { socketId: string; userId: string; rank: string }[],
    "4v4": [] as { socketId: string; userId: string; rank: string }[],
  };
  const activeRooms = new Map<string, any>();

  app.use(express.json());

  // Code Execution Endpoint (Judge0 API)
  app.post("/api/execute", async (req, res) => {
    const { source_code, language_id, stdin } = req.body;

    try {
      const submissionResponse = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": process.env.VITE_RAPIDAPI_KEY || "YOUR_RAPIDAPI_KEY",
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code,
          language_id,
          stdin,
        }),
      });
      
      const result = await submissionResponse.json();
      res.json(result);
    } catch (error) {
      console.error("Execution error:", error);
      res.status(500).json({ error: "Execution failed", details: error });
    }
  });
  
  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinQueue", ({ userId, rank, mode }) => {
      const queue = queues[mode as keyof typeof queues];
      if (!queue) return;
      
      queue.push({ socketId: socket.id, userId, rank });
      console.log(`User ${userId} joined ${mode} queue. Queue size: ${queue.length}`);

      const playersNeeded = parseInt(mode[0]) * 2;
      if (queue.length >= playersNeeded) {
        const players = queue.splice(0, playersNeeded);
        const roomId = `match_${mode}_${Date.now()}`;
        
        const roomData = {
          id: roomId,
          mode,
          players: players.map((p, i) => {
            const team = i < playersNeeded / 2 ? 1 : 2;
            return { ...p, team, ready: true };
          }),
          round: 1,
          totalRounds: 3,
          scores: { team1: 0, team2: 0 },
          gameState: "playing",
          startTime: Date.now(),
        };

        activeRooms.set(roomId, roomData);

        roomData.players.forEach((p) => {
          io.to(p.socketId).emit("matchFound", { roomId, mode, opponent: "Team " + (p.team === 1 ? 2 : 1) });
        });
      }
    });

    socket.on("createCustomRoom", ({ userId, username, config }) => {
      const roomId = `room_${Math.random().toString(36).substring(7)}`;
      const roomData = {
        id: roomId,
        hostId: userId,
        mode: config.mode || "1v1",
        difficulty: config.difficulty || "medium",
        timePerRound: config.timePerRound || 300,
        totalRounds: config.totalRounds || 3,
        players: [{ socketId: socket.id, userId, username, team: 1, ready: false }],
        gameState: "lobby",
        scores: { team1: 0, team2: 0 },
        round: 1,
      };
      
      socket.join(roomId);
      activeRooms.set(roomId, roomData);
      socket.emit("roomCreated", roomId);
      io.to(roomId).emit("roomUpdate", roomData);
    });

    socket.on("joinCustomRoom", ({ roomId, userId, username }) => {
      const room = activeRooms.get(roomId);
      if (room && room.gameState === "lobby") {
        const playersNeeded = parseInt(room.mode[0]) * 2;
        if (room.players.length < playersNeeded) {
          socket.join(roomId);
          const team = room.players.filter((p: any) => p.team === 1).length < playersNeeded / 2 ? 1 : 2;
          room.players.push({ socketId: socket.id, userId, username, team, ready: false });
          io.to(roomId).emit("roomUpdate", room);
        } else {
          socket.emit("error", "Room is full");
        }
      } else {
        socket.emit("error", "Room not found or already started");
      }
    });

    socket.on("toggleReady", ({ roomId, userId }) => {
      const room = activeRooms.get(roomId);
      if (room) {
        const player = room.players.find((p: any) => p.userId === userId);
        if (player) {
          player.ready = !player.ready;
          io.to(roomId).emit("roomUpdate", room);
        }
      }
    });

    socket.on("startMatch", ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (room && room.hostId) {
        const allReady = room.players.every((p: any) => p.ready);
        if (allReady) {
          room.gameState = "playing";
          room.startTime = Date.now();
          io.to(roomId).emit("matchStarted", room);
        } else {
          socket.emit("error", "Not all players are ready");
        }
      }
    });

    socket.on("kickPlayer", ({ roomId, targetUserId }) => {
      const room = activeRooms.get(roomId);
      if (room && room.hostId) {
        const host = room.players.find((p: any) => p.userId === room.hostId);
        if (host && host.socketId === socket.id) {
          const playerIndex = room.players.findIndex((p: any) => p.userId === targetUserId);
          if (playerIndex !== -1) {
            const kickedPlayer = room.players.splice(playerIndex, 1)[0];
            io.to(kickedPlayer.socketId).emit("kicked");
            io.to(roomId).emit("roomUpdate", room);
          }
        }
      }
    });

    socket.on("nextRound", ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (room && room.round < room.totalRounds) {
        room.round += 1;
        io.to(roomId).emit("roomUpdate", room);
      }
    });

    socket.on("invitePlayer", ({ roomId, targetUserId, inviterName }) => {
      // In a real app, we'd find the socket ID of targetUserId
      // For this demo, we'll broadcast it to everyone (not ideal, but works for simulation)
      io.emit("incomingInvite", { roomId, inviterName, targetUserId });
    });

    socket.on("codeUpdate", ({ roomId, code, userId }) => {
      socket.to(roomId).emit("opponentCode", { userId, code });
    });

    socket.on("chatMessage", ({ roomId, message, username }) => {
      io.to(roomId).emit("newMessage", { username, message });
    });

    socket.on("reaction", ({ roomId, emoji, userId }) => {
      socket.to(roomId).emit("opponentReaction", { userId, emoji });
    });

    // WebRTC Signaling
    socket.on("signal", ({ roomId, to, signal }) => {
      io.to(to).emit("signal", { from: socket.id, signal });
    });

    socket.on("disconnect", () => {
      Object.values(queues).forEach((q) => {
        const index = q.findIndex((p) => p.socketId === socket.id);
        if (index !== -1) q.splice(index, 1);
      });
      
      activeRooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex((p: any) => p.socketId === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            activeRooms.delete(roomId);
          } else {
            io.to(roomId).emit("roomUpdate", room);
          }
        }
      });
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
