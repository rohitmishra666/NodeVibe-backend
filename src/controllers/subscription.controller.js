import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {

    const { channelId } = req.params

    // TODO: toggle subscription
    // check if channel exists

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    // check if subscription exists
    const subscribed = await Subscription.findOne({ channel: channelId, subscriber: req.user?._id });

    console.log(subscribed)

    // if subscription exists, delete it
    if (subscribed) {
        await Subscription.findByIdAndDelete(subscribed._id)
        return res
            .status(200)
            .json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"))
    }

    // if subscription does not exist, create it
    await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id
    })

    // return success response
    return res
        .status(200)
        .json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // check if channel exists
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }
    // get subscribers of the channel
    const subscribers = await Subscription.aggregate([
        {
            $match: { channel: mongoose.Types.ObjectId(channelId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $project: {
                _id: 0,
                subscribers: {
                    _id: 1,
                    name: 1,
                    email: 1
                }
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, "Subscribers", { subscribers }))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    const { subscriberId } = req.params
    // check if user exists
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid user id")
    }

    // get subscribed channels of the user
    const channels = await Subscription.aggregate([
        {
            $match: { subscriber: mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup: {
                from: "channels",
                localField: "channel",
                foreignField: "_id",
                as: "channels"
            }
        },
        {
            $project: {
                _id: 0,
                channels: {
                    _id: 1,
                    name: 1,
                    description: 1
                }
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, "Subscribed channels", { channels }))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}