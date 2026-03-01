import os
import threading
from resend import Resend
from fastapi import BackgroundTasks

resend_client = Resend(api_key=os.getenv("RESEND_API_KEY"))

def send_email_sync(to_email: str, subject: str, html_content: str):
    """
    Synchronous helper called by the thread.
    """

    try:
        resend_client.Emails.send({
            "from": "Margi AI <notifications@yourdomain.com>",
            "to" : to_email,
            "subject": subject,
            "html" : html_content
        })
    except Exception as e:
        print(f"Failed to send to {to_email}: {e}")

def schedule_email(background_tasks: BackgroundTasks, to_email:str, subject: str, html_content: str):
    """
    Adds email sending to FastAPI's background thread pool.
    """ 
    background_tasks.add_task(send_email_sync, to_email, subject, html_content)    