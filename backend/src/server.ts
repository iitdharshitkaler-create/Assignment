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
import notificationData from "../database/notifications";
import commentData from "../database/comment";
import "../database/task";
import mongoose from "mongoose";
const app = express();
const PORT = 3000;
// Extended Request interface to include our custom user payload from the JWT
interface Request_user extends Request {
  user?: {
    email: string;
    userid: string;
    projects: [];
  };
}
// CORS configuration to allow the frontend to communicate with this backend and send cookies
const allowit = {
    origin: "http://localhost:5173",
    methods: "GET, POST, PUT",
    credentials: true,
}
app.use(cors(allowit));
app.use(express.json());
app.use(cookieParser());
// Middleware to protect routes: verifies the JWT token stored in cookies
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
// Basic health check route
app.get("/", (req: Request, res: Response) => {
  console.log("Server working");
  res.send("server working")
});



if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  }
// app.listen(PORT, () => {
//   console.log(`Server running on ${PORT}`);
// });
// Clears the auth cookie to log the user out
app.post('/logout', (req: Request, res: Response ) => {  
    res.clearCookie("token");
    res.json({ logout: true });
})
// Handles user login, compares password hashes, and issues a JWT token
app.post('/loginpage', async (req: Request, res: Response ) => {  
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
// Handles new user registration, hashes the password, and logs them in
app.post('/registerpage', async (req: Request, res: Response ) => {  
    console.log("registering");
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
// Creates a new project and sets the creator as the global admin
app.post('/createnew', isLoggedIn, async (req: Request_user, res: Response ) => {  
    const user = await userData.findById((req.user as { userid: string }).userid)
    const { name, description } = req.body;
    if (!user) { return res.status(400).json({ error: "User not found" }); }

    const project = await projectData.create({
        global_admin: user._id, 
        name,
        description,
        project_admin: [ ], 
        members: [ ],
        boards: [],
    });
    user.projects.push(project._id);
    await user.save();
    res.json({ created: true });
});
// Fetches all active (non-archived) projects for the logged-in user
app.get('/projects', isLoggedIn, async (req: Request_user, res: Response) => {
    const user = await userData.findById((req.user as { userid: string }).userid).populate("projects").populate("archivedprojects");;
    const projects = user?.projects;
    const archiveprojects = user?.archivedprojects;
    if(!archiveprojects || !projects){return res.status(400).json({ error: "User not found" }); }
    const filteredProjects = projects.filter((project) => {
        return !archiveprojects.includes(project._id);
    });
    res.json({ projects: filteredProjects, archiveprojects });
});
// Fetches basic profile information for the logged-in user
app.get('/profile', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("profile given")
    const user = await userData.findById((req.user as { userid: string }).userid).populate("projects");
    res.json({_id: user?._id, name: user?.name, avatar: user?.avatar });
});
// Fetches specific project details and determines the user's role (admin, member, viewer)
app.get('/project/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("project details")
    try {
        const project = await projectData.findById(req.params.id);
        const user = await userData.findById((req.user as { userid: string }).userid);
        if(!project || !user){ return res.status(404).json({ error: "Project not found" }); }
        let role = "viewer"
        // Correctly compare string values instead of raw ObjectId references
        if(user._id.toString() === project?.global_admin?.toString()){ 
            role = "global_admin" 
        }
        else if(project.project_admin.some((adminId: any) => adminId.toString() === user._id.toString())){
            role = "project_admin";
        }
        res.json({ project, role });
    } catch (error) {
        console.error("Error fetching project details:", error);
        res.status(500).json({ error: "Server error" });
    }
});
// Updates the project description (restricted to global/project admins)
app.post('/updateprojectdesc/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("updating project description");
    const { description } = req.body;
    const projectId = req.params.id;
    try {
        const project = await projectData.findById(projectId);
        const user = await userData.findById((req.user as { userid: string }).userid);
        if (!project || !user) {
            return res.status(404).json({ error: "Project or user not found" });
        }
        // Authorize: Check if the user is global_admin or project_admin
        const isGlobalAdmin = user._id.toString() === project.global_admin?.toString();
        const isProjectAdmin = project.project_admin.some(
            (adminId: any) => adminId.toString() === user._id.toString()
        );
        if (!isGlobalAdmin && !isProjectAdmin) {
            return res.status(403).json({ error: "Unauthorized to edit description" });
        }
        // Update and save
        project.description = description;
        await project.save();
        res.json({ updated: true, description: project.description });
    } catch (error) {
        console.error("Error updating description:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Fetches a list of all users in the system (used on home/general views)
app.get('/allusersathome', async (req: Request, res: Response) => {
    console.log("allusers");
    const userlist = await userData.find({}, "name");
    res.json({ userlist });
});

// Fetches all users EXCEPT the global admin of the specified project
app.get('/allusers/:id', async (req: Request, res: Response) => {
    console.log("allusers");
    let userlist = await userData.find({}, "name")
    const project = await projectData.findById(req.params.id);
    if(!project) {return res.status(404).json({ error: "Project not found" }); }
    userlist = userlist.filter( (user) => user._id.toString() !== project.global_admin?.toString());
    res.json({ userlist });
});

// Fetches only users explicitly tied to a specific project (members, admins, global admin)
app.get('/projectusers/:id', async (req: Request, res: Response) => {
    try {
        const project = await projectData.findById(req.params.id)
            .populate("members", "name")
            .populate("project_admin", "name");
        if(!project) return res.status(404).json({ error: "Project not found" });
        const globalAdmin = await userData.findById(project.global_admin, "name");
        const usersMap = new Map();
        if (globalAdmin && globalAdmin._id) {
            usersMap.set(globalAdmin._id.toString(), globalAdmin);
        }
        if (project.project_admin) {
            project.project_admin.forEach((admin: any) => {
                if (admin && admin._id && admin.name) usersMap.set(admin._id.toString(), admin);
            });
        }
        if (project.members) {
            project.members.forEach((member: any) => {
                if (member && member._id && member.name) usersMap.set(member._id.toString(), member);
            });
        }
        res.json({ users: Array.from(usersMap.values()) });
    } catch (error) {
        console.error("Error fetching project users:", error); 
        res.status(500).json({ error: "Server error" });
    }
});

// Returns a simple list of all projects in the database
app.get('/allprojects', async (req: Request, res: Response) => {
    const projectlist = await projectData.find({}, "name")
    res.json({ projectlist });
});
// Adds a selected user as a standard member to a specific project
app.post('/addmemberinproject', async (req: Request, res: Response ) => {  
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
    let present = false;
    for(let i = 0; i < user.projects.length; i++){
        const projectid = user.projects[i];
        if(!projectid) continue;
        if(projectid.toString() === project._id.toString()){
            present = true;
            break;
        }
    }
    if(!present){
        user.projects.push(project._id); 
    }
    user.projectViewer.push(project._id);
    await user.save();
    res.json({ added: true });
});
// Gets the list of standard members for a project
app.get('/getprojectmembers/:id', async (req: Request, res: Response) => {
    console.log("getting porjectmembers");
    const project = await projectData.findById(req.params.id).populate("members", "name");
    const members = project?.members;
    res.json({ members });
}); 
// Creates a new Kanban board within a project with default TO-DO/IN-PROGRESS/REVIEW/DONE columns
app.post('/addboardinproject', async (req: Request, res: Response ) => { 
    console.log("addboardinproject");
    const { project } = req.body;
    const board = await boardData.create({
        projectname: project._id,
        stories: [],
        columns: [
            {name: "TO-DO", tasks: [] },
            {name: "IN-PROGRESS", tasks: [] },
            {name: "REVIEW", tasks: [] },
            {name: "DONE", tasks: [] },
        ]
    });
    await projectData.findByIdAndUpdate(
            project._id,
        { $addToSet: { boards: board?._id } }
        );
    res.json({ added: true });
});
// Fetches all boards belonging to a specific project
app.get('/getprojectboards/:id', async (req: Request, res: Response) => {
    console.log("getprojectboards");
    const project = await projectData.findById(req.params.id).populate("boards");
    const boards = project?.boards;
    res.json({ boards });
});
// Creates a new story/epic and attaches it to a specific board
app.post('/putstoryonboard/:id', async (req: Request, res: Response ) => {  
    console.log("putting story on board");
    const [story, index] = req.body;
    const projectId = req.params.id;
    const project = await projectData.findById(projectId);
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
// Deletes a board from a project
app.post('/deleteboard/:id', async (req: Request, res: Response) => {
    console.log("deleteboard");
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
// Handles dragging and dropping a task from one column to another, enforcing WIP limits
app.post('/movetaskonboard', async (req: Request, res: Response) => {
    console.log("movetaskonboard");
    const { boardid, taskid, from, to } = req.body;
    try {
        const board = await boardData.findById(boardid);
        if (!board || !board.columns) { 
            return res.status(404).json({ error: "Board document or columns missing" }); 
        }
        const fromcolumn = board.columns[Number(from)];
        const tocolumn = board.columns[Number(to)];
        if (!tocolumn || !fromcolumn) {
            return res.status(404).json({ error: "Specific columns missing" });
        }
        // Enforce Work-In-Progress limit for the IN-PROGRESS column
        const wipLimits = (board as any).wipLimits || {};
        const limit = wipLimits[String(to)];
        if (limit && limit > 0 && tocolumn.tasks && tocolumn.tasks.length >= limit) {
            return res.json({ error: `WIP limit of ${limit} reached for column "${tocolumn.name}"` });
        }
        // Move the task reference from old column array to new column array
        if (fromcolumn.tasks) {
            fromcolumn.tasks = fromcolumn.tasks.filter((id) => id && id.toString() !== taskid);
        }
        if (tocolumn.tasks) {
            tocolumn.tasks.push(taskid as any);
        }
        board.markModified('columns'); 
        await board.save();
        // Update the task's status field to match the new column
        await taskData.findByIdAndUpdate(taskid, {
            status: tocolumn.name || ""
        });
        // Sync the overarching story status based on the task movement
        const task = await taskData.findById(taskid);
        if (task && task.storyname) {
            const story = await storyData.findById(task.storyname);
            if (story && story.tasks) {
                let minStatus = story.status || "TODO";
                const storyTasks = story.tasks
                    .filter(id => id != null)
                    .map(id => id.toString());
                for (let i = 0; i < board.columns.length; i++) {
                    const currentColumn = board.columns[i];
                    if (!currentColumn || !currentColumn.tasks) continue;
                    const colTasks = currentColumn.tasks
                        .filter(id => id != null)
                        .map(id => id.toString());
                    const taskInThisColumn = storyTasks.some((id) => colTasks.includes(id));
                    if (taskInThisColumn && currentColumn.name) {
                        minStatus = currentColumn.name; 
                        break; 
                    }
                }
                story.status = minStatus;
                await story.save();
            }
        }
        res.json({ moved: true });
    } catch (error) {
        console.error("Error moving task:", error);
        res.status(500).json({ error: "Server error" });
    }
});
// Fetches a specific board's details, columns, and tasks, alongside the user's role
app.get('/board/:id/:boardpos', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("board");
    const project = await projectData.findById(req.params.id);
    const boardid = await project?.boards[Number(req.params.boardpos)]
    const board  = await boardData.findById(boardid).populate("stories").populate("columns.tasks");
    const user = await userData.findById(req.user?.userid);
    if(!user || !project){ return res.status(404).json({ error: "Board document missing" }); }
    let role = "viewer"
    if(user._id.toString() === project?.global_admin?.toString()){ role = "global_admin" }
    else if(project.project_admin.includes(user._id)){
        role = "project_admin";
    }
    res.json({ project, board, role });
});

// Fetches details of a specific story and determines user permission level
app.get('/story/:storyid/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("story");
    const story = await storyData.findById(req.params.storyid).populate("tasks");
    const project = await projectData.findById(req.params.id);
    const projectname = project?.name;
    const user = await userData.findById(req.user?.userid);
    if(!user || !project) {return res.status(404).json({ error: "Board document missing" }); }
    let role = "viewer"
    if(user._id.toString() === project?.global_admin?.toString()){ role = "global_admin" }
    else if(project.project_admin.includes(user._id)){
        role = "project_admin";
    } else if(project.members.includes(user._id)){
        role = "member";
    }
    res.json({ story, projectname, role });
});

// Creates a new task inside a specific story and adds audit log entries
app.post('/addtaskinstory', isLoggedIn, async (req: Request_user, res: Response ) => {  
    console.log("addtaskinstory")
    const { taskname, taskdescription, tasktype, storyid } = req.body;
    console.log(req.body);
    const story = await storyData.findById(storyid);
    if(!story){ return  res.status(404).json({ error: "Document missing" });}
    const boardid = story.boardname;
    const user = await userData.findById(req.user?.userid);
    if(!boardid || !user) { return  res.status(404).json({ error: "Document missing" }); }
    const task = await taskData.create({
        boardname: boardid,
        storyname: story._id,
        name: taskname,
        reporterid: user._id ?? "",
        reporter: user.name ?? "",
        description: taskdescription,
        tasktype: tasktype,
        status: "TODO",
        dueDate: "",
        priority: "low",
        createdat: new Date(),
        updatedat: new Date(),
        auditlog: [`Task created by ${user.name} at ${new Date().toISOString()}`]
    });
    story.tasks.push(task._id);
    await story.save();
    res.json({ added: true });
});

// Removes a task from a story and the board, then syncs the story status
app.post('/removetaskinstory/:storyid', isLoggedIn, async (req: Request, res: Response) => {
    console.log("removetaskinstory");
    try {
        const { index } = req.body;
        const storyId = req.params.storyid as string;
        const story = await storyData.findById(storyId);
        
        if (!story || !story.tasks) return res.status(404).json({ error: "Document missing" });
        
        const taskid = story.tasks[index];
        if (!taskid) return res.status(404).json({ error: "Document missing" });
        
        const board = await boardData.findById(story.boardname);
        if (board && board.columns) {
            for (let i = 0; i < board.columns.length; i++) {
                const column = board.columns[i];
                if (!column || !column.tasks) continue;
                column.tasks = column.tasks.filter(id => id && id.toString() !== taskid.toString());
            }
            board.markModified('columns');
            await board.save();
        }
        
        await taskData.findByIdAndDelete(taskid);
        story.tasks.splice(Number(index), 1);
        await story.save();

        await syncStoryStatus(storyId);

        res.json({ removed: true });
    } catch (error) {
        console.error("Error removing task:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Edits a task's details and triggers notifications if assignees/reporters change
app.post('/updatetask/:id', isLoggedIn, async (req: Request_user, res: Response) => {
  try {
    console.log("doneupadating2");
    const { _id, assigneeid, reporterid, status, priority, dueDate } = req.body;
    const project = await projectData.findById(req.params.id)
    if (!req.user || !project) {  console.log("here1");return res.status(401).json({ error: "Unauthorized" }); }
    const senderId = new mongoose.Types.ObjectId(req.user.userid);
    const task = await taskData.findById(_id);
    const story = await storyData.findById(task?.storyname);
    if (!task || !story) { return res.status(404).json({ error: "Task not found" }); }
    const Auser = await userData.findById(assigneeid);
    const Ruser = await userData.findById(reporterid);
    if (!Auser || !Ruser) {
      return res.status(404).json({ error: "User not found" });
    }
    const assignee = Auser.name;
    const reporter = Ruser.name;
    const assigneeChanged = task.assigneeid?.toString() !== assigneeid;
    const reporterChanged = task.reporterid?.toString() !== reporterid;
    
    // Perform update
    await taskData.findByIdAndUpdate(_id, {
      assigneeid,
      assignee,
      reporterid,
      reporter,
      status,
      priority,
      dueDate
    });
    
    if(!task){return }
    
    // Handle notification for assignee changes
    if (assigneeChanged) {
        let present = false;
        for(let i = 0; i < Auser.projectMember.length; i++){
            const projectid = Auser.projectMember[i];
            if(!projectid) continue;

            if(projectid.toString() === project._id.toString()){
                present = true;
                break;
            }
        }
        if(!present){
        const message = await notificationData.create({
            Message: `You are assigned ${task.name} in story ${story.storyname} of project ${project.name}`,
            sendto: Auser._id,
            sendfrom: senderId,
            task: task._id,
            board: task.boardname ?? null,
            story: task.storyname ?? null,
            project: null,
            date: new Date(),
            read: false
        });
        Auser.notifications.push(message._id)
        Auser.projectMember.push(project._id)
        await Auser.save();}
    } else {

        const message = await notificationData.create({
            Message: `Details of  ${task.name} in ${story.storyname} are updated`,
            sendto: Auser._id,
            sendfrom: senderId,
            task: task._id,
            board: task.boardname ?? null,
            story: task.storyname ?? null,
            project: null,
            date: new Date(),
            read: false
        });
        Auser.notifications.push(message._id)
        Auser.projectMember.push(project._id)
        await Auser.save();
    }
    
    // Handle notification for reporter changes
    if (reporterChanged) {
        const message = await notificationData.create({
            Message: `You are now reporter of${task.name} in ${story.storyname} of project ${project.name}`  ,
            sendto: Auser._id,
            sendfrom: senderId,
            task: task._id,
            board: task.boardname ?? null,
            story: task.storyname ?? null,
            project: null,
            date: new Date(),
            read: false
        }); 
        console.log(message.Message)
        Ruser.notifications.push(message._id)
        Ruser.projectMember.push(project._id)
        await Ruser.save();
    } else {
        const message = await notificationData.create({
            Message: `Details of  ${task.name} in ${story.storyname} are updated`,
            sendto: Auser._id,
            sendfrom: senderId,
            task: task._id,
            board: task.boardname ?? null,
            story: task.storyname ?? null,
            project: null,
            date: new Date(),
            read: false
        });
        console.log(message.Message)
        Ruser.notifications.push(message._id)
        Ruser.projectMember.push(project._id)
        await Ruser.save();
    }

    res.json({ updated: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Helper function: Recalculates and updates a story's overarching status based on where its tasks are on the board
async function syncStoryStatus(storyId: string) {
    try {
        const story = await storyData.findById(storyId);
        if (!story) return;

        const board = await boardData.findById(story.boardname);
        if (!board || !board.columns || board.columns.length === 0) return;

        let minStatus = board.columns[0]?.name || "TODO";

        if (story.tasks && story.tasks.length > 0) {
            const storyTaskIds = story.tasks.map(id => id.toString());

            for (let i = 0; i < board.columns.length; i++) {
                const currentColumn = board.columns[i];
                if (!currentColumn || !currentColumn.tasks) continue;

                const colTasks = currentColumn.tasks.map((id: any) => id.toString());
                const hasTask = storyTaskIds.some(id => colTasks.includes(id));
                
                if (hasTask && currentColumn.name) {
                    minStatus = currentColumn.name;
                    break; 
                }
            }
        }

        await storyData.updateOne({ _id: storyId }, { $set: { status: minStatus } });
    } catch (error) {
        console.error("Error syncing status:", error);
    }
}

// Places a story's tasks into the first column of the board
app.post('/addstorytoboard', async (req: Request, res: Response) => {
    console.log("addstorytoboard");
    const { storyid } = req.body;
    
    try {
        const story = await storyData.findById(storyid).populate("tasks");
        if (!story) return res.status(404).json({ error: "Story not found" });
        
        const board = await boardData.findById(story.boardname);
        if (!board || !board.columns || board.columns.length === 0) {
            return res.status(404).json({ error: "Board not found or missing columns" });
        }
        
        const tasks = story.tasks as any[]; 
        const firstColumnName = board.columns[0]?.name || "TODO";
        let tasksAdded = false;

        for (const task of tasks) {
            let present = false;
            for (let i = 0; i < board.columns.length; i++) {
                const column = board.columns[i];
                if (!column || !column.tasks) continue;
                if (column.tasks.some((id: any) => id.toString() === task._id.toString())) {
                    present = true;
                    break;
                }
            }
            
            if (!present) {
                board.columns[0]?.tasks.push(task._id);
                tasksAdded = true;
                await taskData.findByIdAndUpdate(task._id, { status: firstColumnName });
            }
        }
        
        if (tasksAdded) {
            board.markModified('columns');
            await board.save();
        }

        await syncStoryStatus(storyid);

        res.json({ added: true });
    } catch (error) {
        console.error("Error adding story to board:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Fetches all notifications for the logged-in user
app.get('/getnotifications/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("getting notificaitons");
    const user = await userData.findById(req.params.id).populate("notifications");
    const notifications  = user?.notifications;
    res.json({ notifications });
});

// Fetches all comments for a specific task and populates the user and mention data
app.get('/taskcomments/:taskid', isLoggedIn, async (req,res)=>{
    const { taskid } = req.params;
    const task = await taskData
        .findById(taskid)
        .populate({
            path: "comments",
            populate: [
                { path: "user" },
                { path: "mentions" }
            ]
        });
    if(!task){
        return res.status(404).json({ error: "Task not found" });
    }
    res.json({ comments: task.comments });
});

// Posts a new comment to a task and triggers notifications for mentioned users
app.post('/addcomment', isLoggedIn, async (req: Request_user ,res: Response)=>{
    console.log("addingcomment")
    const { taskid, text, mentions } = req.body
    if(!req.user){ return res.status(401).json({ error: "Unauthorized" }); }
    
    const comment = await commentData.create({
        task: taskid,
        user: req.user.userid,
        text,
        mentions,
        createdAt: new Date(),
        updatedAt: new Date()
    })
    const task = await taskData.findById(taskid);
    const story = await storyData.findById(task?.storyname);
    if(!task || !story) {return res.status(401).json({ error: "Unauthorized" }); }
    
    task.comments.push(comment._id)
    await task.save()
    
    // Send notifications to all users tagged with @
    for(let i = 0; i < mentions.length; i ++) {
        const message = await notificationData.create({
            Message: "You are mentioned in " + task.name + " of story " + story.storyname,
            sendto: mentions[i],
            sendfrom: req.user.userid,
            task: taskid,
            board: task.boardname ?? null,
            story: task.storyname ?? null,
            project: null,
            date: new Date(),
            read: false
        });
        const user = await userData.findById(mentions[i]);
        user?.notifications.push(message._id);
        user?.save();
    }
    res.json({ added:true })
})

// Deletes a specific comment from a task
app.post('/deletecomment', isLoggedIn, async (req: Request_user ,res: Response)=>{
    console.log("deletingcomment")
    const { commentid } = req.body
    const comment = await commentData.findById(commentid);
    const task = await taskData.findById(comment?.task);
    if(!task || !comment) {return res.status(401).json({ error: "Unauthorized" });}
    task.comments = task?.comments.filter((id) => id.toString() !== comment._id.toString())
    await task.save();
    await commentData.findByIdAndDelete(commentid);
    res.json({ deleted :true })
})

// Edits an existing comment (verifies the user owns the comment first)
app.post('/editcomment', isLoggedIn, async (req: Request_user ,res: Response)=>{
    console.log("editingcomment")
    const { editingId, editText } = req.body
    const comment = await commentData.findById(editingId);
    if( !comment || !comment.user || !req.user) {return res.status(401).json({ error: "Unauthorized" });}
    if(comment.user.toString() !== req.user.userid){
        return res.status(403).json({ error: "Not allowed" });
    }
    comment.text = editText;
    comment.updatedAt = new Date();
    await comment.save()
    res.json({ edited :true })
})

// Deletes a column from a board and re-syncs all stories' statuses based on the new layout
app.post('/deletecolumn', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("deletingcolumn");
    const { boardid, pos } = req.body;
    const board = await boardData.findById(boardid);
    
    if (!board || !board.columns) { return res.status(401).json({ error: "Unauthorized" }); }
    
    board.columns.splice(pos, 1);
    board.markModified('columns');
    await board.save();

    if (board.stories && board.stories.length > 0) {
        for (const storyId of board.stories) {
            const story = await storyData.findById(storyId);
            if (story && story.tasks) {
                let minStatus = story.status || "TODO";
                const storyTasks = story.tasks.filter(id => id != null).map(id => id.toString());
                
                for (let i = 0; i < board.columns.length; i++) {
                    const currentColumn = board.columns[i];
                    if (!currentColumn || !currentColumn.tasks) continue;
                    
                    const colTasks = currentColumn.tasks.filter(id => id != null).map(id => id.toString());
                    const taskInThisColumn = storyTasks.some(id => colTasks.includes(id));
                    
                    if (taskInThisColumn && currentColumn.name) {
                        minStatus = currentColumn.name; 
                        break; 
                    }
                }
                story.status = minStatus;
                await story.save();
            }
        }
    }
    
    res.json({ deletedcolumn: true });
});

// Renames a column, updates all tasks inside it to reflect the new name, and syncs stories
app.post('/renamecolumn', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("renamecolumn");
    const { newname, boardid, columnpos } = req.body;
    const board = await boardData.findById(boardid);
    const pos = Number(columnpos);
    
    if (!board || !board.columns) { return res.status(401).json({ error: "Unauthorized" }); }
    
    // If pos is -1, it means we are adding a completely new column instead of renaming
    if (pos == -1) {
        board.columns.push({ name: newname, tasks: [] });
        board.markModified('columns');
        await board.save();
    } else {
        if (!board.columns[pos]) { return res.status(401).json({ error: "Unauthorized" }); }
        
        board.columns[pos].name = newname;
        board.markModified('columns'); 
        await board.save();

        const columnTasks = board.columns[pos].tasks;
        if (columnTasks && columnTasks.length > 0) {
            await taskData.updateMany(
                { _id: { $in: columnTasks } },
                { $set: { status: newname } }
            );
        }

        if (board.stories && board.stories.length > 0) {
            for (const storyId of board.stories) {
                const story = await storyData.findById(storyId);
                if (story && story.tasks) {
                    let minStatus = story.status || "TODO";
                    const storyTasks = story.tasks.filter(id => id != null).map(id => id.toString());
                    
                    for (let i = 0; i < board.columns.length; i++) {
                        const currentColumn = board.columns[i];
                        if (!currentColumn || !currentColumn.tasks) continue;
                        
                        const colTasks = currentColumn.tasks.filter(id => id != null).map(id => id.toString());
                        const taskInThisColumn = storyTasks.some(id => colTasks.includes(id));
                        
                        if (taskInThisColumn && currentColumn.name) {
                            minStatus = currentColumn.name; 
                            break; 
                        }
                    }
                    story.status = minStatus;
                    await story.save();
                }
            }
        }
    }
    
    res.json({ renamed: true }); 
});

// Promotes a user to a Project Admin role and sends them a notification
app.post('/addadminproject', isLoggedIn, async (req: Request_user ,res: Response)=>{
    console.log("addinig admin in the porject")
    const { id, project_admin } = req.body
    const project = await projectData.findById(id);
    const user = await userData.findById(project_admin);
    const senduser = req.user;
    if(!senduser || !user || !project || !project.project_admin) { return res.status(401).json({ error: "Unauthorized" });}
    let present = false;
    for(let i = 0; i < project.project_admin.length; i++){
        const userid = project.project_admin[i];
        if(!userid) continue;

        if(userid.toString() === user._id.toString()){
            present = true;
            break;
        }
    }
    if(!present){
        project.project_admin.push(user._id);
        const message = await notificationData.create({
            Message: "You are project admin of a " + project.name,
            sendto: user._id,
            sendfrom: senduser.userid,
            task: null,
            board: null,
            story: null,
            project: project._id,
            date: new Date(),
            read: false
        });
        user.notifications.push(message._id);
        user.projectAdmin.push(project._id);
        user.projects.push(project._id);
        user.save();
        project.save();
    }
    res.json({ deletedcolumn :true })
});

// Retrieves the list of Project Admins for a specific project
app.get('/getprojectadmins/:id', async (req: Request, res: Response) => {
    console.log("getting porjectadmins");
    const project = await projectData.findById(req.params.id).populate("project_admin");
    if(!project) { return res.status(401).json({ error: "Unauthorized" }); }
    const project_admins = project.project_admin;
    res.json({ project_admins });
}); 

// Retrieves all members (non-admins) tied to a project
app.get('/allmembersinproject/:id', async (req: Request, res: Response) => {
    console.log("getting porject members");
    const project = await projectData.findById(req.params.id).populate("members");
    if(!project) { return res.status(401).json({ error: "Unauthorized" }); }
    const projectmembers = project.members;
    res.json({ projectmembers });
}); 

// Helper route used during registration to check if an email is already taken
app.get('/checkemailexistence/:email', async (req: Request, res: Response) => {
    const email = req.params.email;
    if(!email){return res.status(401).json({ error: "Unauthorized" });}
    console.log(email);
    const user = await userData.findOne({ email });
    const exists = user ? true : false;
    res.json({ exists });
});


// Deletes all notifications for the logged-in user
app.post('/clearmesages', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("clearing the messages");
    const userid = req.user?.userid;
    if(!userid) {return res.status(401).json({ error: "Unauthorized" });}
    const user = await userData.findById(userid)
    if(!user) {return res.status(401).json({ error: "Unauthorized" });}
    const notifications = user.notifications;
    for(let i = 0; i < notifications.length; i++){
        await notificationData.findByIdAndDelete(notifications[i])
    }
    user.notifications = [];
    await user.save();
    res.json({ cleared: true });
});

// Marks a specific notification as 'read'
app.post('/markasread/:messageid', isLoggedIn, async (req: Request_user, res: Response) => {
    const notification = await notificationData.findById(req.params.messageid)
    if(!notification) {return res.status(401).json({ error: "Unauthorized" });}
    notification.read = true;
    await notification.save();
    console.log("marking as read")
    res.json({ marked: true });
});

// Moves a project into the user's archived projects list and hides it from the main view
app.post('/archiveproject/:projectid', isLoggedIn, async (req: Request_user, res: Response) => {
    const project = await projectData.findById(req.params.projectid)
    const userid = req.user?.userid;
    if(!userid || !project) {return res.status(401).json({ error: "Unauthorized" });}
    const user = await userData.findById(userid)
    if(!user) {return res.status(401).json({ error: "Unauthorized" });}
    user.archivedprojects.push(project._id);
    user.projects = user.projects.filter((id) => id.toString() !== project._id.toString());
    await user.save();
    console.log(user.archivedprojects);
    console.log("set as archived")
    res.json({ archived: true });
});

// Completely deletes a story, along with all of its associated tasks, from the board and database
app.post('/deletestory/:storyid/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    const story = await storyData.findById(req.params.storyid)
    const project = await projectData.findById(req.params.id)
    console.log("here1");
    if(!story || !project) {return res.status(401).json({ error: "Unauthorized" });}
    for(let i = 0; i < story.tasks.length; i++){
        const task = await taskData.findById(story.tasks[i]);
        const board = await boardData.findById(story.boardname);
        if(!board || !task){
            return;
        }
        console.log("here5")
        for(let i = 0; i < board.columns.length; i++){
            const column = board.columns[i]
            if(!column) continue;
            column.tasks = column.tasks.filter((id) => id.toString() !== task._id.toString());        }
        board?.save();
        console.log("here6");
        await taskData.findByIdAndDelete(task?._id);
    }
    console.log("here7")
    await storyData.findByIdAndDelete(story.id);
    console.log("Deleting the story")
    res.json({ archived: true });
});


// Read-only endpoint to get fully populated boards, columns, stories, and tasks
app.get('/getprojectboardstoread/:id', async (req: Request, res: Response) => {
    console.log("getprojectboards");
    const project = await projectData.findById(req.params.id).populate({
            path: "boards",
            populate: [
                {
                    path: "columns.tasks",  
                },
                {
                    path: "stories",
                    populate: {
                        path: "tasks"       
                    }
                }
            ]
});
    const boards = project?.boards;
    res.json({ boards });
});

// Fetches a read-only view of a project with global admin details
app.get('/projecttoread/:id', async (req: Request, res: Response) => {
    console.log("project details")
    const project = await projectData.findById(req.params.id).populate("global_admin");
    if(!project ){ return res.status(404).json({ error: "Project not found" }); }
    const global_admin = await userData.findById(project.global_admin);
    console.log(global_admin);
    res.json({ project, global_admin });
});

// Updates the allowed workflow rules (transitions) for task movement across columns
app.post('/updateworkflow/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    console.log("Updating board workflow transitions");
    const { transitions } = req.body;
    
    try {
        const board = await boardData.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }
        // Save the transitions to the board document
        // We use markModified because transitions is likely a nested object/Map
        (board as any).transitions = transitions; 
        board.markModified('transitions'); 
        await board.save();

        res.json({ updated: true });
    } catch (error) {
        console.error("Error updating workflow:", error);
        res.status(500).json({ error: "Server error" });
    }
});
export default app;
// Updates per-column WIP limits 
app.post('/updatewiplimits/:id', isLoggedIn, async (req: Request_user, res: Response) => {
    const { wipLimits } = req.body;
    try {
        const board = await boardData.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }
        // Verify user is admin
        const project = await projectData.findById((board as any).projectname);
        const user = await userData.findById((req.user as { userid: string }).userid);
        if (!project || !user) {
            return res.status(404).json({ error: "Project or user not found" });
        }
        const isGlobalAdmin = user._id.toString() === project.global_admin?.toString();
        const isProjectAdmin = project.project_admin.some(
            (adminId: any) => adminId.toString() === user._id.toString()
        );
        if (!isGlobalAdmin && !isProjectAdmin) {
            return res.status(403).json({ error: "Only admins can set WIP limits" });
        }
        (board as any).wipLimits = wipLimits;
        board.markModified('wipLimits');
        await board.save();
        res.json({ updated: true });
    } catch (error) {
        console.error("Error updating WIP limits:", error);
        res.status(500).json({ error: "Server error" });
    }
});