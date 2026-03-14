import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const Project = new mongoose.Schema(
    {
        global_admin: { type: mongoose.Schema.Types.ObjectId, ref: "user"},//{type: mongoose.Schema.Types.ObjectId, ref: "user"//},
        creationdate: {
            type: Date,
            default: Date.now
        },
        name: String,
        description: String,
        project_admin: [{ type: mongoose.Schema.Types.ObjectId, ref: "user"}], //{ type: mongoose.Schema.Types.ObjectId, ref: "user"}]
        members: [{type: mongoose.Schema.Types.ObjectId, ref: "user"}], //[{ type: mongoose.Schema.Types.ObjectId, ref: "user"}],
        // members are the viewers 
        boards: [{ type: mongoose.Schema.Types.ObjectId, ref: "board" }],
        creationtime: Date,
        updatedat: Date,
    }
);

const projectData = mongoose.model('project', Project);
export default projectData;