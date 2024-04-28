import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortType }
    }

    const pipeline = [
        {
            $match: {
                title: {
                    $regex: new RegExp(query, "i")
                }
            }
        }
    ];

    const video = await Video.aggregatePaginate({ pipeline }, options)

    if (!video) {
        throw new ApiError(404, "No videos found!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { video }, "Videos found! "))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const { videoFile, thumbnail } = req.files
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(422, "Title and description are required")
    }

    if (!videoFile || !thumbnail) {
        throw new ApiError(423, "Video file and thumbnail are required")
    }

    const localVideoPath = videoFile[0].path
    const localThumbnailPath = thumbnail[0].path

    const videoUrl = await uploadOnCloudinary(localVideoPath)
    const thumbnailUrl = await uploadOnCloudinary(localThumbnailPath)

    if (!videoUrl || !thumbnailUrl) {
        throw new ApiError(500, "Failed to upload video or thumbnail on cloudinary")
    }

    const video = new Video.create({
        title,
        description,
        videoFile: videoUrl.url,
        thumbnail: thumbnailUrl.url,
        duration: videoUrl.duration,
        owner: req.user?._id,
        isPublished: true
    })

    if (!video) {
        throw new ApiError(456, "Failed to create video")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { video }, "Video published successfully! "))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, { video }, "Video found"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body
    const { thumbnail } = req.file

    if (!isValidObjectId(videoId)) {
        throw new ApiError(421, "Invalid video id")
    }

    if (!title || !description) {
        throw new ApiError(422, "Title and description are required")
    }

    if (!thumbnail) {
        throw new ApiError(423, "Thumbnail is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found! ")
    }

    if (req.user?._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const localPath = req.file.path

    //TODO: delete old thumbnail from cloudinary

    const updatedThumbnail = await uploadOnCloudinary(localPath)

    if (!updatedThumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail")
    }

    const updatedVideo = await Video.findByIdAndUpdate({
        title,
        description,
        thumbnail: updatedThumbnail.url
    }, { new: true })

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { updatedVideo }, "Video updated successfully! "))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(421, "Invalid video id")
    }

    const video = await Video.findById(videoId);

    if (!req.user?._id.toString() !== video.owner.toString()) {
        throw new ApiError(401, "Unauthorized to delete this video")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(500, "Failed to delete video")
    }

    //TODO:- delete video from cloudinary

    return res
        .status(200)
        .json(new ApiResponse(200, { deletedVideo }, "Video deleted successfully! "))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(421, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (req.user?._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, { isPublished: !video.isPublished }, { new: true })

    if (!updatedVideo) {
        throw new ApiError(425, "Failed to update the publish status!")
    }

    return res
        .status(200)
        .json(new ApiResponse(209, { publishStatus: updatedVideo?.isPublished }, "Publish status updated successfully! "))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
