const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==============================================================================
// 1. AWS S3 CONFIGURATION & BACKUP SERVICE
// ==============================================================================
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'smart-hostel-backups-24mis0052';

const s3 = new AWS.S3({ region: AWS_REGION });

let s3BackupLog = [];

async function backupToS3(action, payload) {
  const timestamp = Date.now();
  const dateStr = new Date().toISOString();
  const backupKey = `backups/${action}-${timestamp}.json`;

  const backupData = {
    action,
    timestamp: dateStr,
    candidate: "A. Jayaraajan (24MIS0052)",
    payload,
    totalRecords: {
      students: students.length,
      rooms: rooms.length,
      complaints: complaints.length,
      leaves: leaveRequests.length,
      agileItems: agileBacklog.length
    }
  };

  const params = {
    Bucket: BUCKET_NAME,
    Key: backupKey,
    Body: JSON.stringify(backupData, null, 2),
    ContentType: 'application/json'
  };

  try {
    const uploadRes = await s3.putObject(params).promise();
    const logEntry = {
      key: backupKey,
      action,
      time: dateStr,
      status: 'SUCCESS (Uploaded to S3)',
      eTag: uploadRes.ETag
    };
    s3BackupLog.unshift(logEntry);
    if (s3BackupLog.length > 20) s3BackupLog.pop();
    console.log(`[AWS S3] Successfully backed up ${action} to s3://${BUCKET_NAME}/${backupKey}`);
    return logEntry;
  } catch (err) {
    const logEntry = {
      key: backupKey,
      action,
      time: dateStr,
      status: `LOCAL ONLY (${err.message})`
    };
    s3BackupLog.unshift(logEntry);
    if (s3BackupLog.length > 20) s3BackupLog.pop();
    console.warn(`[AWS S3 Notice] S3 upload skipped/failed: ${err.message}. (Normal in local mode without IAM role)`);
    return logEntry;
  }
}

// ==============================================================================
// 2. IN-MEMORY DATA STORE (Pre-seeded for Demonstration)
// ==============================================================================
let rooms = [
  { room_no: "A-101", block: "A", floor: 1, capacity: 2, current_occupancy: 1, type: "AC", tags: ["Quiet", "First Year"] },
  { room_no: "A-102", block: "A", floor: 1, capacity: 2, current_occupancy: 2, type: "AC", tags: ["Senior"] },
  { room_no: "A-201", block: "A", floor: 2, capacity: 3, current_occupancy: 1, type: "Non-AC", tags: ["Quiet"] },
  { room_no: "B-101", block: "B", floor: 1, capacity: 2, current_occupancy: 0, type: "Non-AC", tags: ["First Year"] },
  { room_no: "B-201", block: "B", floor: 2, capacity: 4, current_occupancy: 2, type: "Non-AC", tags: ["Spacious"] }
];

let students = [
  { id: "std-1", reg_no: "24MIS0052", name: "A. Jayaraajan", email: "jayaraajan.a2024@vitstudent.ac.in", room_number: "A-101", department: "Software Engineering", year: 2, fee_status: "Paid", checkin_status: "Checked-In" },
  { id: "std-2", reg_no: "24MIS0018", name: "Rahul Sharma", email: "rahul.s2024@vitstudent.ac.in", room_number: "A-102", department: "Computer Science", year: 2, fee_status: "Paid", checkin_status: "Checked-In" },
  { id: "std-3", reg_no: "24MIS0089", name: "Karthik R", email: "karthik.r2024@vitstudent.ac.in", room_number: "A-102", department: "Information Technology", year: 2, fee_status: "Pending", checkin_status: "Checked-In" },
  { id: "std-4", reg_no: "24MIS0105", name: "Vikram Nair", email: "vikram.n2024@vitstudent.ac.in", room_number: "Unassigned", department: "Software Engineering", year: 1, fee_status: "Paid", checkin_status: "Checked-Out" }
];

let complaints = [
  {
    id: "cmp-101",
    student_id: "std-1",
    student_name: "A. Jayaraajan",
    room_number: "A-101",
    category: "Electrical",
    description: "Sparking sound and smoke smell coming from switchboard",
    priority: "Critical",
    status: "Open",
    created_at: new Date().toLocaleDateString()
  },
  {
    id: "cmp-102",
    student_id: "std-2",
    student_name: "Rahul Sharma",
    room_number: "A-102",
    category: "Wi-Fi / Internet",
    description: "Wi-Fi corridor access point keeps disconnecting",
    priority: "Medium",
    status: "In Progress",
    created_at: new Date().toLocaleDateString()
  }
];

