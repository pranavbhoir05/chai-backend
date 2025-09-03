import mongoose ,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"  

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pageparsed = parseInt(page)
    const limitparsed = parseInt(limit)
    const skip = (pageparsed - 1) * limitparsed

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }  
    
    const comments = await Comment.aggregate([
        {
            $match: {video: new mongoose.Types.ObjectId(videoId)} 
        },
        {
            $lookup: {
                from: "users",
                localField:"owner",
                foreignField: "_id",
                as: "owner"
            }
        },{
            $addFields:{
                owner:{$first: "$owner"}
            }
        },{
            $sort: {createdAt: -1}
        },
        {
            $skip: skip
        },
        {
            $limit: limitparsed
        },
        {

            $project: {
                content: 1,
                createdAt: 1,
                "$owner._id": 1,
                "$owner.username": 1,
                "$owner.avatar": 1
                   
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            comments,
            "Comments retrieved successfully",
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a videolets
    const {videoId} = req.params
    const {content} = req.body

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if(!content || !content.trim()) {
        throw new ApiError(400, "Content cannot be empty")
    }

    // Check if the video exists
    const videoExists = await Video.findById(videoId)
    if(!videoExists) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })
    
    return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            comment,
            "Comment added successfully",
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    if(!content || !content.trim()) {
        throw new ApiError(400, "Content cannot be empty")
    }

    // Check if the comment exists and if the user is the owner
    // Fetch comment first for ownership check
    const commentExists = await Comment.findById(commentId)
    if(!commentExists) {
        throw new ApiError(404, "Comment not found")
    }

     if (commentExists.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to edit this comment");
    }
     //comment.owner and req.user._id  both contain the same user ID — but from different sources

    //Mongoose ObjectIds are objects, not strings.You cannot directly compare two ObjectIds with ===.
    //req.user is authenticated by verifyToken middleware

    comment.content = content;  // Update the field in the fetched comment document
    await comment.save();       // Save the updated comment


    //comment.content = content
// This means:
//                Update the "content" field of the comment document 
//               with the new "content" value from req.body.
//So it’s basically:  
//              [document field] = [new value]



    //Why not findByIdAndUpdate?
// With findByIdAndUpdate, you skip ownership check unless you first fetch the comment.
// You might accidentally let other users update comments they don't own.
    // const comment = await Comment.findByIdAndUpdate(
    //     commentId,
    //     {
    //         $set : {content}
    //     },
    //     {new: true}
    // )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            comment,
            "Comment updated successfully",
        )
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const commentExists = await Comment.findById(commentId)
    if(!commentExists) {
        throw new ApiError(404, "Comment not found")
    }

    if(commentExists.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    await commentExists.deleteOne()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            null,
            "Comment deleted successfully",
        )
    )   
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }