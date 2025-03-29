const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');
const dns = require('dns');
const crypto = require('crypto');
const fs = require('fs');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const multer = require('multer'); // Added for file uploads

const app = express();
const port = 3001; // Updated to 5000 as per your request

app.use(express.json());

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Middleware - Updated CORS for React Native
app.use(cors({
  origin: ['http://192.168.140.42:8081', 'http://127.0.0.1:3001'], // Expo Go default port + server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours expiry
    },
  })
);

// Database Connection Configuration
const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '1234',
  database: 'userinformation',
};

const db = require('mysql2').createConnection(dbConfig);
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('Connected to the MySQL database');
});

const pool = mysql.createPool(dbConfig);

const dbConnect = async (req, res, next) => {
  try {
    req.db = await pool.getConnection();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

// Middleware to Check Authentication
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.session.admin) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

// --------------------GYM ANALTICS -----------------------
app.get('/exercise-results', (req, res) => {
  const filePath = path.join(__dirname, './ChatBot/exercise_results.csv');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading CSV:', err);
      return res.status(500).json({ error: 'Error reading data' });
    }
    res.setHeader('Content-Type', 'text/csv');
    res.send(data);
  });
});

// -------------------- SIGNUP ENDPOINT --------------------
app.post('/signup', upload.single('profileImage'), async (req, res) => {
  const { email, username, country, phone, password } = req.body;
  const profileImage = req.file ? `/uploads/${req.file.filename}` : null;
  const session_id = crypto.randomUUID(); // Generate unique session_id

  if (!email || !username || !country || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!/^[A-Za-z]+$/.test(username)) {
    return res.status(400).json({ message: 'Username must contain only alphabets' });
  }
  if (!/^[0-9]+$/.test(phone)) {
    return res.status(400).json({ message: 'Phone must contain only digits' });
  }

  let retries = 3;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1'); // Test connection
      const [existingEmail] = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      const [existingPhone] = await pool.execute('SELECT phone FROM users WHERE phone = ?', [phone]);
      if (existingPhone.length > 0) {
        return res.status(409).json({ message: 'Phone number already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = `INSERT INTO users (email, username, country, phone, password, profile_image, session_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      await pool.execute(sql, [email, username, country, phone, hashedPassword, profileImage, session_id]);
      console.log(`User signed up: ${email}, session_id: ${session_id}`);
      return res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
      retries -= 1;
      console.error(`Signup error for ${email} (attempt ${4 - retries}/3):`, err.message);
      if (retries === 0) {
        return res.status(500).json({ message: 'Signup failed, email or phone may already exist', error: err.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
    }
  }
});

// -------------------- LOGIN ENDPOINT --------------------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      console.error('Login error:', err || 'No user found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    req.session.user = { email: user.email, profile_image: user.profile_image };
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
    });
    res.json({ success: true, message: 'Login successful' });
  });
});

