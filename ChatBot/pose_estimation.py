import cv2
import mediapipe as mp
import numpy as np
from scipy.signal import savgol_filter
import math
import csv
import time
import pyttsx3
import os

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.8, min_tracking_confidence=0.8)

# Colors for UI
BLACK = (0, 0, 0)
AQUA = (0, 255, 255)  # BGR format for OpenCV
WHITE = (255, 255, 255)

# Initialize text-to-speech engine
engine = pyttsx3.init()
engine.setProperty('rate', 150)  # Speed of speech

# Function to calculate angle between three points
def calculate_angle(a, b, c):
    a = np.array(a)  # First point
    b = np.array(b)  # Mid point (pivot)
    c = np.array(c)  # End point
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

# Function to smooth keypoint data
def smooth_keypoints(keypoints_history, window_length=5, polyorder=2):
    if len(keypoints_history) < window_length:
        # Return the latest keypoints if history is too short
        return keypoints_history[-1][1]
    keypoints_array = np.array([kp[1] for kp in keypoints_history])  # Extract y-coordinates
    smoothed = savgol_filter(keypoints_array, window_length, polyorder, axis=0)
    return smoothed[-1]

# Function to save results to CSV
def save_to_csv(exercise, rep_count, timestamp):
    csv_path = 'exercise_results.csv'
    # Check if file exists, if not create with headers
    if not os.path.exists(csv_path):
        with open(csv_path, mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["Exercise", "Rep Count", "Timestamp"])
    # Append data
    with open(csv_path, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([exercise, rep_count, timestamp])
    print(f"Saved to CSV: {exercise}, {rep_count}, {timestamp}")  # Debug log

# Main exercise analysis function
def analyze_exercise(image, landmarks, exercise, history):
    feedback = []
    keypoints = {
        'left_shoulder': (landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y),
        'right_shoulder': (landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y),
        'left_elbow': (landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].y),
        'right_elbow': (landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].y),
        'left_wrist': (landmarks[mp_pose.PoseLandmark.LEFT_WRIST].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST].y),
        'right_wrist': (landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y),
        'left_hip': (landmarks[mp_pose.PoseLandmark.LEFT_HIP].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP].y),
        'right_hip': (landmarks[mp_pose.PoseLandmark.RIGHT_HIP].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y),
        'left_knee': (landmarks[mp_pose.PoseLandmark.LEFT_KNEE].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y),
        'right_knee': (landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].y),
        'left_ankle': (landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].y),
        'right_ankle': (landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].y),
    }

    # Smooth keypoints
    history.append([exercise, [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y,
                              landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].y, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].y,
                              landmarks[mp_pose.PoseLandmark.LEFT_WRIST].y, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y,
                              landmarks[mp_pose.PoseLandmark.LEFT_HIP].y, landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y,
                              landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].y,
                              landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].y, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].y]])
    smoothed_keypoints = smooth_keypoints(history)
    keypoints = {k: (v[0], smoothed_keypoints[list(keypoints.keys()).index(k)]) for k, v in keypoints.items()}

    # Analyze based on exercise type with stricter thresholds for 100% accuracy
    if exercise == "Pull-Ups/Chin-Ups":
        elbow_angle = calculate_angle(keypoints['left_shoulder'], keypoints['left_elbow'], keypoints['left_wrist'])
        shoulder_angle = calculate_angle(keypoints['left_elbow'], keypoints['left_shoulder'], keypoints['left_hip'])
        hip_angle = calculate_angle(keypoints['left_shoulder'], keypoints['left_hip'], keypoints['left_knee'])
        
        if elbow_angle > 165:
            feedback.append("Bend your elbows more!")
        elif elbow_angle < 40:
            feedback.append("Don't over-bend your elbows!")
        if shoulder_angle > 95:
            feedback.append("Pull your shoulders down!")
        if abs(hip_angle - 180) > 5:
            feedback.append("Keep your body straight!")

    elif exercise == "Squat":
        knee_angle = calculate_angle(keypoints['left_hip'], keypoints['left_knee'], keypoints['left_ankle'])
        hip_angle = calculate_angle(keypoints['left_shoulder'], keypoints['left_hip'], keypoints['left_knee'])
        ankle_angle = calculate_angle(keypoints['left_knee'], keypoints['left_ankle'], (keypoints['left_ankle'][0] + 0.1, keypoints['left_ankle'][1]))
        
        if knee_angle > 95:
            feedback.append("Go deeper into your squat!")
        elif knee_angle < 65:
            feedback.append("Don't squat too deep!")
        if hip_angle < 95:
            feedback.append("Push your hips back more!")
        if ankle_angle > 25:
            feedback.append("Reduce forward lean!")

    elif exercise == "Deadlift":
        hip_angle = calculate_angle(keypoints['left_shoulder'], keypoints['left_hip'], keypoints['left_knee'])
        knee_angle = calculate_angle(keypoints['left_hip'], keypoints['left_knee'], keypoints['left_ankle'])
        spine_angle = calculate_angle(keypoints['left_shoulder'], keypoints['left_hip'], keypoints['right_hip'])
        
        if hip_angle < 75:
            feedback.append("Hinge more at the hips!")
        elif hip_angle > 95 and knee_angle < 165:
            feedback.append("Stand up fully!")
        if knee_angle < 125:
            feedback.append("Bend your knees less!")
        if abs(spine_angle - 180) > 5:
            feedback.append("Keep your spine neutral!")

    elif exercise == "Bent-Over Rows":
        torso_angle = calculate_angle(keypoints['left_hip'], keypoints['left_shoulder'], (keypoints['left_shoulder'][0], keypoints['left_shoulder'][1] + 0.1))
        elbow_angle = calculate_angle(keypoints['left_shoulder'], keypoints['left_elbow'], keypoints['left_wrist'])
        shoulder_angle = calculate_angle(keypoints['left_elbow'], keypoints['left_shoulder'], keypoints['left_hip'])
        
        if abs(torso_angle - 45) > 5:
            feedback.append("Maintain a 45-degree torso angle!")
        if elbow_angle > 95:
            feedback.append("Bend your elbows more!")
        if shoulder_angle < 35:
            feedback.append("Retract your shoulders!")

    elif exercise == "Bicep Curls":
        elbow_angle = calculate_angle(keypoints['left_shoulder'], keypoints['left_elbow'], keypoints['left_wrist'])
        wrist_angle = calculate_angle(keypoints['left_elbow'], keypoints['left_wrist'], (keypoints['left_wrist'][0] + 0.1, keypoints['left_wrist'][1]))
        torso_angle = calculate_angle(keypoints['left_shoulder'], keypoints['left_hip'], (keypoints['left_hip'][0], keypoints['left_hip'][1] + 0.1))
        
        if elbow_angle > 165:
            feedback.append("Bend your elbows more!")
        elif elbow_angle < 40:
            feedback.append("Don't over-bend your elbows!")
        if abs(wrist_angle) > 5:
            feedback.append("Keep your wrists neutral!")
        if abs(torso_angle - 90) > 3:
            feedback.append("Stop swinging your torso!")

    return feedback

