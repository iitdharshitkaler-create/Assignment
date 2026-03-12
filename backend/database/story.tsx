import mongoose from "mongoose"

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