import React, { useState } from 'react';

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(1);
  const [message, setMessage] = useState('');

  const chats = [
    { id: 1, name: 'ฟาร์มโคนมสุขสันต์', lastMsg: 'มูลวัวยังมีอยู่ครับ', time: '10:30', unread: 2, avatar: '🐄' },
    { id: 2, name: 'ฟาร์มไก่ไข่ใหญ่', lastMsg: 'ส่งได้เลยครับ', time: '09:15', unread: 0, avatar: '🐔' },
    { id: 3, name: 'ฟาร์มสุกรเจริญ', lastMsg: 'ราคาพิเศษ 100 บาท', time: 'เมื่อวาน', unread: 1, avatar: '🐷' },
  ];

  const messages = [
    { id: 1, sender: 'them', text: 'สวัสดีครับ สนใจมูลวัวหรือเปล่าครับ', time: '10:00' },
    { id: 2, sender: 'me', text: 'สวัสดีครับ สนใจครับ ตอนนี้มีกี่ถุงครับ', time: '10:15' },
    { id: 3, sender: 'them', text: 'ตอนนี้มี 50 ถุงครับ ราคาถุงละ 150 บาท', time: '10:20' },
    { id: 4, sender: 'me', text: 'เอา 10 ถุงได้ไหมครับ', time: '10:25' },
    { id: 5, sender: 'them', text: 'ได้เลยครับ พรุ่งนี้มารับได้เลย', time: '10:30' },
  ];

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending:', message);
      setMessage('');
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">💬 แชท</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedChat === chat.id ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{chat.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-500">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate">{chat.lastMsg}</p>
                    {chat.unread > 0 && (
                      <span className="bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white p-4 border-b flex items-center gap-3">
          <div className="text-3xl">🐄</div>
          <div>
            <h3 className="font-semibold text-gray-800">ฟาร์มโคนมสุขสันต์</h3>
            <p className="text-sm text-green-600">● ออนไลน์</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender === 'me'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-green-100' : 'text-gray-500'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              ส่ง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
