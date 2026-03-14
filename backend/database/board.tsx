import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const Board = new mongoose.Schema(
    {
        projectname: { type: mongoose.Schema.Types.ObjectId, ref: "project"},//{type: mongoose.Schema.Types.ObjectId, ref: "user"//},
        stories: [ { type: mongoose.Schema.Types.ObjectId, ref: "story" } ],
        columns: [{ 
            name: String, 
            tasks:[ { type: mongoose.Schema.Types.ObjectId, ref: "task" } ]
        }],
    }
);

const boardData = mongoose.model('board', Board);
export default boardData;