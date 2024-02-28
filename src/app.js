import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//app.use() is used for middlewares, configurations
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

// data from form
app.use(express.json({ limit: "20kb" }));

// data from URL
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

//temporarily keep files on own server (public folder)
app.use(express.static("public"));

// access , edit, add cookies of user browser from server
app.use(cookieParser());


//routes 
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter)


export { app };
