
export interface Project {
  _id: string;
  name: string;
  description: string;
  project_admin: User[];
}

export interface User {
  name: string;
  avatar: string;
  _id: string;
}

export interface Column {
  _id: string;
  name: string;
  tasks: Task[];
}

export interface Board {
  _id: string;
  projectname: string;
  columns: { name: string; tasks: Task[] }[];
  stories: Story[];
  __v: number;
}

export interface Story {
  _id: string;
  boardname: string;
  storyname: string;
  status: string;
  tasks: Task[];
}

export interface Task {
  _id: string;
  boardname: string;
  storyname: string;
  name: string;
  description: string;
  assigneeid: string;
  assignee: string;
  reporterid: string;
  reporter: string;
  status: string;
  dueDate: string;
  priority: string;
  tasktype: string;
  createdat: string;
  updatedat: string;
  resolvedat: string;
  closedat: string;
  auditlog: string[];
}


export interface Notification {
  _id: string;
  Message: string;
  sendto: User;
  sendfrom: User;
  task: Task;
  board: Board;
  project: Project;
  story: Story;
  date: string;
  read: boolean;
}
