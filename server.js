const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: false
    }
});

app.use(express.json());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false
}));

// client connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // userId join
    socket.on('join-user-topic', (userId) => {
        console.log(`User ${socket.id} joined user topic: ${userId}`);
        socket.join(`user:${userId}`);
    });

    // shopId join
    socket.on('join-shop-topic', (shopId) => {
        console.log(`User ${socket.id} joined shop topic: ${shopId}`);
        socket.join(`shop:${shopId}`);
    });

    // create new order and send noti
    socket.on('new-order', (orderData) => {
        console.log('New order received:', orderData);

        const { userId, shopId, orderId } = orderData;

        // send to userId
        io.to(`user:${userId}`).emit('order-notification', `Your order (ID: ${orderId}) is being processed`);

        // send to shopId
        io.to(`shop:${shopId}`).emit('order-notification', `New order (ID: ${orderId}) from user: ${userId}`);
    });

    // client disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.post('/order', (req, res) => {
    const orderData = req.body;
    console.log('Order received:', orderData);

    const { userId, shopId, orderId } = orderData;

    // Send noti to user and shop in room
    io.to(`user:${userId}`).emit('order-notification', `Your order (ID: ${orderId}) is being processed`);
    io.to(`shop:${shopId}`).emit('order-notification', `New order (ID: ${orderId}) from user: ${userId}`);

    res.status(200).send('Order received and notifications sent');
});
app.get('/hello', (req, res) => {
    res.status(200).send('Hello, world!');
});

const PORT = process.env.PORT || 8888;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
