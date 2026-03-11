import express, { Request, Response, NextFunction } from "express";
import userData from "../database/user"
import projectData from "../database/project";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import cors from "cors"
import cookieParser from "cookie-parser";
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
    console.log("reached here");
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
    projects: []
  };
}

app.post('/createnew', isLoggedIn, async (req: Request_user, res: Response ) => {  // this defines a route 
    console.log("here")
    console.log("req.user:", req.user);

    const email = (req.user as { email: string }).email;

    console.log("Email from token:", email);
    const user = await userData.findOne({ email: (req.user as { email: string }).email });
    const { name, description, project_admin} = req.body;
    if (!user) { return res.status(400).json({ error: "User not found" }); }
    console.log("here2")

    const project = await projectData.create({
        global_admin: user._id, 
        name,
        description,
        project_admin, //{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
        members: [ user._id ],
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
    console.log("from backend")
    let name: string | null | undefined = "";
    if(user) name = user.name;
    res.json({ project, name});
});

app.get('/allusers', async (req: Request, res: Response) => {
    const userlist = await userData.find({}, "name")
    res.json({ userlist });
});

app.get('/allprojects', async (req: Request, res: Response) => {
    const projectlist = await projectData.find({}, "name")
    res.json({ projectlist });
});

app.post('/addmemberinproject', async (req: Request, res: Response ) => {  // this defines a route 
    const {member, project} = req.body;
    const user = await userData.
    const this_project = await projectData.findById(project._id);
    if (!this_project) {
        return res.status(404).json({ error: "Project not found" });
    }
    this_project.members.push(member);
    await this_project.save();
    res.json({ added: true });
    console.log(this_project.members);
});