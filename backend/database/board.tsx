import mongoose from "mongoose"

const Board = new mongoose.Schema(
    {
        projectname: { type: mongoose.Schema.Types.ObjectId, ref: "project"},//{type: mongoose.Schema.Types.ObjectId, ref: "user"//},
        stories: [ { type: mongoose.Schema.Types.ObjectId, ref: "story" } ],
        todo: [ String ], 
        inprogress: [ String ],
        done: [ String ],
        // later we have to convert these into the task,
    }
);

const boardData = mongoose.model('board', Board);
export default boardData;