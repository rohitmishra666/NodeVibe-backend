import mongoose, { Schema, Types } from "mongoose";

const playlistSchema = new Schema({
    name: {
        type: String,
        req: true
    },
    description: {
        type: String,
        required: true
    },
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

export const Playlist = mongoose.model("Playlist", playlistSchema)