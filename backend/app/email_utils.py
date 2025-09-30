from .matching import extract_skills
import os, smtplib, mimetypes
from email.message import EmailMessage


def build_email(student_name: str, student_skills: str | None, availability: str | None,
               professor_name: str, paper_title: str | None, topic: str | None) -> dict:
   last = (professor_name or "Professor").split()[-1]
   def infer_topic():
       if (paper_title or "").strip(): return paper_title.strip()
       if (topic or "").strip(): return topic.strip()
       toks = extract_skills(student_skills or "")
       return toks[0] if toks else "your research"


   t = infer_topic()
   subject = "Undergraduate Seeking Research Assistant Position"
   paper_line = f' I recently read your paper "{paper_title}".' if paper_title else ""
   skills = student_skills or "relevant skills"
   avail = availability or "this quarter"
   body = (
       f"Dear Dr. {last},\n\n"
       f"My name is {student_name}, and I am an [undergraduate or graduate] at UC Davis interested in your work on {t}.{paper_line} "
       f"I would be eager to contribute to your research and apply my experience in {skills}. "
       f"I am available to start {avail} and would greatly appreciate the opportunity to discuss how I could support your lab.\n\n"
       f"I have attached my [CV or transcript or both] for your reference.\n"
       f"Thank you for your time and consideration.\n\n"
       f"Best regards,\n{student_name}"
   )
   return {"subject": subject, "body": body}


def send_email_with_attachment(
    *,
    to_email: str,
    subject: str,
    body: str,
    attachment_bytes: bytes | None = None,
    attachment_filename: str | None = None,
) -> dict:
    """Send an email using SMTP (STARTTLS) with optional single attachment.

    Required env vars:
      SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM
    """
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or username
    if not (host and username and password and sender):
        raise RuntimeError("SMTP env not configured")

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    if attachment_bytes and attachment_filename:
        ctype, _ = mimetypes.guess_type(attachment_filename)
        maintype, subtype = (ctype or "application/octet-stream").split("/", 1)
        msg.add_attachment(
            attachment_bytes,
            maintype=maintype,
            subtype=subtype,
            filename=attachment_filename,
        )

    with smtplib.SMTP(host, port) as smtp:
        smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(msg)

    return {"ok": True}