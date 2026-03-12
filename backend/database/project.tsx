import mongoose from "mongoose"

const Project = new mongoose.Schema(
    {
        global_admin: { type: mongoose.Schema.Types.ObjectId, ref: "user"},//{type: mongoose.Schema.Types.ObjectId, ref: "user"//},
        creationdate: {
            type: Date,
            default: Date.now
        },
        name: String,
        description: String,
        project_admin: String, //{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
        members: [ {type: mongoose.Schema.Types.ObjectId, ref: "user"}], //[{ type: mongoose.Schema.Types.ObjectId, ref: "user"}],
        // members are the viewers 
        boards: [{ type: mongoose.Schema.Types.ObjectId, ref: "board" }]
    }
);

const projectData = mongoose.model('project', Project);
export default projectData;