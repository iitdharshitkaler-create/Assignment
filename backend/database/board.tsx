import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const Board = new mongoose.Schema({
    projectname: { type: mongoose.Schema.Types.ObjectId, ref: "project"},
    stories: [ { type: mongoose.Schema.Types.ObjectId, ref: "story" } ],
    columns: [{ 
        name: String, 
        tasks:[ { type: mongoose.Schema.Types.ObjectId, ref: "task" } ]
    }],
    transitions: { type: Object, default: {} },
    wipLimits:   { type: Object, default: {} }   // the new field
});

const boardData = mongoose.model('board', Board);
export default boardData;