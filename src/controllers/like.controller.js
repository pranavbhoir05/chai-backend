import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const videoExists = await Video.findById(videoId)
    if(!videoExists) {
        throw new ApiError(404, "Video not found")
    }

    //check if like already exists
    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        video: videoId
    })

    if(existingLike) {
        await existingLike.deleteOne()
        return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Like removed successfully")
        )
    }

    // Creating a new like
    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id           
    })
    
    return res
        .status(201)
        .json(
            new ApiResponse(201, newLike, "Video liked successfully")
        )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    const commentExists = await Comment.findById(commentId)
    if(!commentExists) {
        throw new ApiError(404, "Comment not found")
    }

    //check if like already exists
    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId
    })

    if(existingLike) {
        await existingLike.deleteOne()

        return res
        .status(200)
        .json(
            new ApiResponse(200,null, "Like removed successfully")
        )
    }

        // Creating a new like
    const newLike = await Like.create({
        comment: commentId,        //this comment field is from the like model
        likedBy: req.user._id               
    })

    return res
        .status(201)
        .json(
            new ApiResponse(201, newLike, "Comment liked successfully")
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweetExists = await Tweet.findById(tweetId);
    if (!tweetExists) {
        throw new ApiError(404, "Tweet not found");
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        tweet: tweetId
    });
     if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, null, "Like removed successfully")
        );
    }

    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, newLike, "Tweet liked successfully")
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    //We only want videos liked by the logged-in user
    const likedVideos = await Like.aggregate([
        {
            $match: {                                // Match liked videos by the userid and video field
                likedBy: new mongoose.Types.ObjectId(req.user._id),     //coverting the user id to ObjectId
                 video: {$exists: true}                //this ensueres that we only get videos which have been liked (ignores likes for comments or tweets)
            }
        },
        { 
            $lookup: {                       
                from: "videos",         // Tells MongoDB to join with the videos collection.
                localField: "video",    // Uses the video field from the Like document.
                foreignField: "_id",   // Matches it with the _id field in the videos collection.
                as: "videoDetails"      
            }
        },{
            $addFields:{
                video :{$first: "$videoDetails"}        // Takes the first element of the video array.
            }                                           //Converts video from an array into a single object.
                                                        //If there’s no match in videos, this becomes null.
        },{
            $match:{
                video: { $ne: null}                  // Ensures that only likes with valid video details are returned.
            }
        }
    ])

    if(likedVideos.length === 0) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, [], "No liked videos found")
            )
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}