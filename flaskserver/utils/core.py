
# This is the requirements for the project

import os
import cv2
import torch
import openai
import smtplib
import io
import nltk
nltk.download('vader_lexicon')
from PIL import Image
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from transformers import AutoModel, AutoTokenizer
from langchain.chat_models import ChatOpenAI
from langchain.chains.summarize import load_summarize_chain
from langchain.schema import Document
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from torchvision.transforms import InterpolationMode
import torchvision.transforms as T


# Defining the Model
model = AutoModel.from_pretrained('OpenGVLab/InternVL2-4B',torch_dtype=torch.bfloat16,trust_remote_code=True)
# -------------------------------------------------------------------------------------------------------
# Defining the Tokenizer
tokenizer = AutoTokenizer.from_pretrained('OpenGVLab/InternVL2-4B', trust_remote_code=True)
# -------------------------------------------------------------------------------------------------------
# Writing the OPEN AI Key
openai.api_key = "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"
# -------------------------------------------------------------------------------------------------------
# Define the Chatbot LLM
llm = ChatOpenAI(openai_api_key=openai.api_key, model_name="gpt-3.5-turbo", temperature=0.5)
# -------------------------------------------------------------------------------------------------------
# Loading the Sentiment Analyzer
sid = SentimentIntensityAnalyzer()
# -------------------------------------------------------------------------------------------------------
# Writing the sender email and password in the environment
os.environ["SENDER_EMAIL"] = "dattanidumukkala.98@gmail.com"
os.environ["EMAIL_PASSWORD"] = "ljyo rcni ofen snpj"
# -------------------------------------------------------------------------------------------------------



class VideoCaptionPipeline:
    def __init__(self, model, tokenizer,sender_email=os.getenv("SENDER_EMAIL"), email_password=os.getenv("EMAIL_PASSWORD")):
        self.sender_email = sender_email
        self.email_password = email_password
        self.IMAGENET_MEAN = (0.485, 0.456, 0.406)
        self.IMAGENET_STD = (0.229, 0.224, 0.225)

    def _build_transform(self, input_size):
        transform = T.Compose([
            T.Lambda(lambda img: img.convert('RGB') if img.mode != 'RGB' else img),
            T.Resize((input_size, input_size), interpolation=InterpolationMode.BICUBIC),
            T.ToTensor(),
            T.Normalize(mean=self.IMAGENET_MEAN, std=self.IMAGENET_STD)
        ])
        return transform

    def process_video(self, video_file, output_folder, input_size=448, max_num=12):
        os.makedirs(output_folder, exist_ok=True)
        video_capture = cv2.VideoCapture(video_file)
        fps = int(video_capture.get(cv2.CAP_PROP_FPS))
        frame_count = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count // fps
        count = 0

        for second in range(duration + 1):
            video_capture.set(cv2.CAP_PROP_POS_MSEC, second * 1000)
            success, frame = video_capture.read()
            if not success:
                break
            frame_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            compressed_image_io = io.BytesIO()
            compression_quality = 25
            frame_image.save(compressed_image_io, format="JPEG", quality=compression_quality)
            compressed_image_io.seek(0)
            compressed_image = Image.open(compressed_image_io)
            frame_filename = os.path.join(output_folder, f"frame_{count:04d}.jpg")
            compressed_image.save(frame_filename)
            compressed_image_io.close()
            del frame_image, compressed_image
            count += 1
            if count >= max_num:
                break
        video_capture.release()
        print(f"Processing complete. {count} frames saved to {output_folder}.")

    def summarize_with_langchain(self, texts):
        if isinstance(texts, list):
            text = " ".join(texts)
        else:
            text = texts
        document = Document(page_content=text)
        chain = load_summarize_chain(self.llm, chain_type="map_reduce")
        summary = chain.run([document])
        return summary
    def frame_iter(self, img_list):
        l=[]
        for img in img_list:
            pixel_values = self.load_image(img, max_num=12).to(torch.bfloat16).cuda()
            generation_config = dict(max_new_tokens=1024, do_sample=True)
            question = '<image>\nPlease describe the image shortly.'
            response = model.chat(tokenizer, pixel_values, question, generation_config)
            l.append(response)
            print('done')
        return l

    def save_data_to_file(self, date, time, cctv_no, location, generated_caption, file_path):
        data_line = f"On {date} at {time}, at CCTV location {cctv_no} in {location}, scene: {generated_caption}\n"
        with open(file_path, "a") as file:
            file.write(data_line)

    def determine_alert_category(self, text, compound_score):
        text_lower = text.lower()
        if "collision" in text_lower or "crash" in text_lower or "fallen person" in text_lower:
            return "Accident Alert" if compound_score <= -0.05 else "Incident Reported (Not Critical)"
        elif "theft" in text_lower:
            return "Theft Alert" if compound_score <= -0.05 else "Theft Suspicion Alert"
        elif "traffic block" in text_lower or "congestion" in text_lower:
            return "Traffic Block Alert" if compound_score <= -0.05 else "Traffic Update: Congestion"
        elif "location" in text_lower or "citizens" in text_lower:
            return "Location-Based Alert" if compound_score <= -0.05 else "Advisory Update for Citizens"
        elif "busy street" in text_lower or "traffic light" in text_lower:
            return "General Traffic Alert" if compound_score > -0.05 else "Traffic Monitoring Alert"
        return "Uncategorized"

    def analyze_and_generate_alerts(self, texts):
        if isinstance(texts, str):
            texts = [texts]
        for text in texts:
            sentiment = self.sid.polarity_scores(text)
            compound_score = sentiment['compound']
            alert_category = self.determine_alert_category(text, compound_score)
            urgency = "Immediate Action Recommended" if compound_score <= -0.05 else "Low - Monitoring or Advisory Only"
            return urgency, alert_category

    def send_email(self, alert_category, urgency, body, receiver_email="nikhil01446@gmail.com"):
        subject = f'{alert_category} - {urgency} Reg'
        body = body + "\n\nPlease look into the incident. \n\nSTAWS"
        message = MIMEMultipart()
        message["From"] = self.sender_email
        message["To"] = receiver_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))
        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(self.sender_email, self.email_password)
                server.sendmail(self.sender_email, receiver_email, message.as_string())
                print("Email sent successfully")
        except Exception as e:
            print(f"Error: {e}")

    def pipeline(self, video_file, output_folder, txt_file_path):
        self.process_video(video_file, output_folder, input_size=448, max_num=12)
        frames = [os.path.join(output_folder, frame) for frame in os.listdir(output_folder)[:]]
        summaries= self.frame_iter([output_folder+i for i in os.listdir(output_folder)[:]])
        summary_output = self.summarize_with_langchain(summaries)
        self.save_data_to_file(
            date=datetime.now().strftime("%d-%m-%Y"),
            time=datetime.now().strftime("%H:%M:%S"),
            cctv_no="62456",
            location="Vijayawada",
            generated_caption=summary_output,
            file_path=txt_file_path
        )
        urgency, alert_category = self.analyze_and_generate_alerts(summary_output)
        self.send_email(alert_category, urgency, summary_output)
        return summaries, alert_category, urgency
    
# -------------------------------------------------------------------------------------------------------
# Defining the pipeline
# -------------------------------------------------------------------------------------------------------

pipeline = VideoCaptionPipeline(model,tokenizer)
input_video_file = "input_video.mp4"
output_frames_folder = "output_frames"
alerts_txt_file = "alerts.txt"
summaries, alert_category, urgency= pipeline.pipeline(input_video_file, output_frames_folder, alerts_txt_file)
