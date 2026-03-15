import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const Task = new mongoose.Schema(
    {

        boardname: { type: mongoose.Schema.Types.ObjectId, ref: "board" },//{type: mongoose.Schema.Types.ObjectId, ref: "user"//},
        storyname: { type: mongoose.Schema.Types.ObjectId, ref: "story" },
        name: String,
        description: String, 
        assigneeid: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        assignee: String,
        reporterid: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        reporter: String,
        status: String,
        dueDate: String,
        priority: String,
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comment"}],
        tasktype: String,
        createdat: Date,
        updatedat: Date,
        resolvedat: Date,
        closedat: Date,
        auditlog: [ String],
    }
);

const taskData = mongoose.model('task', Task);
export default taskData;