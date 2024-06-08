import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"
import { User } from "../models/user.model.js"

const getAllVideos = asyncHandler(async (req, res) => {

    const allVideos = await Video.aggregate([
        {
            $match: {
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "result",
            }
        },
        {
            $addFields: {
                result: { $first: "$result" },
            }
        },
        {
            $addFields: {
                username: "$result.username",
                avatar: "$result.avatar",
                ownerId: "$result._id",
                fullName: "$result.fullName"
            }
        },
        {
            $project: {
                result: 0
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    if (!allVideos) {
        throw new ApiError(404, "No videos found!!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { allVideos }, "All videos found!!"))
})

const searchVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, query = "abc", sortBy = "createdAt", sortType = -1 } = req.body
    //TODO: get all videos based on query, sort, pagination

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortType }
    }

    const video = await Video.aggregate([
        {
            $search: {
                index: "title_text",
                text: {
                    query: query,
                    path: ["title", "description"],
                    fuzzy: {}
                }
            }
        },
        {
            $project: {
                title: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                owner: 1,
                isPublished: 1,
                createdAt: 1,
                description: 1
            }
        }
    ], options)

    if (!video) {
        throw new ApiError(404, "No videos found!!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { video }, "Videos found!!"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const { videoFile, thumbnail } = req.files
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(422, "Title and description are required!!")
    }

    if (!videoFile || !thumbnail) {
        throw new ApiError(423, "Video file and thumbnail are required!!")
    }

    const localVideoPath = videoFile[0]?.path
    const localThumbnailPath = thumbnail[0]?.path
    console.log(localVideoPath, "local Video path");
    console.log(localThumbnailPath, "local Thumbnail path");

    const videoUrl = await uploadOnCloudinary(localVideoPath)
    const thumbnailUrl = await uploadOnCloudinary(localThumbnailPath)

    console.log(videoUrl, "cloudinary response");
    if (!videoUrl || !thumbnailUrl) {
        throw new ApiError(500, "Failed to upload video or thumbnail on cloudinary!!")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUrl.url,
        thumbnail: thumbnailUrl.url,
        duration: videoUrl.duration,
        owner: req.user?._id,
        isPublished: true
    })

    if (!video) {
        throw new ApiError(456, "Failed to create video!!")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { video }, "Video published successfully!! "))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId.createFromHexString(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [
                                new mongoose.Types.ObjectId(req.user?._id),
                                "$likes.likedBy"
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "result",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCnt: {
                                $size: "$subscribers"
                            },
                            ifSubcribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            new mongoose.Types.ObjectId(req.user?._id),
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            },
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            ifSubcribed: 1,
                            subscribersCnt: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                temp: { $first: "$result" },
                title: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                isPublished: 1,
                createdAt: 1,
                description: 1,
                views: 1,
                likesCount: 1,
                owner: 1,
                isLiked: 1,
            }
        },
        {
            $addFields: {
                ifSubscribed: "$temp.ifSubcribed",
                subscribersCnt: "$temp.subscribersCnt",
                username: "$temp.username",
                avatar: "$temp.avatar",
            }
        },
        {
            $project: {
                temp: 0
            }
        }
    ])

    if (!video) {
        throw new ApiError(404, "Video not found!")
    }

    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    })

    const watchHistory = await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { video }, "Video found"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const { thumbnail } = req.files

    // console.log(thumbnail, "thumbnail")

    if (!isValidObjectId(videoId)) {
        throw new ApiError(421, "Invalid video id!")
    }

    if (!title || !description) {
        throw new ApiError(422, "Title and description are required!")
    }

    if (!thumbnail) {
        throw new ApiError(423, "Thumbnail is required!")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found!")
    }

    if (req.user?._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "You are not authorized to update this video!")
    }

    const localPath = thumbnail[0]?.path
    const updatedThumbnail = await uploadOnCloudinary(localPath)

    //TODO: delete old thumbnail from cloudinary
    await deleteOnCloudinary(video.thumbnail)

    if (!updatedThumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail!")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        title,
        description,
        thumbnail: updatedThumbnail.url
    }, { new: true })

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { updatedVideo }, "Video updated successfully! "))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!req.user) {
        throw new ApiError(401, "Please login and pass authorisation to delete video!")
    }

    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(421, "Invalid video id")
    }

    const video = await Video.findById(videoId);

    if (req.user?._id.toString() !== video.owner.toString()) {
        console.log(video.owner.toString());
        console.log(req.user?._id.toString());
        throw new ApiError(401, "Unauthorized to delete this video!")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(500, "Failed to delete video!")
    }

    //TODO:- delete video from cloudinary
    // console.log(deletedVideo.videoFile);

    const temp = deletedVideo.videoFile.lastIndexOf('/')
    const publicIdOfVideo = deletedVideo.videoFile.slice(temp + 1, deletedVideo.videoFile.lastIndexOf('.'))


    const temp2 = deletedVideo.thumbnail.lastIndexOf('/')
    const publicIdOfThumbnail = deletedVideo.thumbnail.slice(temp2 + 1, deletedVideo.thumbnail.lastIndexOf('.'))

    const videoUrl = await deleteOnCloudinary(publicIdOfVideo, "video")
    const thumbnailUrl = await deleteOnCloudinary(publicIdOfThumbnail)

    return res
        .status(200)
        .json(new ApiResponse(200, { deletedVideo }, "Video deleted successfully! "))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(421, "Invalid video id!")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found!")
    }

    if (req.user?._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "You are not authorized to update this video!")
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
    togglePublishStatus,
    searchVideos
}
