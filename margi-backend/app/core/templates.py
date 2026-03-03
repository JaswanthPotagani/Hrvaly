def get_otp_template(otp_code: str):
    return f"""
    <div style="font-family: sans-serif; padding: 20px;">
       <h2> Verify your Email</h2>
       <p> Your verification code for Margi AI is:</p>
       <h1 style = "color: #f97316;">{otp_code}</h1>
       <p>This code expires in 10 minutes.</p>
    </div>   
    """

def get_interview_report_template(user_name: str, score: float, tip: str):
    return f"""
    <div style="font-family: sans-serif; padding: 20px;">
      <h2> Hi {user_name}, Your Interview Report is Ready!</h2>
      <p>You scored <strong>{score}%</strong> in your recent Technical Assessment.</p>
      <p><strong>AI Suggestion:</strong> {tip} </p>
      <a href="https://yourdomain.com/dashboard" style="background: #f97316; color: white; padding:10px 20px; text-decoration: none; border-radius: 5px;">View Full Analysis</a>
    </div>
    """