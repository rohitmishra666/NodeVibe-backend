import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose"

const createPlaylist = asyncHandler(async (req, res) => {
    
    const { name, description } = req.body

    //TODO: create playlist
    const user = req.user
    console.log(user)
    
    if (!user) {
        throw new ApiError(401, "User Not Found!")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: user?._id
    })

    if (!playlist) {
        throw new ApiError(400, "Failed to create playlist!")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { playlist }, "Playlist created successfully!"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    const userPlaylists = await Playlist.find({ owner: userId })

    if (!userPlaylists) {
        throw new ApiError(404, "No playlists found for this user!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { userPlaylists }, "User playlists fetched successfully!"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    // const playlist = await Playlist.findById(playlistId);
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId.createFromHexString(playlistId)
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    url: 1,
                    thumbnail: 1,
                    duration: 1
                }
            
            }
        }
    ])

    if (!playlist) {
        throw new ApiError(404, "Playlist not found!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { playlist }, "Playlist fetched successfully!"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {

    const { playlistId, videoId } = req.params

    try {
        const playlist = await Playlist.findByIdAndUpdate(playlistId, {
            $push: { videos: videoId }
        }, { new: true })

        if (!playlist) {
            throw new ApiError(400, "Failed to add video to playlist!")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { playlist }, "Video added to playlist successfully!"))

    } catch (error) {
        throw new ApiError(400, "Failed to add video to playlist!", error)
    }

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    try {
        const playlist = await Playlist.findByIdAndUpdate(playlistId, {
            $pull: { videos: videoId }
        }, { new: true })

        if (!playlist) {
            throw new ApiError(400, "Failed to remove video from playlist!")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { playlist }, "Video removed from playlist successfully!"))

    } catch (error) {
        throw new ApiError(400, "Failed to remove video from playlist!", error)
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    
    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Failed to delete playlist!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Playlist deleted successfully!"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
        name,
        description
    }, { new: true })

    if (!playlist) {
        throw new ApiError(400, "Failed to update playlist!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { playlist }, "Playlist updated successfully!"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
