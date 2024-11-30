const http = require('http');
const socket = require('socket.io');

const server = http.createServer();
const io = socket(server, {
    cors: {
        origin: '*'
    }
});

const StatusEnum = {
    CONNECTION: 'connection',
    CONNECTED: 'connected',
    DISCONNECT: 'disconnect',
};

const EventEnum = {
    JOIN: 'join',
    CALL: 'call',
    ACCEPT: 'accept',
    OFFER: 'offer',
    ANSWER: 'answer',
    CANDIDATE: 'candidate',
    DISCONNECTED: 'disconnected',
}

const isString = (param) => (typeof param === 'string');
const isObject = (param) => (typeof param === 'object' && param !== null);

const normalize = (payload) => {
    if(isString(payload)) {
        return { roomId: payload };
    } else if(isObject(payload)) {
        return payload;
    }
    throw Error('参数类型出错');
}

const commonEmit = (event, payload) => {
    const { roomId } = payload;
    io.to(roomId).emit(event, payload);
}

io.on(StatusEnum.CONNECTION, socket => {
    socket.emit(StatusEnum.CONNECTED);

    socket.on(EventEnum.JOIN, roomId => {
        console.log("加入" + roomId + "成功~")
        socket.join(roomId);
    })

    Object.keys(EventEnum).filter(event => EventEnum[event] !== EventEnum.JOIN).forEach(event => {
        socket.on(EventEnum[event], payload => {
            commonEmit(EventEnum[event], normalize(payload))
        })    
    })

    socket.on(StatusEnum.DISCONNECT, () => {
        console.log("客户端断开ws连接~");
    })
})

server.listen(8081, () => {
    console.log("ws服务端运行中...")
})