// -------------------- GET USER PROFILE --------------------
// Profile Fetch Endpoint
app.get('/profile', isAuthenticated, async (req, res) => {
  const userEmail = req.session.user.email;
  try {
    const [rows] = await pool.execute('SELECT username, email, country, phone, profile_image FROM users WHERE email = ?', [userEmail]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile Endpoint
app.put('/update-profile', isAuthenticated, upload.single('profile_image'), async (req, res) => {
  const userEmail = req.session.user.email;
  const { username, country, phone, password } = req.body;
  const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Validate username (alphabets and spaces allowed)
    if (username && !/^[A-Za-z\s]+$/.test(username)) {
      return res.status(400).json({ message: 'Username must contain only alphabets and spaces' });
    }
    // Validate phone (only digits allowed)
    if (phone && !/^[0-9]+$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must contain only digits' });
    }

    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updateFields = {};
    if (username) updateFields.username = username;
    if (country) updateFields.country = country;
    if (phone) updateFields.phone = phone;
    if (hashedPassword) updateFields.password = hashedPassword;
    if (profileImage) updateFields.profile_image = profileImage;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updateSql = `UPDATE users SET ${Object.keys(updateFields).map(key => `${key} = ?`).join(', ')} WHERE email = ?`;
    const values = Object.values(updateFields).concat(userEmail);

    const [result] = await pool.execute(updateSql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// -------------------- LOGOUT ENDPOINT --------------------
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// -------------------- OTP SENDING --------------------
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
const TOKEN_PATH = 'token.json';

async function initializeAuth() {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    if (token.expiry_date < Date.now()) {
      try {
        const { credentials: newTokens } = await oAuth2Client.refreshAccessToken();
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokens));
        oAuth2Client.setCredentials(newTokens);
        console.log('Token refreshed and saved to', TOKEN_PATH);
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Failed to refresh token');
      }
    }
  } else {
    console.error('No token found. Please authenticate first by running auth.js.');
    process.exit(1);
  }
}

oAuth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('Token refreshed and saved to', TOKEN_PATH);
  }
  oAuth2Client.setCredentials(tokens);
});

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
const otpStore = new Map();

function isValidEmail(email) {
  const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  return pattern.test(email);
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(to, otp) {
  const sender = 'f219111@cfd.nu.edu.pk';
  const subject = 'HealthGenix Account Verification';
  const message = `
      <html>
      <body>
      <h2>HealthGenix Account Verification</h2>
      <p>Your OTP is:</p>
      <div style='background:#FFA500; color:#000; font-size:30px; font-weight:bold; width:200px; height:100px; text-align:center; line-height:100px; margin:20px auto; border-radius:10px;'>
          ${otp}
      </div>
      <p>Thank you for using our service!</p>
      </body>
      </html>
  `;
  const email = [
    `From: ${sender}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    message
  ].join('\n');
  const encodedMessage = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });
    console.log('Email sent successfully:', response.data.id);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

app.post('/verify-email', async (req, res) => {
  const { email } = req.body;

  // Input validation
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  let retries = 3;
  while (retries > 0) {
    try {
      // Ensure database connection is alive
      await pool.query('SELECT 1'); // Simple query to test connection

      const [rows] = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Email not found' });
      }
      console.log(`Email verified: ${email}`);
      return res.status(200).json({ message: 'Email verified' });
    } catch (error) {
      retries -= 1;
      console.error(`Error verifying email ${email} (attempt ${4 - retries}/3):`, error.message);
      if (retries === 0) {
        return res.status(500).json({ 
          message: 'Server error: Unable to verify email after multiple attempts',
          error: error.message 
        });
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
    }
  }
});

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  try {
    const otp = generateOTP();
    otpStore.set(email, { otp, expires: Date.now() + 60000 });
    await sendOTPEmail(email, otp);
    console.log(`OTP sent to ${email}: ${otp}`); // Debug log
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }
  const storedOtp = otpStore.get(email);
  if (!storedOtp) {
    return res.status(400).json({ message: 'No OTP found or expired' });
  }
  if (storedOtp.expires < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (storedOtp.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  otpStore.delete(email);
  console.log(`OTP verified for ${email}: ${otp}`); // Debug log
  res.status(200).json({ message: 'OTP verified successfully' });
});

app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------- ADMIN ENDPOINTS --------------------
app.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM admins WHERE email = ?`;
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const admin = results[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    req.session.admin = { email: admin.email };
    res.json({ success: true, message: 'Login successful' });
  });
});

app.post('/admin-verify-email', (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
  const sql = `SELECT email FROM admins WHERE email = ?`;
  db.query(sql, [email], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Email not found' });
    res.status(200).json({ message: 'Email verified' });
  });
});

app.post('/admin-send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const otp = generateOTP();
    otpStore.set(`admin_${email}`, { otp, expires: Date.now() + 60000 });
    await sendOTPEmail(email, otp);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

app.post('/admin-verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otpStore.get(`admin_${email}`);
  if (!storedOtp) return res.status(400).json({ message: 'No OTP found or expired' });
  if (storedOtp.expires < Date.now()) {
    otpStore.delete(`admin_${email}`);
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (storedOtp.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
  otpStore.delete(`admin_${email}`);
  res.status(200).json({ message: 'OTP verified successfully' });
});

app.post('/admin-reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const sql = `UPDATE admins SET password = ? WHERE email = ?`;
  db.query(sql, [hashedPassword, email], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(200).json({ message: 'Password updated successfully' });
  });
});

// -------------------- ADMIN DASHBOARD --------------------
app.get('/api/dashboard', isAdmin, dbConnect, async (req, res) => {
  try {
    const [users] = await req.db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [admins] = await req.db.query('SELECT COUNT(*) as totalAdmins FROM admins');
    res.json({
      totalUsers: users[0].totalUsers,
      totalAdmins: admins[0].totalAdmins
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  } finally {
    req.db.release();
  }
});

// -------------------- CRUD OPERATIONS --------------------
app.get('/get-all-users', isAdmin, (req, res) => {
  const sql = 'SELECT email, username, country, phone, profile_image FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results);
  });
});

