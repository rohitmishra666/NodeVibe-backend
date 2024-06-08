import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app = express();

//app.use() is used for middlewares, configurations
app.use(cors({
    origin: true,
    credentials: true
}));

// data from form
app.use(express.json({ limit: "20kb" }));

// data from URL
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

//temporarily keep files on own server (public folder)
app.use(express.static("public"));

// access , edit, add cookies of user browser from server
app.use(cookieParser());

 //HTTP request logger middleware for node.js 
// app.use(morgan("dev"));

//routes
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import searchRouter from "./routes/search.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use('/api/v1/autocomplete-search', searchRouter)

export { app };
