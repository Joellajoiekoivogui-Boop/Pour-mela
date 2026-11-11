-- MonMentor : schéma initial. Doit rester aligné sur src/db/schema.ts.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  city TEXT NOT NULL DEFAULT 'Conakry',
  country TEXT NOT NULL DEFAULT 'Guinée',
  birth_date TEXT,
  bio TEXT,
  gender TEXT,
  preferred_channel TEXT NOT NULL DEFAULT 'whatsapp',
  is_demo INTEGER NOT NULL DEFAULT 0,
  charter_version TEXT,
  charter_accepted_at INTEGER,
  parent_name TEXT,
  parent_phone TEXT,
  parent_consent_token TEXT,
  parent_consent_at INTEGER,
  suspended_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE mentor_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT,
  years_experience INTEGER NOT NULL DEFAULT 0,
  primary_domain TEXT NOT NULL,
  domains TEXT NOT NULL,
  skills TEXT NOT NULL,
  languages TEXT NOT NULL,
  formats TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 3,
  verification_level INTEGER NOT NULL DEFAULT 0,
  slots TEXT NOT NULL,
  linkedin_url TEXT
);

CREATE TABLE mentee_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  situation TEXT,
  need TEXT,
  domains TEXT NOT NULL
);

CREATE TABLE mentorships (
  id TEXT PRIMARY KEY,
  mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX mentorships_pair ON mentorships(mentor_id, mentee_id);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  cohort_id TEXT,
  title TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 45,
  format TEXT NOT NULL DEFAULT 'visio',
  status TEXT NOT NULL,
  objective_id TEXT,
  joined_at_mentor INTEGER,
  joined_at_mentee INTEGER,
  summary TEXT,
  next_actions TEXT,
  skill_worked TEXT,
  rating INTEGER,
  rating_comment TEXT,
  closed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX sessions_mentor ON sessions(mentor_id);
CREATE INDEX sessions_mentee ON sessions(mentee_id);

CREATE TABLE objectives (
  id TEXT PRIMARY KEY,
  mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  due_date TEXT,
  mentor_comment TEXT,
  mentor_comment_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE objective_steps (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  from_session_id TEXT
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX messages_pair ON messages(sender_id, recipient_id);

CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 5,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE opportunities (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TEXT NOT NULL,
  url TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE opportunity_interests (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, opportunity_id)
);

CREATE TABLE career_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE',
  headline TEXT,
  summary TEXT,
  language TEXT NOT NULL DEFAULT 'fr',
  template TEXT NOT NULL DEFAULT 'sobre',
  hidden TEXT NOT NULL,
  share_token TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE experiences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  start TEXT NOT NULL,
  "end" TEXT,
  description TEXT
);

CREATE TABLE skill_endorsements (
  id TEXT PRIMARY KEY,
  mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX endorsement_unique ON skill_endorsements(mentee_id, mentor_id, skill);

CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at INTEGER NOT NULL
);

CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  program_id TEXT,
  issued_by TEXT,
  issued_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE TABLE share_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  evidence TEXT,
  status TEXT NOT NULL,
  reviewer_id TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_user_id TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  action TEXT,
  reviewed_by TEXT,
  reviewed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  status TEXT NOT NULL,
  scheduled_at INTEGER NOT NULL,
  sent_at INTEGER,
  read_at INTEGER,
  session_id TEXT,
  urgent INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX notifications_due ON notifications(status, scheduled_at);

CREATE TABLE otp_codes (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE programs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  weeks INTEGER NOT NULL,
  sessions_count INTEGER NOT NULL,
  session_minutes INTEGER NOT NULL,
  summary TEXT NOT NULL,
  deliverable TEXT NOT NULL,
  steps TEXT NOT NULL,
  certificate_title TEXT NOT NULL
);

CREATE TABLE cohorts (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_on TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at INTEGER NOT NULL
);

CREATE TABLE cohort_members (
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  attendance INTEGER NOT NULL DEFAULT 0,
  deliverable_validated INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (cohort_id, user_id)
);

CREATE TABLE match_events (
  id TEXT PRIMARY KEY,
  mentee_id TEXT NOT NULL,
  mentor_id TEXT NOT NULL,
  event TEXT NOT NULL,
  score INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
