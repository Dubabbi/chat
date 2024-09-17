// ES 모듈로 패키지 가져오기
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import moment from 'moment-timezone';

// 시간대 설정
moment.tz.setDefault("Asia/Seoul");

// 익스프레스 앱 생성
const app = express();
const server = createServer(app);
const io = new Server(server);

// 정적 파일 제공 설정
app.use(express.static('public'));

// 클라이언트에 chat.html 전송
app.get('/', function(req, res) {
  res.sendFile(new URL('./chat.html', import.meta.url).pathname);
});

// 소켓 연결 처리
io.on('connection', function(socket) {
  // 클라이언트가 로그인할 때
  socket.on('login', function(data) {
    console.log(`Client logged-in:\n name: ${data.name}\n userid: ${data.userid}\n time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);

    socket.name = data.name;
    socket.userid = data.userid;
    socket.enter_time = moment().format('YYYY-MM-DD HH:mm:ss');

    // 모든 클라이언트에게 로그인 정보 전송
    io.emit('login', {name: socket.name, enter_time: socket.enter_time});
  });

  // 클라이언트가 메시지를 보낼 때
  socket.on('chat', function(data) {
    console.log(`Message from ${socket.name}: ${data.msg} (${moment().format('YYYY-MM-DD HH:mm:ss')})`);

    var msg = {
      from: {
        name: socket.name,
        userid: socket.userid,
        msg_time: moment().format('YYYY-MM-DD HH:mm:ss')
      },
      msg: data.msg
    };

    // 자신을 제외한 모든 클라이언트에게 메시지 전송
    socket.broadcast.emit('chat', {msg: data.msg, name: msg.from.name, msg_time: msg.from.msg_time});
  });

  // 클라이언트가 base64 이미지를 전송할 때
  socket.on('base64', function(data) {
    console.log(`received base64 file from ${socket.name}`);

    var msg = {
      from: {
        name: socket.name,
        userid: socket.userid,
        msg_time: moment().format('YYYY-MM-DD HH:mm:ss')
      },
      msg: data.base64
    };

    // 이미지를 자신을 제외한 모든 클라이언트에게 전송
    socket.broadcast.emit('base64', {msg: data.base64, name: msg.from.name, msg_time: msg.from.msg_time});
  });

  // 클라이언트가 연결을 끊을 때
  socket.on('disconnect', function() {
    console.log(`user disconnected: ${socket.name}`);
  });
});

// 서버 시작
server.listen(3000, () => {
  console.log('Socket IO server listening on port 3000');
});
