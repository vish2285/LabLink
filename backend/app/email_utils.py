from .matching import extract_skills

def build_email(student_name: str, student_skills: str | None, availability: str | None,
                professor_name: str, paper_title: str | None, topic: str | None) -> dict:
    last = (professor_name or "Professor").split()[-1]
    def infer_topic():
        if (paper_title or "").strip(): return paper_title.strip()
        if (topic or "").strip(): return topic.strip()
        toks = extract_skills(student_skills or "")
        return toks[0] if toks else "your research"

    t = infer_topic()
    subject = f"Interest in your work on {t}"
    paper_line = f' I recently read your paper "{paper_title}".' if paper_title else ""
    skills = student_skills or "relevant skills"
    avail = availability or "this quarter"
    body = (
        f"Dear Dr. {last},\n\n"
        f"My name is {student_name}, and I’m a student at UC Davis interested in your work on {t}.{paper_line} "
        f"I’d love to contribute and apply my experience in {skills}. "
        f"I’m available {avail} and would appreciate the opportunity to discuss how I can help.\n\n"
        f"Best regards,\n{student_name}"
    )
    return {"subject": subject, "body": body}
