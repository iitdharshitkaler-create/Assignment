import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const User = new mongoose.Schema(
    {
        name: String,
        email: String,
        password: String,
        avatar: String,
        projects: [{
            type: mongoose.Schema.Types.ObjectId, ref: "project"
        }],
    }
)

const userData = mongoose.model('user', User); 

export default userData;