let agileBacklog = [
  {
    id: "SPRINT-1",
    title: "Upgrade Wi-Fi Access Points in Block A",
    description: "Student feedback indicates weak signals on 2nd floor during study hours. Install dual-band mesh repeater.",
    source_feedback: "Feedback from A. Jayaraajan",
    sprint_name: "Sprint 2 (Infrastructure & Cloud)",
    story_points: 5,
    priority: "High",
    status: "In Progress"
  },
  {
    id: "SPRINT-2",
    title: "Introduce Healthy Salad Bar Option in Mess",
    description: "Multiple students requested fresh fruits and boiled sprout counter during dinner.",
    source_feedback: "Feedback from Rahul Sharma",
    sprint_name: "Sprint 2 (Infrastructure & Cloud)",
    story_points: 3,
    priority: "Medium",
    status: "To Do"
  }
];

let leaveRequests = [
  {
    id: "leave-1",
    student_id: "std-1",
    student_name: "A. Jayaraajan",
    room_number: "A-101",
    reason: "Attending National Level Hackathon at Bangalore",
    from_date: "2026-10-10",
    to_date: "2026-10-13",
    parent_contact: "+91 9876543210",
    status: "Approved",
    warden_remarks: "Permission granted. Carry college ID."
  }
];

let visitors = [
  { id: "vis-1", visitor_name: "S. Anandan", student_name: "A. Jayaraajan", student_room: "A-101", relationship: "Father", check_in_time: "10:30 AM" }
];

let messMenu = {
  breakfast: "Idli, Vada, Sambar, Chutney, Coffee/Tea",
  lunch: "Steamed Rice, Rasam, Paneer Butter Masala, Curd, Papad",
  snacks: "Samosa, Mint Chutney, Masala Chai",
  dinner: "Chapati, Dal Tadka, Veg Pulao, Gulab Jamun"
};

// ==============================================================================
// 3. NOVELTY ALGORITHMS
// ==============================================================================

// Novelty 2: Priority Classifier
function classifyPriority(category, description) {
  const desc = description.toLowerCase();
  const criticalWords = ["fire", "spark", "smoke", "shock", "short circuit", "flood", "broken lock", "emergency"];
  const highWords = ["leakage", "no water", "water cut", "geyser", "fan not working", "blackout", "toilet blocked"];
  const mediumWords = ["wifi", "internet", "bulb", "tube light", "tap dripping", "cupboard", "slow speed", "dirty"];

  if (criticalWords.some(w => desc.includes(w)) || category.toLowerCase() === "electrical") {
    return "Critical";
  } else if (highWords.some(w => desc.includes(w))) {
    return "High";
  } else if (mediumWords.some(w => desc.includes(w))) {
    return "Medium";
  }
  return "Low";
}

// Novelty 3: Story Points Estimator (Fibonacci)
function estimateStoryPoints(feedbackText, category) {
  const words = feedbackText.split(' ').length;
  if (category === "Hostel Policy" || category === "Mess Food" || words > 25) return 5;
  if (words > 12) return 3;
  if (words > 6) return 2;
  return 1;
}

// ==============================================================================
// 4. API ROUTES
// ==============================================================================

