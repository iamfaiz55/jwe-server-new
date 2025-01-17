const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const bodyParser= require("body-parser")
const socketIO = require("socket.io")
const http = require("http")
const morgan = require("morgan")
const cookieparser = require("cookie-parser")
const useragent = require("express-useragent")
// const useragent = require("express-rate")
const { adminProtected } = require("./middlewares/admin.protected")
// const { userProtected } = require("./middlewares/userProtected")
const User = require("./models/User")
const { userProtected } = require("./middlewares/userProtected")
const { redisClient } = require("./utils/redisClient")

require("dotenv").config()

const app = express()
const server = http.createServer(app)
redisClient.on('connect', async () => {
  console.log('Redis Connected');
  try {
      await redisClient.set('test-key', 'test-value');
      const value = await redisClient.get('test-key');
      console.log('Test Redis fetch:', value); // Should log: 'test-value'
  } catch (err) {
      console.error('Test Redis operation failed:', err);
  }
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MONGO CONNECTED")
  })
  .catch((err) => {
    console.error("Failed to connect ", err)
  });
app.use((req, res, next) => {
    req.io = io
    next()
});
  
  
app.use(express.json())
app.use(bodyParser.json({ limit: "10mb" })); // For JSON data
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }))
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieparser())
app.use(useragent.express())

const importantLogFormat = ":method :url :status :response-time ms"
const mobileLogPath = path.join(__dirname, "logs", "mobile.log")
const computerLogPath = path.join(__dirname, "logs", "computer.log");
const mobileLogStream = fs.createWriteStream(mobileLogPath, { flags: "a" })
const computerLogStream = fs.createWriteStream(computerLogPath, { flags: "a" })

app.use((req, res, next) => {
  const userAgent = req.useragent
  const logStream =
    userAgent.isMobile || userAgent.isTablet ? mobileLogStream : computerLogStream

  morgan(importantLogFormat, { stream: logStream })(req, res, next)
})

app.use(morgan("dev"))

app.use("/api/adminAuth", require("./routers/admin.auth.routes"))
app.use("/api/userAuth", require("./routers/user.auth.routes"))
app.use("/api/admin", adminProtected, require("./routers/admin.routes"))
app.use("/api/user",  require("./routers/user.routes"))
app.use("/api/open", require("./routers/open.routes"))

app.use("*", (req, res)=> {
    res.status(404).json({message:"Resource not Found"})
})
// app.use((err, req, res, next) => {
//   if (err.type === "entity.too.large") {
//       return res.status(413).json({ message: "Payload too large. Please reduce the file size." });
//   }
//   next(err);
// });

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});
const io = socketIO(server, {
  cors: {
    origin:true,
    credentials: true,
  },
});

let onlineUsers = [];

function removeUserBySocketId(socketId) {
  onlineUsers = onlineUsers.filter(user => user.socketId !== socketId);
}

function isUserOnline(userId) {
  return onlineUsers.some(user => user.userId === userId);
}

io.on("connection", (socket) => {
  // console.log("A user connected:", socket.id);

  socket.on("login", async (userId) => {
    // console.log(`User ${userId} connected `);

    const user = await User.findById(userId);

    if (user && !isUserOnline(userId)) {
      onlineUsers.push({  socketId: socket.id, ...user._doc })
    }

    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    removeUserBySocketId(socket.id);

    io.emit("onlineUsers", onlineUsers);
  });
// ------------------------------------------------------------------------------


  let adminSocketId = null; 

  socket.on("registerAdminMobile", () => {
    adminSocketId = socket.id
    console.log("socket id",adminSocketId);
    
  });
  app.use((req, res, next) => {
    req.adminId = adminSocketId;
    next();
  });

  socket.on("mobileLoginResponse", (data) => {
    const { accept, email } = data;

    if (accept) {
        console.log("Admin login ")
        io.emit("loginApproved", { success: true, email })        
    } else {
        console.log("Admin login rejected");
        io.emit("loginRejected", { success: false });
    }
  });


});



mongoose.connection.once("open", () => {
  server.listen(process.env.PORT, () => {
    console.log(`SERVER RUNNING`);
  });
});

