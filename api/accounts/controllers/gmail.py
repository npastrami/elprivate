import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_email(to: str, subject: str, body: str):
    # Gmail SMTP server credentials
    print("beginning email")
    gmail_user = 'nickpastrana15@gmail.com'
    gmail_app_password = 'giio ogee pmmb nnls'

    # Prepare the email
    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = to
    msg['Subject'] = subject

    # Attach the body with MIMEText
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Establish a secure session with Gmail's outgoing SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()  # Secure the connection
        server.login(gmail_user, gmail_app_password)  # Log in to your Gmail account

        # Send the email
        server.sendmail(gmail_user, to, msg.as_string())
        server.quit()

        print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email. Error: {e}")
