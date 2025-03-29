from flask import Flask, Response, jsonify, request
import cv2
import mediapipe as mp
import numpy as np
import csv
import pyttsx3
import time

app = Flask(__name__)
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose()
engine = pyttsx3.init()

# Use laptop camera (index 0)
cap = cv2.VideoCapture(0)
exercise_name = "squat"
rep_count = 0
exercise_stage = None

# Help image for squat correction
help_images = {
    "squat": "help_squat.jpg"  # Ensure this file exists in the same directory
}

def speak(text):
    engine.say(text)
    engine.runAndWait()

def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba, bc = a - b, c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return np.degrees(np.arccos(cosine_angle))

def detect_exercise(landmarks, exercise):
    global rep_count, exercise_stage
    
    shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
    hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
    knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
    ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
    
    if exercise == "squat":
        knee_angle = calculate_angle(hip, knee, ankle)
        accuracy = max(0, 100 - abs(knee_angle - 100))  # Ideal squat angle ~100°
        if accuracy >= 70 and exercise_stage == "up":
            rep_count += 1
            exercise_stage = "down"
            speak(f"{rep_count} squat completed")
        elif accuracy < 50:
            exercise_stage = "up"
        return accuracy
    
    return 0

def generate_frames():
    global exercise_name
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame from camera")
            break

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        accuracy = 0

        if results.pose_landmarks:
            accuracy = detect_exercise(results.pose_landmarks.landmark, exercise_name)
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            
        if accuracy < 50:
            help_img = cv2.imread(help_images[exercise_name])
            if help_img is not None:
                cv2.imshow("Correction", help_img)
                time.sleep(5)
                cv2.destroyWindow("Correction")
                speak("Get ready, restarting exercise")
            else:
                print("Help image not found:", help_images[exercise_name])

        cv2.putText(image, f'Reps: {rep_count}', (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(image, f'Accuracy: {int(accuracy)}%', (50, 140), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        _, buffer = cv2.imencode('.jpg', image)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/set_exercise', methods=['POST'])
def set_exercise():
    global exercise_name, rep_count
    data = request.json
    exercise_name = data.get("exercise", "squat")
    rep_count = 0
    return jsonify({"message": "Exercise updated successfully", "exercise": exercise_name})

@app.route('/squat_data', methods=['GET'])
def get_squat_data():
    return jsonify({"count": rep_count, "accuracy": int(detect_exercise(pose.process(cv2.cvtColor(cap.read()[1], cv2.COLOR_BGR2RGB)).pose_landmarks.landmark if pose.process(cv2.cvtColor(cap.read()[1], cv2.COLOR_BGR2RGB)).pose_landmarks else 0, "squat"))})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)