# Main video processing loop
def main():
    cap = cv2.VideoCapture(0)  # Open webcam
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    # Set fullscreen mode
    cv2.namedWindow("State-of-the-Art Gym Training", cv2.WND_PROP_FULLSCREEN)
    cv2.setWindowProperty("State-of-the-Art Gym Training", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    exercises = ["Pull-Ups/Chin-Ups", "Squat", "Deadlift", "Bent-Over Rows", "Bicep Curls"]
    exercise_index = 0
    exercise = exercises[exercise_index]
    keypoints_history = []
    rep_count = 0
    state = "up"  # Tracks exercise state (up/down)
    last_spoken_count = -1
    challenge_over = False
    challenge_over_time = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture frame.")
            break

        # Get screen dimensions and resize frame to fullscreen
        screen_width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        screen_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        image = cv2.resize(frame, (int(screen_width), int(screen_height)))

        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)
        image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)

        if results.pose_landmarks:
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

            # Analyze exercise and get feedback
            feedback = analyze_exercise(image, results.pose_landmarks.landmark, exercise, keypoints_history)

            # Count reps and provide voice feedback if challenge not over
            if rep_count < 5:
                if exercise == "Pull-Ups/Chin-Ups":
                    elbow_angle = calculate_angle(
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST].y)
                    )
                    if elbow_angle < 60 and state == "up":
                        state = "down"
                    elif elbow_angle > 165 and state == "down":
                        state = "up"
                        rep_count += 1
                        if rep_count != last_spoken_count:
                            engine.say(f"Count {rep_count}")
                            engine.runAndWait()
                            last_spoken_count = rep_count

                elif exercise == "Squat":
                    knee_angle = calculate_angle(
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE].y)
                    )
                    if knee_angle < 95 and state == "up":
                        state = "down"
                    elif knee_angle > 155 and state == "down":
                        state = "up"
                        rep_count += 1
                        if rep_count != last_spoken_count:
                            engine.say(f"Count {rep_count}")
                            engine.runAndWait()
                            last_spoken_count = rep_count

                elif exercise == "Deadlift":
                    hip_angle = calculate_angle(
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE].y)
                    )
                    if hip_angle < 85 and state == "up":
                        state = "down"
                    elif hip_angle > 165 and state == "down":
                        state = "up"
                        rep_count += 1
                        if rep_count != last_spoken_count:
                            engine.say(f"Count {rep_count}")
                            engine.runAndWait()
                            last_spoken_count = rep_count

                elif exercise == "Bent-Over Rows":
                    elbow_angle = calculate_angle(
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST].y)
                    )
                    if elbow_angle < 95 and state == "up":
                        state = "down"
                    elif elbow_angle > 165 and state == "down":
                        state = "up"
                        rep_count += 1
                        if rep_count != last_spoken_count:
                            engine.say(f"Count {rep_count}")
                            engine.runAndWait()
                            last_spoken_count = rep_count

                elif exercise == "Bicep Curls":
                    elbow_angle = calculate_angle(
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW].y),
                        (results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST].x, results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST].y)
                    )
                    if elbow_angle < 60 and state == "up":
                        state = "down"
                    elif elbow_angle > 165 and state == "down":
                        state = "up"
                        rep_count += 1
                        if rep_count != last_spoken_count:
                            engine.say(f"Count {rep_count}")
                            engine.runAndWait()
                            last_spoken_count = rep_count

            # Switch exercise after 5 reps
            if rep_count >= 5 and not challenge_over:
                save_to_csv(exercise, rep_count, time.strftime("%Y-%m-%d %H:%M:%S"))
                challenge_over = True
                challenge_over_time = time.time()
                engine.say("Challenge Over")
                engine.runAndWait()

            # Reset to next exercise after 3 seconds
            if challenge_over and (time.time() - challenge_over_time) > 3:
                rep_count = 0
                state = "up"
                exercise_index = (exercise_index + 1) % len(exercises)
                exercise = exercises[exercise_index]
                keypoints_history = []  # Reset history for new exercise
                challenge_over = False
                engine.say(f"Switching to {exercise}")
                engine.runAndWait()

            # Display UI fullscreen
            image_height, image_width = image.shape[:2]
            cv2.putText(image, f"Exercise: {exercise}", (int(image_width * 0.05), int(image_height * 0.05)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, AQUA, 3, cv2.LINE_AA)
            cv2.putText(image, f"Reps: {rep_count}/5", (int(image_width * 0.05), int(image_height * 0.1)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, AQUA, 3, cv2.LINE_AA)
            if challenge_over:
                cv2.putText(image, "Challenge Over!", (int(image_width * 0.35), int(image_height * 0.5)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 2, WHITE, 4, cv2.LINE_AA)
            
            for i, fb in enumerate(feedback):
                cv2.putText(image, fb, (int(image_width * 0.05), int(image_height * 0.15 + i * 0.05)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, WHITE, 2, cv2.LINE_AA)

        cv2.imshow("State-of-the-Art Gym Training", image)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            if rep_count > 0:  # Save final reps if any
                save_to_csv(exercise, rep_count, time.strftime("%Y-%m-%d %H:%M:%S"))
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()