app.delete('/delete-user/:email', isAdmin, (req, res) => {
  const email = req.params.email;
  const sql = 'DELETE FROM users WHERE email = ?';
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

app.post('/add-user', isAdmin, async (req, res) => {
  const { email, username, country, phone, password, profileImage } = req.body;
  if (!/^[A-Za-z]+$/.test(username)) {
    return res.status(400).json({ message: 'Username must contain only alphabets' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = `INSERT INTO users (email, username, country, phone, password, profile_image) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [email, username, country, phone, hashedPassword, profileImage], (err, result) => {
    if (err) {
      console.error('Add user error:', err);
      return res.status(500).json({ message: 'Failed to add user, email or phone may already exist' });
    }
    res.status(201).json({ success: true, message: 'User added successfully' });
  });
});

app.put('/update-user/:email', isAdmin, async (req, res) => {
  const email = req.params.email;
  const { username, country, phone, password, profileImage } = req.body;
  if (username && !/^[A-Za-z]+$/.test(username)) {
    return res.status(400).json({ message: 'Username must contain only alphabets' });
  }
  let hashedPassword = password;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }
  const updateFields = {};
  if (username) updateFields.username = username;
  if (country) updateFields.country = country;
  if (phone) updateFields.phone = phone;
  if (hashedPassword) updateFields.password = hashedPassword;
  if (profileImage) updateFields.profile_image = profileImage;
  const updateSql = `UPDATE users SET ${Object.keys(updateFields).map(key => `${key} = ?`).join(', ')} WHERE email = ?`;
  const values = Object.values(updateFields).concat(email);
  db.query(updateSql, values, (err, result) => {
    if (err) {
      console.error('Update user error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
});

// -------------------- NOTIFICATION ENDPOINTS --------------------
app.post('/api/notifications', isAdmin, dbConnect, async (req, res) => {
  const { sender_email, receiver_email, message } = req.body;
  try {
    if (!sender_email || !message) {
      return res.status(400).json({ error: 'Sender email and message are required' });
    }
    const [result] = await req.db.query(
      'INSERT INTO notifications (sender_email, receiver_email, message) VALUES (?, ?, ?)',
      [sender_email, receiver_email || null, message]
    );
    res.status(201).json({ id: result.insertId, sender_email, receiver_email, message });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  } finally {
    req.db.release();
  }
});

app.get('/api/notifications/admin', isAdmin, dbConnect, async (req, res) => {
  try {
    const adminEmail = req.session.admin.email;
    const [notifications] = await req.db.query('SELECT * FROM notifications WHERE sender_email = ?', [adminEmail]);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching admin notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  } finally {
    req.db.release();
  }
});

app.get('/api/notifications/user', isAuthenticated, dbConnect, async (req, res) => {
  const userEmail = req.session.user.email;
  try {
    const [notifications] = await req.db.query(
      'SELECT * FROM notifications WHERE receiver_email = ? OR receiver_email IS NULL',
      [userEmail]
    );
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  } finally {
    req.db.release();
  }
});

app.put('/api/notifications/:id/seen', isAuthenticated, dbConnect, async (req, res) => {
  const { id } = req.params;
  try {
    await req.db.query('UPDATE notifications SET is_seen = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Notification marked as seen' });
  } catch (err) {
    console.error('Error marking notification as seen:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  } finally {
    req.db.release();
  }
});

// -------------------- FEEDBACK ENDPOINTS --------------------
app.post('/api/feedback', isAuthenticated, dbConnect, async (req, res) => {
  const { user_email, notification_id, feedback } = req.body;
  try {
    if (!user_email || !notification_id || !feedback) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const [result] = await req.db.query(
      'INSERT INTO feedback (user_email, notification_id, feedback) VALUES (?, ?, ?)',
      [user_email, notification_id, feedback]
    );
    res.status(201).json({ id: result.insertId, user_email, notification_id, feedback });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  } finally {
    req.db.release();
  }
});

app.get('/api/feedback', isAdmin, dbConnect, async (req, res) => {
  try {
    const [feedback] = await req.db.query('SELECT * FROM feedback');
    res.json(feedback);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  } finally {
    req.db.release();
  }
});

// -------------------- Admin Analytics --------------------
app.get('/api/dashboard', (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM admins) AS totalAdmins
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results[0]);
  });
});

app.get('/api/notifications/last7days', (req, res) => {
  const query = `
    SELECT COUNT(*) AS count 
    FROM notifications 
    WHERE created_at >= NOW() - INTERVAL 7 DAY
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ count: results[0].count });
  });
});

app.get('/api/users/registered/last7days', (req, res) => {
  const query = `
    SELECT COUNT(*) AS count 
    FROM users 
    WHERE created_at >= NOW() - INTERVAL 7 DAY
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ count: results[0].count });
  });
});

app.get('/api/users/area-stats', (req, res) => {
  const query = `
    SELECT country AS area, COUNT(*) AS count 
    FROM users 
    GROUP BY country 
    ORDER BY count DESC 
    LIMIT 4
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

app.get('/api/users/daily-registrations', (req, res) => {
  const query = `
    SELECT DATE(created_at) AS date, COUNT(*) AS count 
    FROM users 
    WHERE created_at >= NOW() - INTERVAL 7 DAY 
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

app.get('/api/admins/notification-stats', (req, res) => {
  const query = `
    SELECT a.username, COUNT(n.id) AS count 
    FROM admins a 
    LEFT JOIN notifications n ON a.email = n.sender_email 
    GROUP BY a.username
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

app.get('/api/users/country-breakdown', (req, res) => {
  const query = `
    SELECT country, COUNT(*) AS count 
    FROM users 
    GROUP BY country 
    LIMIT 5
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

app.get('/api/users/progress', (req, res) => {
  const query = `SELECT COUNT(*) AS count FROM users`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const totalUsers = results[0].count;
    const goal = 1000;
    res.json({ count: totalUsers, percentage: (totalUsers / goal) * 100 });
  });
});

// -------------------- START SERVER --------------------
initializeAuth().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch((error) => {
  console.error('Failed to initialize authentication:', error);
  process.exit(1);
});