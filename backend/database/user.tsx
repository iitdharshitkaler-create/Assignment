import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const User = new mongoose.Schema(
    {
        name: String,
        email: String,
        password: String,
        avatar: String,
        projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "project" }],
        projectAdmin: [{ type: mongoose.Schema.Types.ObjectId, ref: "project" }],
        projectMember: [{type: mongoose.Schema.Types.ObjectId, ref: "project" }],
        projectViewer: [{type: mongoose.Schema.Types.ObjectId, ref: "project" }],
        notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "notification"}],
    }
)

const userData = mongoose.model('user', User); 

export default userData;