import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const Comment = new mongoose.Schema(
    {
        task: { type: mongoose.Schema.Types.ObjectId, ref: "task"},
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
        text: String,
        mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "user"}],
        createdAt: Date,
        updatedAt: Date,
    }
);


const commentData = mongoose.model('comment', Comment);
export default commentData;