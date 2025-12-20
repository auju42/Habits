
const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export const createCalendarEvent = async (accessToken: string, task: { title: string, description?: string, dueDate?: string }) => {
    if (!task.dueDate) return null;

    const event = {
        summary: task.title,
        description: task.description || '',
        start: {
            date: task.dueDate,
        },
        end: {
            date: task.dueDate,
        },
    };

    try {
        const response = await fetch(GOOGLE_CALENDAR_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Google Calendar API error:', response.status, errorData);
            throw new Error(`Failed to create Google Calendar event: ${errorData?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return null;
    }
};

export const updateCalendarEvent = async (accessToken: string, eventId: string, updates: { title?: string, description?: string, dueDate?: string, completed?: boolean }) => {
    try {
        const event: any = {};
        if (updates.title !== undefined || updates.completed !== undefined) {
            const title = updates.title || '';
            event.summary = updates.completed ? `[DONE] ${title}` : title;
        }
        if (updates.description !== undefined) event.description = updates.description;
        if (updates.dueDate) {
            event.start = { date: updates.dueDate };
            event.end = { date: updates.dueDate };
        }

        const response = await fetch(`${GOOGLE_CALENDAR_API_URL}/${eventId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            throw new Error('Failed to update Google Calendar event');
        }

        return true;
    } catch (error) {
        console.error('Error updating calendar event:', error);
        return false;
    }
};

export const deleteCalendarEvent = async (accessToken: string, eventId: string) => {
    try {
        const response = await fetch(`${GOOGLE_CALENDAR_API_URL}/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok && response.status !== 404) {
            throw new Error('Failed to delete Google Calendar event');
        }

        return true;
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        return false;
    }
};