// Health and CloudWatch Metrics
app.get('/health', (req, res) => {
  res.json({
    status: "Healthy",
    service: "Smart Hostel Management Release Pipeline",
    environment: process.env.NODE_ENV || "development",
    candidate: "A. Jayaraajan (24MIS0052)",
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', (req, res) => {
  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.current_occupancy, 0);
  res.json({
    occupancy_rate: totalCapacity ? Math.round((occupiedBeds / totalCapacity) * 100) : 0,
    total_students: students.length,
    active_rooms: rooms.length,
    critical_complaints: complaints.filter(c => c.priority === "Critical" && c.status !== "Resolved").length,
    pending_leaves: leaveRequests.filter(l => l.status === "Pending").length,
    agile_sprint_tasks: agileBacklog.length,
    s3_backup_count: s3BackupLog.length
  });
});

app.get('/api/s3/backups', (req, res) => {
  res.json({ bucket: BUCKET_NAME, region: AWS_REGION, logs: s3BackupLog });
});

// Novelty 1: Smart Room Recommendation
app.get('/api/rooms', (req, res) => res.json(rooms));

app.post('/api/rooms/smart-recommend', (req, res) => {
  const { preferred_type, preferred_floor } = req.body;
  const available = rooms.filter(r => r.current_occupancy < r.capacity);

  const scored = available.map(room => {
    let score = 0;
    let reasons = [];

    if (room.type.toLowerCase() === (preferred_type || '').toLowerCase()) {
      score += 40;
      reasons.push(`Matches preferred type (${room.type})`);
    }
    if (preferred_floor && room.floor === parseInt(preferred_floor)) {
      score += 20;
      reasons.push(`Matches preferred floor (Floor ${room.floor})`);
    }
    const vacant = room.capacity - room.current_occupancy;
    score += vacant * 15;
    reasons.push(`${vacant} vacant bed(s)`);

    if (room.tags.includes("First Year")) {
      score += 15;
      reasons.push("Batch alignment: First Year friendly");
    }

    return { ...room, score, reasons: reasons.join(" + ") };
  });

  scored.sort((a, b) => b.score - a.score);
  res.json({ topMatch: scored[0] || null, allMatches: scored });
});

app.post('/api/rooms/allocate', async (req, res) => {
  const { student_id, room_no } = req.body;
  const student = students.find(s => s.id === student_id);
  const room = rooms.find(r => r.room_no === room_no);

  if (!student || !room) return res.status(404).json({ error: "Student or Room not found" });
  if (room.current_occupancy >= room.capacity) return res.status(400).json({ error: "Room full" });

  student.room_number = room_no;
  room.current_occupancy += 1;

  await backupToS3("room-allocation", { student, room });
  res.json({ success: true, student, room });
});

// Novelty 2: Smart Complaints
app.get('/api/complaints', (req, res) => res.json(complaints));

app.post('/api/complaints', async (req, res) => {
  const { student_id, student_name, room_number, category, description } = req.body;
  const priority = classifyPriority(category, description);

  const newComp = {
    id: `cmp-${Date.now().toString().slice(-4)}`,
    student_id,
    student_name,
    room_number,
    category,
    description,
    priority,
    status: "Open",
    created_at: new Date().toLocaleDateString()
  };

  complaints.unshift(newComp);
  await backupToS3("complaint-filed", newComp);
  res.json(newComp);
});

app.patch('/api/complaints/:id/status', async (req, res) => {
  const comp = complaints.find(c => c.id === req.params.id);
  if (!comp) return res.status(404).json({ error: "Not found" });
  comp.status = req.body.status;
  await backupToS3("complaint-status-updated", comp);
  res.json(comp);
});

// Novelty 3: Student Feedback to Agile Sprint
app.get('/api/agile/backlog', (req, res) => res.json(agileBacklog));

app.post('/api/agile/feedback-to-sprint', async (req, res) => {
  const { student_name, category, feedback_text } = req.body;
  const pts = estimateStoryPoints(feedback_text, category);

  const newStory = {
    id: `SPRINT-${agileBacklog.length + 1}`,
    title: `Improve ${category}: ${feedback_text.slice(0, 35)}...`,
    description: `Student Feedback from ${student_name}: "${feedback_text}"`,
    source_feedback: feedback_text,
    sprint_name: "Sprint 2 (Infrastructure & Cloud)",
    story_points: pts,
    priority: pts >= 5 ? "High" : "Medium",
    status: "To Do"
  };

  agileBacklog.unshift(newStory);
  await backupToS3("agile-story-created", newStory);
  res.json(newStory);
});

app.patch('/api/agile/backlog/:id/status', (req, res) => {
  const item = agileBacklog.find(b => b.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  item.status = req.body.status;
  res.json(item);
});

// Novelty 4: Digital Leave
app.get('/api/leave', (req, res) => res.json(leaveRequests));

app.post('/api/leave', async (req, res) => {
  const newLeave = {
    id: `leave-${Date.now().toString().slice(-4)}`,
    ...req.body,
    status: "Pending"
  };
  leaveRequests.unshift(newLeave);
  await backupToS3("leave-requested", newLeave);
  res.json(newLeave);
});

app.patch('/api/leave/:id/review', async (req, res) => {
  const leave = leaveRequests.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ error: "Not found" });
  leave.status = req.body.status; // "Approved" or "Rejected"
  leave.warden_remarks = req.body.remarks || "Reviewed by Warden";
  await backupToS3("leave-reviewed", leave);
  res.json(leave);
});

// Students, Mess, Visitors
app.get('/api/students', (req, res) => res.json(students));
app.get('/api/mess', (req, res) => res.json(messMenu));
app.get('/api/visitors', (req, res) => res.json(visitors));

// Fallback home
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Smart Hostel Cloud App running on port ${PORT}`);
  console.log(`Candidate: A. Jayaraajan (24MIS0052)`);
  console.log(`AWS S3 Target: s3://${BUCKET_NAME}`);
  console.log(`=======================================================`);
});
