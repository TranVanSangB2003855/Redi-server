const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  cookieSession({
    name: "redi-session",
    secret: "COOKIE_SECRET", // should use as secret environment variable
    httpOnly: true
  })
);

app.get("/", (res, req) => {
  req.json({ message: "Welcome to Redi Chat App." });
})

require('./app/routes/auth.route')(app);

app.use((err, req, res, next) => {
  // Middleware xử lý lỗi tập trung.
  // Trong các đoạn code xử lý ở các route, gọi next(error)
  // sẽ chuyển về middleware xử lý lỗi này
  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
});

function getTime() {
  let today = new Date();
  let date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
  let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let dateTime = time + ' ' + date;
  return dateTime;
}

// Socket.io cho Chat với người lạ
const serverForChatWithStranger = require('http').createServer(app);
const ioChatWithStranger = require("socket.io")(serverForChatWithStranger, {
  cors: {
    origins: "*",
    credentials: true
  },
});
let countChatRoom = -1;

const getClientRoomStranger = (preRoom, id) => {
  let i = 0;
  let nameChatRoom = "";
  console.log("id", id);
  for (i = 0; i <= countChatRoom; i++) {
    nameChatRoom = ('stranger-chat-room-' + i).toString();
    if (nameChatRoom === preRoom) continue;
    if (ioChatWithStranger.sockets.adapter.rooms.get(nameChatRoom) && ioChatWithStranger.sockets.adapter.rooms.get(nameChatRoom).size == 1) {
      const members = ioChatWithStranger.sockets.adapter.rooms.get(nameChatRoom);
      for (const member of members) {
        if (member === id) {
          break;
        }
        else return nameChatRoom;
      }
      continue;
    }
  }

  return ('stranger-chat-room-' + (++countChatRoom)).toString();
}

ioChatWithStranger.on('connection', (socket) => {
  let preRoom = "";
  let clientRoom = getClientRoomStranger(preRoom, socket.id);
  console.log("clientRoom: " + clientRoom + ".....");
  socket.join(clientRoom);

  socket.on("nextRoomStranger", data => {
    preRoom = data;
    console.log("preRoom: " + preRoom + "......");
    ioChatWithStranger.in(preRoom).emit('statusRoomStranger', {
      content: 'NextRoomNextRoomNgười lạ đã rời đi. Đang đợi người lạ ...',
      createAt: getTime()
    });
    socket.leave(preRoom);
    clientRoom = getClientRoomStranger(preRoom, socket.id);
    console.log("clientRoomNew: " + clientRoom + ".....");
    socket.join(clientRoom);
    if (ioChatWithStranger.sockets.adapter.rooms.get(clientRoom).size < 2) {//.length < 2) {
      ioChatWithStranger.in(clientRoom).emit('statusRoomStranger', {
        content: 'Đang đợi người lạ ...',
        createAt: getTime()
      });
    } else {
      ioChatWithStranger.in(clientRoom).emit('statusRoomStranger', {
        content: 'Người lạ đã vào phòng|' + clientRoom,
        createAt: getTime()
      });
    }
  })

  if (ioChatWithStranger.sockets.adapter.rooms.get(clientRoom).size < 2) {//.length < 2) {
    ioChatWithStranger.in(clientRoom).emit('statusRoomStranger', {
      content: 'Đang đợi người lạ ...',
      createAt: getTime()
    });
  } else {
    ioChatWithStranger.in(clientRoom).emit('statusRoomStranger', {
      content: 'Người lạ đã vào phòng|' + clientRoom,
      createAt: getTime()
    });
  }

  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
    socket.to(clientRoom).emit('statusRoomStranger', {
      content: 'Người lạ đã rời đi. Đang đợi người lạ kế tiếp ...',
      createAt: getTime()
    });
  });

  socket.on('sendMessageStranger', function (message, callback) {
    socket.to(clientRoom).emit('receiveMessageStranger', {
      ...message,
      createAt: getTime()
    });

    callback({
      "status": "ok",
      "createAt": getTime()
    })
  })
});

serverForChatWithStranger.listen(3001, () => {
  console.log('listening on *:3001');
});

// Socket.io cho người có tài khoản Chat
const serverForUserChat = require('http').createServer(app);

const ioForUserChat = require("socket.io")(serverForUserChat, {
  cors: {
    origins: "*",
    credentials: true
  },
});

ioForUserChat.on('connection', (socket) => {
  // Các xử lý sự kiện khi người dùng đăng nhập thành công gồm: 
  //  - Gửi thông tin đã online đến những người đã kết bạn (chung room)
  //  - Gửi yêu cầu kết bạn/ Nhập yêu cầu kết bạn (có lưu vào CSDL)
  //  - Gửi/nhận tin nhắn với bạn bè (có lưu vào CSDL)
  //  - Khi disconnect thì cập nhật lastAccess của user tương ứng trong CSDL
})

serverForUserChat.listen(3002, () => {
  console.log('listening on *:3002');
});

module.exports = app