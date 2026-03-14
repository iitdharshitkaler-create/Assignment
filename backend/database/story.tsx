import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const Story = new mongoose.Schema(
    {

        boardname: { type: mongoose.Schema.Types.ObjectId, ref: "board" },//{type: mongoose.Schema.Types.ObjectId, ref: "user"//},
        storyname: String,
        tasks: [ { type: mongoose.Schema.Types.ObjectId, ref: "task" } ],
        status: String,
    }  
);

const storyData = mongoose.model('story', Story);
export default storyData;