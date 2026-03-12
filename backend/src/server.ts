import express, { Request, Response, NextFunction } from "express";
import userData from "../database/user"
import projectData from "../database/project";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import cors from "cors"
import cookieParser from "cookie-parser";
import boardData from "../database/board";
import storyData from "../database/story";
import taskData from "../database/task";
import "../database/task";
const app = express();
const PORT = 3000;

const allowit = {
    origin: "http://localhost:5173",
    methods: "GET, POST, PUT",
    credentials: true,
}
app.use(cors(allowit));
app.use(express.json());
app.use(cookieParser()); 

function isLoggedIn(req: Request  & { user?: unknown }, res: Response, next: NextFunction){
    if(!req.cookies.token) return res.redirect("/");
    try {
        const data = jwt.verify(req.cookies.token, "sh");
        req.user = data;
        next();
    } catch {
        return res.redirect("/login");
    }
}

app.get("/", (req: Request, res: Response) => {
  console.log("Server working");
  res.send("server working")
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

app.post('/logout', (req: Request, res: Response ) => {  // this defines a route 
    res.clearCookie("token");
    res.json({ logout: true });
})

app.post('/loginpage', async (req: Request, res: Response ) => {  // this defines a route 
    const {email, password} = req.body;

    const user = await userData.findOne({email});
    if(!user) return res.status(500).send("User not found");
    bcrypt.compare(password, user.password as string, function(err, result){
        if(result) {
            const token = jwt.sign({email: user.email, userid: user._id}, "sh");
            res.cookie("token", token, { httpOnly: true });
            res.json({ loggedin: true });
        }
        else res.redirect("/loginpage");
    })
});

app.post('/registerpage', async (req: Request, res: Response ) => {  // this defines a route 
    const {name, email, avatar, password } = req.body;
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const user = await userData.create({
                email, avatar, name, password: hash
            });
            const token = jwt.sign({email: user.email, userid: user._id}, "sh");
            res.cookie("token", token);
            res.send("registered"); 
        })
    })
});

interface Request_user extends Request {
  user?: {
    email: string;
    userid: string;
    projects: [];
  };
}

app.post('/createnew', isLoggedIn, async (req: Request_user, res: Response ) => {  // this defines a route 

    const email = (req.user as { email: string }).email;

    console.log("Email from token:", email);
    const user = await userData.findOne({ email: (req.user as { email: string }).email });
    const { name, description, project_admin} = req.body;
    if (!user) { return res.status(400).json({ error: "User not found" }); }

    const project = await projectData.create({
        global_admin: user._id, 
        name,
        description,
        project_admin, //{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
        members: [ user._id ],
        boards: [],
    });
    user.projects.push(project._id);
    await user.save();
    res.json({ created: true });
});

app.get('/projects', isLoggedIn, async (req: Request_user, res: Response) => {
    const user = await userData.findById((req.user as { userid: string }).userid).populate("projects");
    res.json({ projects: user?.projects });
});

app.get('/profile', isLoggedIn, async (req: Request_user, res: Response) => {
    const user = await userData.findById((req.user as { userid: string }).userid).populate("projects");
    res.json({ name: user?.name, avatar: user?.avatar });

});

app.get('/project/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    const project = await projectData.findById(req.params.id);
    const user = await userData.findById(project?.global_admin);
    let name: string | null | undefined = "";
    if(user) name = user.name;
    res.json({ project, name, });
});

app.get('/allusers', async (req: Request, res: Response) => {
    console.log("allusers");
    const userlist = await userData.find({}, "name")
    res.json({ userlist });
});

app.get('/allprojects', async (req: Request, res: Response) => {
    const projectlist = await projectData.find({}, "name")
    res.json({ projectlist });
});

app.post('/addmemberinproject', async (req: Request, res: Response ) => {  // this defines a route 
    console.log("adding member inproject");
    const {choosenuser, project} = req.body;

    const user = await userData.findById( choosenuser );

    const this_project = await projectData.findById(project._id);

    await projectData.findByIdAndUpdate(
            project._id,
        { $addToSet: { members: user?._id } }
        );
    if (!this_project || !user) {
        return res.status(404).json({ error: "Project not found" });
    }
    user.projects.push(project._id); 
    await user.save();
    res.json({ added: true });
});

app.get('/getprojectmembers/:id', async (req: Request, res: Response) => {
    console.log("getting porjectmembers");
    const project = await projectData.findById(req.params.id).populate("members", "name");
    const members = project?.members;
    res.json({ members });
}); 

app.post('/addboardinproject', async (req: Request, res: Response ) => {  // this defines a route 
    const { project } = req.body;
    const board = await boardData.create({
        projectname: project._id,
        stories: [],
        todo: [],
        inprogress: [],
        done: [],
    });

    await projectData.findByIdAndUpdate(
            project._id,
        { $addToSet: { boards: board?._id } }
        );
    res.json({ added: true });
});

