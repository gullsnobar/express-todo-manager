const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const { log } = require('console');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure tasks directory exists
const tasksDir = path.join(__dirname, 'tasks');
if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir);
}

// Home route - display all tasks
app.get('/', function(req, res){
    fs.readdir(tasksDir, function(err, files) {
        if (err) {
            console.error('Error reading tasks directory:', err);
            return res.render('index', { tasks: [] });
        }
        
        const tasks = [];
        
        // Read each task file and parse its content
        files.forEach(file => {
            if (path.extname(file) === '.txt') {
                try {
                    const filePath = path.join(tasksDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const lines = content.split('\n');
                    
                    tasks.push({
                        id: path.basename(file, '.txt'),
                        title: lines[0] || 'Untitled Task',
                        description: lines.slice(1).join('\n').trim() || 'No description available',
                        filename: file
                    });
                } catch(readErr) {
                    console.error('Error reading task file:', readErr);
                }
            }
        });
        
        res.render('index', { tasks: tasks });
    });
});

// Route to handle task creation
app.post('/create-task', function(req, res) {
    const { title, description } = req.body;
    
    if (!title || !title.trim()) {
        return res.redirect('/?error=Title is required');
    }
    
    // Create a unique filename based on timestamp and title
    const timestamp = Date.now();
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `${timestamp}_${safeTitle}.txt`;
    const filePath = path.join(tasksDir, filename);
    
    // Combine title and description for file content
    const taskContent = `${title}\n${description || ''}`;
    
    fs.writeFile(filePath, taskContent, function(err) {
        if (err) {
            console.error('Error creating task:', err);
            return res.redirect('/?error=Failed to create task');
        }
        
        console.log(`Task created: ${filename}`);
        res.redirect('/?success=Task created successfully');
    });
});

// Route to view individual task
app.get('/task/:id', function(req, res) {
    const taskId = req.params.id;
    const filePath = path.join(tasksDir, `${taskId}.txt`);
    
    fs.readFile(filePath, 'utf-8', function(err, content) {
        if (err) {
            console.error('Error reading task:', err);
            return res.redirect('/?error=Task not found');
        }
        
        const lines = content.split('\n');
        const task = {
            id: taskId,
            title: lines[0] || 'Untitled Task',
            description: lines.slice(1).join('\n').trim() || 'No description available'
        };
        
        res.render('task-detail', { task: task });
    });
});

// Route to delete a task
app.post('/delete-task/:id', function(req, res) {
    const taskId = req.params.id;
    const filePath = path.join(tasksDir, `${taskId}.txt`);
    
    fs.unlink(filePath, function(err) {
        if (err) {
            console.error('Error deleting task:', err);
            return res.redirect('/?error=Failed to delete task');
        }
        
        console.log(`Task deleted: ${taskId}`);
        res.redirect('/?success=Task deleted successfully');
    });
});

// Route to edit task (GET - show edit form)
app.get('/edit-task/:id', function(req, res) {
    const taskId = req.params.id;
    const filePath = path.join(tasksDir, `${taskId}.txt`);
    
    fs.readFile(filePath, 'utf-8', function(err, content) {
        if (err) {
            console.error('Error reading task for edit:', err);
            return res.redirect('/?error=Task not found');
        }
        
        const lines = content.split('\n');
        const task = {
            id: taskId,
            title: lines[0] || 'Untitled Task',
            description: lines.slice(1).join('\n').trim() || ''
        };
        
        res.render('edit-task', { task: task });
    });
});

// Route to update task (POST)
app.post('/update-task/:id', function(req, res) {
    const taskId = req.params.id;
    const { title, description } = req.body;
    const filePath = path.join(tasksDir, `${taskId}.txt`);
    
    if (!title || !title.trim()) {
        return res.redirect(`/edit-task/${taskId}?error=Title is required`);
    }
    
    const taskContent = `${title}\n${description || ''}`;
    
    fs.writeFile(filePath, taskContent, function(err) {
        if (err) {
            console.error('Error updating task:', err);
            return res.redirect(`/edit-task/${taskId}?error=Failed to update task`);
        }
        
        console.log(`Task updated: ${taskId}`);
        res.redirect(`/task/${taskId}?success=Task updated successfully`);
    });
});

app.listen(3000, function() {
    console.log('Task Manager server running on http://localhost:3000');
    console.log('Tasks will be stored in the ./tasks directory');
});