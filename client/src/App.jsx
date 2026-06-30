import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

const ROOMS = ["General", "React", "Node.js", "Career", "Random"];

function App() {
  const [username, setUsername] = useState(() => sessionStorage.getItem("chatUsername") || "");
const [room, setRoom] = useState(() => sessionStorage.getItem("chatRoom") || "General");
const [joined, setJoined] = useState(() => sessionStorage.getItem("chatJoined") === "true");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);



  useEffect(() => {
  if (joined && username) {
    socket.emit("join_room", { username, room });
  }
}, []);



  useEffect(() => {
    socket.on("message_history", (history) => {
  setMessages(history);
});

socket.on("receive_message", (data) => {
    setMessages((prev) => [...prev, { ...data, type: "message" }]);
  });

    socket.on("user_joined", (data) => {
      setMessages((prev) => [...prev, { ...data, type: "system" }]);
    });

    socket.on("user_left", (data) => {
      setMessages((prev) => [...prev, { ...data, type: "system" }]);
    });

    socket.on("room_users", (users) => {
      setUsers(users);
    });

    return () => {
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("room_users");
     
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = () => {
  if (!username.trim()) return;
  socket.emit("join_room", { username, room });
  setJoined(true);
  sessionStorage.setItem("chatUsername", username);
  sessionStorage.setItem("chatRoom", room);
  sessionStorage.setItem("chatJoined", "true");
};

  const handleSend = () => {
    if (!message.trim()) return;
    socket.emit("send_message", { message, room });
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">💬</div>
            <h1 className="text-2xl font-bold text-white">ChatSpace</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time group chat</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Your Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter your name..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Choose Room</label>
              <div className="grid grid-cols-3 gap-2">
                {ROOMS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoom(r)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      room === r
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl transition-colors text-sm mt-2"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-sm font-bold text-white">💬 ChatSpace</h1>
          <p className="text-xs text-gray-500 mt-0.5">#{room}</p>
        </div>

        <div className="p-4 flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Online — {users.length}
          </p>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-300">
                  {user.username}
                  {user.username === username && (
                    <span className="text-gray-500"> (you)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {username[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-300">{username}</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">#{room}</h2>
            <p className="text-xs text-gray-500">{users.length} members online</p>
          </div>
          <button
  onClick={() => {
    setJoined(false);
    setMessages([]);
    setUsers([]);
    sessionStorage.removeItem("chatUsername");
    sessionStorage.removeItem("chatRoom");
    sessionStorage.removeItem("chatJoined");
  }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Leave Room
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-600 text-sm mt-20">
              No messages yet. Say hello! 👋
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.type === "system") {
              return (
                <div key={i} className="text-center">
                  <span className="text-xs text-gray-600 bg-gray-800 px-3 py-1 rounded-full">
                    {msg.message}
                  </span>
                </div>
              );
            }

            const isOwn = msg.username === username;

            return (
              <div
                key={i}
                className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {msg.username[0]?.toUpperCase()}
                </div>
                <div className={`max-w-xs lg:max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isOwn && (
                      <span className="text-xs font-medium text-gray-300">
                        {msg.username}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      isOwn
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-gray-800 text-gray-200 rounded-tl-sm"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${room}...`}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-3 rounded-xl transition-colors text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;