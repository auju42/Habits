// Google Tasks API Service
const TASKS_API = 'https://tasks.googleapis.com/tasks/v1';

export interface GoogleTask {
    id: string;
    title: string;
    notes?: string;
    status: 'needsAction' | 'completed';
    due?: string;
    updated?: string;
}

// Fetch all tasks from the default list
export async function fetchGoogleTasks(accessToken: string): Promise<GoogleTask[]> {
    try {
        const response = await fetch(`${TASKS_API}/lists/@default/tasks?showCompleted=true&maxResults=100`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            console.error('Failed to fetch Google Tasks:', response.status);
            return [];
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching Google Tasks:', error);
        return [];
    }
}

// Create a new task in Google Tasks
export async function createGoogleTask(
    accessToken: string,
    task: { title: string; notes?: string; due?: string }
): Promise<string | null> {
    try {
        const body: any = { title: task.title };
        if (task.notes) body.notes = task.notes;
        if (task.due) body.due = `${task.due}T00:00:00.000Z`;

        const response = await fetch(`${TASKS_API}/lists/@default/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error('Failed to create Google Task:', response.status);
            return null;
        }

        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Error creating Google Task:', error);
        return null;
    }
}

// Update task status in Google Tasks
export async function updateGoogleTaskStatus(
    accessToken: string,
    taskId: string,
    completed: boolean
): Promise<boolean> {
    try {
        const response = await fetch(`${TASKS_API}/lists/@default/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: completed ? 'completed' : 'needsAction'
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Error updating Google Task status:', error);
        return false;
    }
}

// Delete a task from Google Tasks
export async function deleteGoogleTask(
    accessToken: string,
    taskId: string
): Promise<boolean> {
    try {
        const response = await fetch(`${TASKS_API}/lists/@default/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        return response.ok || response.status === 404;
    } catch (error) {
        console.error('Error deleting Google Task:', error);
        return false;
    }
}
