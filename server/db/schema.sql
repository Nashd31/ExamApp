-- Drop existing tables to ensure clean schema initialization
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS user_courses CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS question_type CASCADE;

-- Create custom ENUM type for questions
CREATE TYPE question_type AS ENUM ('multiple_choice', 'open_ended');

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher')),
    avatar VARCHAR(255) DEFAULT 'initials',
    theme_color VARCHAR(50) DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Courses Table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Courses (Enrollment Join Table)
CREATE TABLE user_courses (
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, course_id)
);

-- 4. Exams Table
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL DEFAULT 60, -- duration in minutes
    pass_grade INTEGER NOT NULL DEFAULT 50, -- pass grade percentage
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    are_grades_published BOOLEAN NOT NULL DEFAULT FALSE,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Questions Table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type question_type NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    allow_multiple_answers BOOLEAN NOT NULL DEFAULT FALSE,
    correct_answers INTEGER[] -- Array of correct option indices (e.g. [0], [0,2])
);

-- 6. Options Table (for multiple choice questions)
CREATE TABLE options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL
);

-- 7. Submissions Table
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Answers Table (stores student answers per question)
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_options INTEGER[], -- Selected option indices (e.g. [0])
    text_response TEXT, -- Text answer for open ended questions
    manual_points INTEGER, -- Points assigned manually by teacher
    notes TEXT -- Grading feedback notes from teacher
);

-- Indexes for performance optimization
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_user_courses_student ON user_courses(student_id);
CREATE INDEX idx_user_courses_course ON user_courses(course_id);
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_options_question ON options(question_id);
CREATE INDEX idx_submissions_exam ON submissions(exam_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_answers_submission ON answers(submission_id);
CREATE INDEX idx_answers_question ON answers(question_id);