app.get('/getprojectboards/:id', async (req: Request, res: Response) => {
    const project = await projectData.findById(req.params.id).populate("boards");
    const boards = project?.boards;
    res.json({ boards });
});

app.post('/putstoryonboard/:id', async (req: Request, res: Response ) => {  // this defines a route 
    console.log("putting story on board");
    const [story, index] = req.body;
    const projectId = req.params.id;
    const project = await projectData.findById(projectId);
    console.log(project);
    if(!project) return res.status(404).json({ error: "Project not found" });
    const boardid = project.boards[Number(index)];
    if(!boardid) return res.status(404).json({ error: "Board not found" });
    const board = await boardData.findById(boardid);
    if (!board) { return res.status(404).json({ error: "Board document missing" }); }
    const this_story = await storyData.create({
        boardname: boardid,
        storyname: story,
        tasks: [],
        status: "todo",
    })
    board.stories.push(this_story._id);
    await board.save();
    res.json({ added: true });
});

app.post('/deleteboard/:id', async (req: Request, res: Response) => {
    const { pos } = req.body;
    const projectId = req.params.id;
    const project = await projectData.findById(projectId);
    if (!project) { return res.status(404).json({ error: "Project not found" }); }
    const boardId = project.boards[Number(pos)];
    if (!boardId) { return res.status(404).json({ error: "Board not found" }); }
    project.boards.splice(Number(pos), 1);
    await project.save();
    await boardData.findByIdAndDelete(boardId);
    res.json({ deleted: true });
});

app.post('/movestoryonboard/:id', async (req: Request, res: Response ) => {  // this defines a route 
    const { boardIndex, storyIndex, from }  = req.body;
    const projectId = req.params.id;
    const project = await projectData.findById(projectId);
    if(!project) return res.status(404).json({ error: "Project not found" });
    const boardid = project.boards[Number(boardIndex)];
    if(!boardid) return res.status(404).json({ error: "Board not found" });
    const board = await boardData.findById(boardid);
    if (!board) { return res.status(404).json({ error: "Board document missing" }); }
    if(from === "todo") {
        if(storyIndex >= board.todo.length) { return res.status(404).json({ error: "Story missing" }); }
        const currstory: string | undefined = board.todo[Number(storyIndex)];
        board.todo.splice(Number(storyIndex), 1);
        board.inprogress.push(currstory as string);
        await board.save();
    } else {
        if(storyIndex >= board.inprogress.length) { return res.status(404).json({ error: "Story missing" }); }
        const currstory: string | undefined = board.inprogress[Number(storyIndex)];
        board.inprogress.splice(Number(storyIndex), 1);
        board.done.push(currstory as string);
        await board.save();
    }
    res.json({ moved: true });
});


app.get('/board/:id/:boardpos', isLoggedIn, async (req: Request_user, res: Response) => {
    const project = await projectData.findById(req.params.id);
    const boardid = await project?.boards[Number(req.params.boardpos)]
    const board  = await boardData.findById(boardid).populate("stories");
    res.json({ project, board });
});

app.get('/story/:storyid/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    const story = await storyData.findById(req.params.storyid).populate("tasks");
    const project = await projectData.findById(req.params.id);
    const projectname = project?.name;
    res.json({ story, projectname });
});



app.post('/addtaskinstory', async (req: Request, res: Response ) => {  // this defines a route 
    console.log("here")
    const { taskname, taskdescription, storyid } = req.body;
    const story = await storyData.findById(storyid);
    if(!story){ return  res.status(404).json({ error: "Document missing" });}
    const boardid = story.boardname;
    if(!boardid) { return  res.status(404).json({ error: "Document missing" }); }
    const task = await taskData.create({
        boardname: boardid,
        storyname: story._id,
        name: taskname,
        description: taskdescription,
        status: "todo",
        dueDate:  "",
        priority: "low",
    });
    story.tasks.push(task._id);
    console.log(story.tasks.length);
    await story.save();
    res.json({ added: true });
});

app.post('/removetaskinstory/:storyid', async (req: Request, res: Response ) => {  // this defines a route 
    const { index } = req.body;
    const story = await storyData.findById(req.params.storyid);
    if(!story){ return  res.status(404).json({ error: "Document missing" });}
    story.tasks.splice(Number(index), 1)
    await story.save();
    res.json({ removed: true });
});

app.post('/updatetask', async (req: Request, res: Response) => {

    const { _id, assigneeid, reporterid, status, priority, dueDate } = req.body;
    console.log(req.body)
    const Auser = await userData.findById(assigneeid);
    const assignee = Auser?.name;
    const Ruser = await userData.findById(reporterid);
    const reporter = Ruser?.name;
    await taskData.findByIdAndUpdate(_id, {
        assigneeid,
        assignee,
        reporterid,
        reporter,
        status,
        priority,
        dueDate
    });

    res.json({ updated: true });
});
