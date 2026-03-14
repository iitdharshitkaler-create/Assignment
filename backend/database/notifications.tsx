import mongoose from "mongoose"
mongoose.connect("mongodb://127.0.0.1:27017/project6")

const Notification = new mongoose.Schema(
    {
        Message: String,
        sendto: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
        sendfrom: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
        task: { type: mongoose.Schema.Types.ObjectId, ref: "task"},
        board: { type: mongoose.Schema.Types.ObjectId, ref: "board"},
        project: { type: mongoose.Schema.Types.ObjectId, ref: "project"},
        story: { type: mongoose.Schema.Types.ObjectId, ref: "story"},
        date: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
    }
);

const notificationData = mongoose.model('notification', Notification);
export default notificationData;