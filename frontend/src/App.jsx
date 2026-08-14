import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  GraduationCap,
  Users,
  UserPlus,
  ClipboardCheck,
  UserCog,
  LogOut,
  RefreshCw,
  CheckCircle,
  XCircle,
  BarChart3,
  BookOpen,
  Menu,
  X,
  Sparkles,
  Save,
  Search,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
];

// Criteria and maximums come straight from the existing backend
// schema — do not change these without changing the backend.
const RUBRIC_FIELDS = [
  { key: "dressing_appearance", label: "Dressing & Appearance", maximum: 10 },
  { key: "oral_presentation", label: "Oral Presentation", maximum: 10 },
  { key: "slide_presentation", label: "Slide Presentation", maximum: 10 },
  { key: "depth_of_understanding", label: "Depth of Understanding", maximum: 15 },
  { key: "project_implementation", label: "Project Implementation", maximum: 15 },
  { key: "referencing_documentation", label: "Referencing & Documentation", maximum: 15 },
  { key: "contribution_originality", label: "Contribution & Originality", maximum: 15 },
  { key: "professional_conduct", label: "Professional Conduct", maximum: 10 },
];

const MAXIMUM_TOTAL = RUBRIC_FIELDS.reduce((sum, item) => sum + item.maximum, 0);

const EMPTY_SCORES = Object.fromEntries(
  RUBRIC_FIELDS.map((item) => [item.key, ""])
);

/*
 * ⚠️ FIELD NAMES BELOW ARE BEST-GUESS.
 * This conversation doesn't include your backend's Student Pydantic
 * schema, so these `key` values (full_name, matriculation_number,
 * programme, level, academic_session, project_title, supervisor,
 * presentation_date) match the same fallback names already used
 * elsewhere in this file for display purposes.
 *
 * If POST /students/ actually expects different names (e.g.
 * `programme_id` instead of `programme`), change ONLY the `key`
 * value for that field below — nothing else in StudentManagement
 * needs to change. Paste your StudentCreate schema and I'll correct
 * these in one pass.
 */
const STUDENT_FORM_FIELDS = [
  {
    key: "full_name",
    label: "Full Name",
    type: "text",
    required: true,
    placeholder: "e.g. Ada Okafor",
  },
  {
    key: "matriculation_number",
    label: "Matriculation Number",
    type: "text",
    required: true,
    placeholder: "e.g. UI/2021/0123456",
  },
  {
    key: "programme",
    label: "Programme",
    type: "lookup",
    required: true,
    lookupEndpoints: ["/programmes/", "/programs/"],
    placeholder: "e.g. Software Engineering",
  },
  {
    key: "level",
    label: "Level",
    type: "lookup",
    required: true,
    lookupEndpoints: ["/levels/"],
    placeholder: "e.g. 400",
  },
  {
    key: "academic_session",
    label: "Academic Session",
    type: "lookup",
    required: false,
    lookupEndpoints: ["/academic-sessions/", "/sessions/"],
    placeholder: "e.g. 2025/2026",
  },
  {
    key: "project_title",
    label: "Project Title",
    type: "text",
    required: false,
    placeholder: "Project title",
  },
  {
    key: "supervisor",
    label: "Supervisor",
    type: "text",
    required: false,
    placeholder: "Supervisor's name",
  },
  {
    key: "presentation_date",
    label: "Presentation Date",
    type: "date",
    required: false,
  },
];

const EMPTY_STUDENT_FORM = Object.fromEntries(
  STUDENT_FORM_FIELDS.map((item) => [item.key, ""])
);

// Handles whichever response shape the backend actually returns —
// a bare array, or a wrapped { students / items / results / data: [...] }
// object — instead of silently collapsing anything unexpected to [].
function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.students)) return data.students;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token"));

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function handleLogin(newToken) {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    setToken(null);
  }

  if (!token) {
    return <Login onLogin={handleLogin} theme={theme} onThemeChange={setTheme} />;
  }

  return (
    <Dashboard
      token={token}
      onLogout={handleLogout}
      theme={theme}
      onThemeChange={setTheme}
    />
  );
}

/* =====================================================
   THEME SWITCHER
===================================================== */

function ThemeSwitcher({ theme, onThemeChange, className = "" }) {
  return (
    <div className={`theme-switcher ${className}`}>
      <select
        value={theme}
        onChange={(event) => onThemeChange(event.target.value)}
        aria-label="Choose theme"
      >
        {THEMES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =====================================================
   LOGIN
===================================================== */

function Login({ onLogin, theme, onThemeChange }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      onLogin(response.data.access_token);
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        setError(err.response.data?.detail || "Invalid username or password.");
      } else {
        setError("Unable to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-theme">
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
      </div>

      <div className="login-card">
        <div className="login-icon">
          <GraduationCap size={42} />
          <Sparkles className="sparkle-icon" size={18} />
        </div>

        <h1>EMS</h1>
        <p className="login-subtitle">Educational Management System</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({ token, onLogout, theme, onThemeChange }) {
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [assessmentView, setAssessmentView] = useState("dashboard");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/students/`, config),
        axios.get(`${API_URL}/assessments/`, config),
        axios.get(`${API_URL}/users/`, config),
      ]);

      const [studentResult, assessmentResult, userResult] = results;

      if (studentResult.status === "fulfilled") {
        setStudents(normalizeListResponse(studentResult.value.data));
      }

      if (assessmentResult.status === "fulfilled") {
        setAssessments(normalizeListResponse(assessmentResult.value.data));
      }

      if (userResult.status === "fulfilled") {
        setUsers(normalizeListResponse(userResult.value.data));
      }

      const unauthorized = results.some(
        (result) =>
          result.status === "rejected" &&
          [401, 403].includes(result.reason?.response?.status)
      );

      if (unauthorized) {
        onLogout();
        return;
      }

      const allFailed = results.every((result) => result.status === "rejected");

      if (allFailed) {
        setError("Unable to load dashboard data.");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // Called by AssessmentPage right after a successful POST /assessments/.
  // Refreshes dashboard-level data in the background; does NOT navigate
  // away from the assessment screen so the assessor can keep assessing.
  async function handleAssessmentSaved(confirmationText) {
    setSuccessMessage(confirmationText);
    await loadDashboard();

    setTimeout(() => setSuccessMessage(""), 5000);
  }

  const totalStudents = students.length;
  const totalAssessments = assessments.length;
  const totalUsers = users.length;

  const passed = assessments.filter(
    (item) => String(item.recommendation || "").toLowerCase() === "pass"
  ).length;

  const failed = assessments.filter(
    (item) => String(item.recommendation || "").toLowerCase() === "fail"
  ).length;

  const averageScore =
    assessments.length > 0
      ? (
          assessments.reduce((sum, item) => sum + Number(item.total_score || 0), 0) /
          assessments.length
        ).toFixed(2)
      : "0.00";

  const passRate =
    assessments.length > 0 ? ((passed / assessments.length) * 100).toFixed(1) : "0.0";

  const activeUsers = users.filter((user) => user.is_active).length;

  const headerIcon =
    assessmentView === "assessment" ? (
      <ClipboardCheck size={25} />
    ) : assessmentView === "students" ? (
      <UserPlus size={25} />
    ) : (
      <BarChart3 size={25} />
    );

  const headerTitle =
    assessmentView === "assessment"
      ? "Student Assessment"
      : assessmentView === "students"
      ? "Student Management"
      : "Dashboard";

  const headerSubtitle =
    assessmentView === "assessment"
      ? "Assess the student presenting the project"
      : assessmentView === "students"
      ? "Register students and keep the assessment roster current"
      : "Assessment Management Overview";

  return (
    <div className="app-layout">
      {/* SIDEBAR */}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <GraduationCap size={28} />
          </div>

          <div>
            <h2>EMS</h2>
            <span>Educational Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${assessmentView === "dashboard" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setAssessmentView("dashboard");
              setSidebarOpen(false);
            }}
          >
            <BarChart3 size={19} />
            Dashboard
          </button>

          <button
            className={`nav-item ${assessmentView === "students" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setAssessmentView("students");
              setSidebarOpen(false);
            }}
          >
            <Users size={19} />
            Students
          </button>

          <button
            className={`nav-item ${assessmentView === "assessment" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setAssessmentView("assessment");
              setSidebarOpen(false);
            }}
          >
            <ClipboardCheck size={19} />
            Assessments
          </button>

          <button className="nav-item" type="button">
            <UserCog size={19} />
            Users
          </button>

          <button className="nav-item" type="button">
            <BookOpen size={19} />
            Academic
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-item" onClick={onLogout} type="button">
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen((current) => !current)}
              type="button"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="header-icon">{headerIcon}</div>

            <div>
              <h1>{headerTitle}</h1>
              <p>{headerSubtitle}</p>
            </div>
          </div>

          <div className="header-actions">
            <ThemeSwitcher
              theme={theme}
              onThemeChange={onThemeChange}
              className="theme-switcher-header"
            />

            <button
              className="refresh-button"
              onClick={loadDashboard}
              disabled={loading}
              type="button"
            >
              <RefreshCw size={17} className={loading ? "spinning" : ""} />
              Refresh
            </button>

            <button className="logout-button" onClick={onLogout} type="button">
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </header>

        <div className="content">
          <style>{PANEL_STYLES}</style>

          {successMessage && (
            <div className="success">
              <CheckCircle size={18} />
              {successMessage}
            </div>
          )}

          {assessmentView === "assessment" ? (
            <AssessmentPage
              token={token}
              students={students}
              onLogout={onLogout}
              onSaved={handleAssessmentSaved}
            />
          ) : assessmentView === "students" ? (
            <StudentManagement
              token={token}
              students={students}
              onLogout={onLogout}
              onStudentCreated={loadDashboard}
            />
          ) : (
            <>
              {error && <div className="error">{error}</div>}

              <div className="stat-cards">
                <StatCard title="Total Students" value={totalStudents} icon={<Users />} color="blue" />
                <StatCard title="Assessments" value={totalAssessments} icon={<ClipboardCheck />} color="purple" />
                <StatCard title="System Users" value={totalUsers} icon={<UserCog />} color="green" />
                <StatCard title="Average Score" value={averageScore} icon={<BarChart3 />} color="orange" />
                <StatCard title="Passed" value={passed} icon={<CheckCircle />} color="indigo" />
                <StatCard title="Failed" value={failed} icon={<XCircle />} color="red" />
              </div>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Recent Assessments</h2>
                    <p>Latest student project assessment records</p>
                  </div>
                  <ClipboardCheck size={24} />
                </div>

                {loading ? (
                  <div className="empty-state">
                    <div className="loading-spinner" />
                    Loading assessments...
                  </div>
                ) : assessments.length === 0 ? (
                  <div className="empty-state">No assessments available.</div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Student</th>
                          <th>Total Score</th>
                          <th>Recommendation</th>
                        </tr>
                      </thead>

                      <tbody>
                        {assessments
                          .slice(-10)
                          .reverse()
                          .map((assessment) => (
                            <tr key={assessment.id}>
                              <td>#{assessment.id}</td>
                              <td>Student #{assessment.student_id}</td>
                              <td>
                                <span className="score-value">{assessment.total_score}</span>
                              </td>
                              <td>
                                <RecommendationBadge value={assessment.recommendation} />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="bottom-grid">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Assessment Summary</h2>
                    </div>
                    <BarChart3 size={23} />
                  </div>

                  <div className="summary-row">
                    <div className="summary-item">
                      <CheckCircle size={20} />
                      <span>Passed</span>
                      <strong>{passed}</strong>
                      <small>{passRate}%</small>
                    </div>

                    <div className="summary-item">
                      <XCircle size={20} />
                      <span>Failed</span>
                      <strong>{failed}</strong>
                      <small>{(100 - parseFloat(passRate)).toFixed(1)}%</small>
                    </div>

                    <div className="summary-item">
                      <ClipboardCheck size={20} />
                      <span>Total</span>
                      <strong>{totalAssessments}</strong>
                      <small>entries</small>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>System Overview</h2>
                    </div>
                    <GraduationCap size={23} />
                  </div>

                  <div className="overview-list">
                    <div>
                      <span>Students registered</span>
                      <strong>{totalStudents}</strong>
                    </div>

                    <div>
                      <span>Assessments completed</span>
                      <strong>{totalAssessments}</strong>
                    </div>

                    <div>
                      <span>Active users</span>
                      <strong>{activeUsers}</strong>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* =====================================================
   ASSESSMENT PAGE
   (search -> select -> horizontal scores -> save -> reset)
===================================================== */

function AssessmentPage({ token, students, onLogout, onSaved }) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [scores, setScores] = useState(EMPTY_SCORES);
  const [remarks, setRemarks] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // refs for the 8 score inputs, used for fast Enter-to-next-field navigation
  const scoreInputRefs = useRef([]);
  const remarksRef = useRef(null);
  const searchInputRef = useRef(null);

  /*
   * Search matches on:
   * - full name (any substring)
   * - matriculation number (any substring, including just the last 5 digits)
   */
  const matchingStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return students
      .filter((student) => {
        const name = getStudentName(student).toLowerCase();
        const matric = getStudentMatric(student).toLowerCase();
        return name.includes(query) || matric.includes(query);
      })
      .slice(0, 10);
  }, [search, students]);

  function selectStudent(student) {
    setSelectedStudent(student);
    setSearch("");
    setError("");

    // Move straight into scoring — first score field gets focus.
    requestAnimationFrame(() => {
      scoreInputRefs.current[0]?.focus();
    });
  }

  function changeStudent() {
    setSelectedStudent(null);
    setSearch("");
    setScores(EMPTY_SCORES);
    setRemarks("");
    setError("");

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  function handleScoreChange(criterion, rawValue) {
    if (rawValue === "") {
      setScores((current) => ({ ...current, [criterion.key]: "" }));
      return;
    }

    let numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) return;

    if (numericValue > criterion.maximum) numericValue = criterion.maximum;
    if (numericValue < 0) numericValue = 0;

    setScores((current) => ({ ...current, [criterion.key]: numericValue }));
  }

  // Enter moves to the next score field (or the remarks box after the
  // last one) so an assessor never needs the mouse mid-scoring.
  function handleScoreKeyDown(event, index) {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const nextInput = scoreInputRefs.current[index + 1];

    if (nextInput) {
      nextInput.focus();
      nextInput.select?.();
    } else {
      remarksRef.current?.focus();
    }
  }

  const currentTotal = RUBRIC_FIELDS.reduce(
    (sum, item) => sum + Number(scores[item.key] || 0),
    0
  );

  const previewRecommendation = currentTotal >= 50 ? "Pass" : "Fail";

  async function submitAssessment(event) {
    event.preventDefault();

    // Guard against double-clicks / double Enter submits.
    if (saving) return;

    setError("");

    if (!selectedStudent) {
      setError("Please select the student being assessed.");
      return;
    }

    const missing = RUBRIC_FIELDS.filter((item) => scores[item.key] === "");

    if (missing.length > 0) {
      setError(
        `Please enter a score for: ${missing.map((item) => item.label).join(", ")}.`
      );
      return;
    }

    const invalid = RUBRIC_FIELDS.filter((item) => {
      const value = Number(scores[item.key]);
      return Number.isNaN(value) || value < 0 || value > item.maximum;
    });

    if (invalid.length > 0) {
      setError(
        `These scores are out of range: ${invalid.map((item) => item.label).join(", ")}.`
      );
      return;
    }

    // Exactly the fields the backend expects — no assessor_id,
    // total_score, or recommendation, since the backend derives those.
    const payload = {
      student_id: selectedStudent.id,
      dressing_appearance: Number(scores.dressing_appearance),
      oral_presentation: Number(scores.oral_presentation),
      slide_presentation: Number(scores.slide_presentation),
      depth_of_understanding: Number(scores.depth_of_understanding),
      project_implementation: Number(scores.project_implementation),
      referencing_documentation: Number(scores.referencing_documentation),
      contribution_originality: Number(scores.contribution_originality),
      professional_conduct: Number(scores.professional_conduct),
      remarks: remarks.trim() || null,
    };

    const submittedStudentName = getStudentName(selectedStudent);
    const submittedStudentMatric = getStudentMatric(selectedStudent);

    try {
      setSaving(true);

      const response = await axios.post(`${API_URL}/assessments/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Only now — after the backend has actually confirmed the save —
      // do we treat this as a success.
      const confirmationText = `Saved for ${submittedStudentName} (${submittedStudentMatric}) — ${response.data.total_score}/100, ${response.data.recommendation}.`;

      // Reset so the assessor is immediately ready for the next student.
      setSelectedStudent(null);
      setSearch("");
      setScores(EMPTY_SCORES);
      setRemarks("");
      setError("");

      await onSaved(confirmationText);

      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } catch (err) {
      console.error("ASSESSMENT SAVE ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      // Save failed — keep everything exactly as the assessor entered
      // it so nothing has to be re-typed.
      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(detail || "Unable to save assessment. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="assessment-page-wrap">
      {/* STUDENT SEARCH */}

      <section className="ap-panel">
        <div className="ap-panel-header">
          <div>
            <h2>Find Student</h2>
            <p>Search by name, or any part of the matric number (last 5 digits work too)</p>
          </div>
        </div>

        {!selectedStudent ? (
          <div className="ap-search-wrap">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type student name or matric number..."
              autoComplete="off"
              autoFocus
            />

            {search.trim() && matchingStudents.length > 0 && (
              <div className="ap-results">
                {matchingStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className="ap-result"
                    onClick={() => selectStudent(student)}
                  >
                    <div className="ap-result-icon">
                      <Users size={18} />
                    </div>

                    <div className="ap-result-text">
                      <strong>{getStudentName(student)}</strong>
                      <span>
                        {getStudentMatric(student)}
                        {getStudentProgramme(student) && ` · ${getStudentProgramme(student)}`}
                        {getStudentLevel(student) && ` · ${getStudentLevel(student)}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {search.trim() && matchingStudents.length === 0 && (
              <div className="ap-empty">No matching student found.</div>
            )}
          </div>
        ) : (
          <div className="ap-selected-student">
            <div>
              <span className="ap-selected-label">STUDENT TO BE ASSESSED</span>
              <h3>{getStudentName(selectedStudent)}</h3>
              <div className="ap-selected-meta">
                <span>
                  Matric No: <strong>{getStudentMatric(selectedStudent)}</strong>
                </span>
                {getStudentProgramme(selectedStudent) && (
                  <span>
                    Programme: <strong>{getStudentProgramme(selectedStudent)}</strong>
                  </span>
                )}
                {getStudentLevel(selectedStudent) && (
                  <span>
                    Level: <strong>{getStudentLevel(selectedStudent)}</strong>
                  </span>
                )}
              </div>
            </div>

            <button type="button" className="ap-secondary-button" onClick={changeStudent}>
              Change Student
            </button>
          </div>
        )}
      </section>

      {/* SCORING FORM */}

      {selectedStudent && (
        <form onSubmit={submitAssessment} className="ap-form">
          {error && <div className="error">{error}</div>}

          <section className="ap-panel">
            <div className="ap-panel-header">
              <div>
                <h2>Assessment Criteria</h2>
                <p>Enter a score for each — press Enter to jump to the next field</p>
              </div>

              <div className="ap-live-total">
                <span>TOTAL</span>
                <strong>
                  {currentTotal} <small>/ {MAXIMUM_TOTAL}</small>
                </strong>
              </div>
            </div>

            <div className="ap-criteria-row">
              {RUBRIC_FIELDS.map((criterion, index) => (
                <div className="ap-criterion-card" key={criterion.key}>
                  <label htmlFor={criterion.key}>{criterion.label}</label>

                  <div className="ap-score-input-wrap">
                    <input
                      id={criterion.key}
                      ref={(element) => {
                        scoreInputRefs.current[index] = element;
                      }}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max={criterion.maximum}
                      step="0.5"
                      value={scores[criterion.key]}
                      onChange={(event) =>
                        handleScoreChange(criterion, event.target.value)
                      }
                      onKeyDown={(event) => handleScoreKeyDown(event, index)}
                      onFocus={(event) => event.target.select()}
                      placeholder="0"
                      required
                    />
                    <span className="ap-max-label">/ {criterion.maximum}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ap-panel">
            <div className="ap-panel-header">
              <div>
                <h2>Preliminary Result</h2>
                <p>Preview only — the backend calculates the official total and recommendation on save</p>
              </div>
            </div>

            <div className="ap-preview-row">
              <div>
                <span>Preview Total</span>
                <strong>
                  {currentTotal} / {MAXIMUM_TOTAL}
                </strong>
              </div>

              <div>
                <span>Preview Recommendation</span>
                <RecommendationBadge value={previewRecommendation} />
              </div>
            </div>
          </section>

          <section className="ap-panel">
            <div className="ap-panel-header">
              <div>
                <h2>Remarks</h2>
                <p>Optional comments about the presentation</p>
              </div>
            </div>

            <textarea
              ref={remarksRef}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Enter assessment remarks..."
              rows={3}
            />
          </section>

          <div className="ap-actions">
            <button
              type="button"
              className="ap-secondary-button"
              onClick={changeStudent}
              disabled={saving}
            >
              <X size={18} />
              Cancel
            </button>

            <button type="submit" className="ap-save-button" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Assessment
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* =====================================================
   STUDENT MANAGEMENT PAGE
   (add student -> POST /students/ -> refresh -> search list)
===================================================== */

function StudentManagement({ token, students, onLogout, onStudentCreated }) {
  const [form, setForm] = useState(EMPTY_STUDENT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [lookupOptions, setLookupOptions] = useState({});

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Try to populate Programme / Level / Academic Session as dropdowns
  // from whichever lookup endpoint the backend actually exposes. If
  // none of the candidates exist, the field just falls back to free
  // text below — nothing breaks either way.
  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      const lookupFields = STUDENT_FORM_FIELDS.filter(
        (field) => field.type === "lookup"
      );

      for (const field of lookupFields) {
        for (const endpoint of field.lookupEndpoints) {
          try {
            const response = await axios.get(`${API_URL}${endpoint}`, authConfig);
            const options = normalizeListResponse(response.data);

            if (options.length > 0 && !cancelled) {
              setLookupOptions((current) => ({ ...current, [field.key]: options }));
            }

            break;
          } catch {
            // try the next candidate endpoint silently
          }
        }
      }
    }

    loadLookups();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredStudents = useMemo(() => {
    const query = listSearch.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      const haystack = [
        getStudentName(student),
        getStudentMatric(student),
        getStudentProgramme(student),
        getStudentLevel(student),
        getStudentAcademicSession(student),
        getStudentProjectTitle(student),
        getStudentSupervisor(student),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [students, listSearch]);

  function handleFieldChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function optionValue(option, index) {
    if (typeof option === "string") return option;
    return (
      option.name ||
      option.title ||
      option.label ||
      option.programme ||
      option.level ||
      option.session ||
      String(option.id ?? index)
    );
  }

  async function submitStudent(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccessMessage("");

    const missing = STUDENT_FORM_FIELDS.filter(
      (field) => field.required && !String(form[field.key] || "").trim()
    );

    if (missing.length > 0) {
      setError(
        `Please fill in: ${missing.map((field) => field.label).join(", ")}.`
      );
      return;
    }

    const payload = {};

    STUDENT_FORM_FIELDS.forEach((field) => {
      const raw = String(form[field.key] || "").trim();
      payload[field.key] = raw === "" ? null : raw;
    });

    try {
      setSaving(true);

      const response = await axios.post(`${API_URL}/students/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const savedName = getStudentName(response.data) || form.full_name;
      const savedMatric = getStudentMatric(response.data) || form.matriculation_number;

      setSuccessMessage(`Added ${savedName} (${savedMatric}). Ready for the next student.`);

      // Only clear on confirmed success — form stays put on any error.
      setForm(EMPTY_STUDENT_FORM);

      await onStudentCreated();
    } catch (err) {
      console.error("STUDENT SAVE ERROR:", err);

      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if ([401, 403].includes(status)) {
        onLogout();
        return;
      }

      if (status === 404) {
        setError(
          "The /students/ endpoint could not be found. Check that the backend route is /students/."
        );
      } else if (status === 409) {
        setError(detail || "A student with this matriculation number already exists.");
      } else if (status === 422) {
        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item) => `${(item.loc || []).slice(-1)[0] || "field"}: ${item.msg}`)
              .join(" · ")
          );
        } else {
          setError(detail || "Some fields are invalid. Please check and try again.");
        }
      } else if (!err.response) {
        setError("Unable to connect to the server.");
      } else {
        setError(detail || "Unable to save student. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="assessment-page-wrap">
      {/* ADD STUDENT */}

      <section className="ap-panel">
        <div className="ap-panel-header">
          <div>
            <h2>Add Student</h2>
            <p>New students become searchable in Assessments immediately after saving</p>
          </div>

          <UserPlus size={24} />
        </div>

        {error && <div className="error">{error}</div>}
        {successMessage && (
          <div className="success">
            <CheckCircle size={18} />
            {successMessage}
          </div>
        )}

        <form onSubmit={submitStudent}>
          <div className="ap-form-grid">
            {STUDENT_FORM_FIELDS.map((field) => (
              <div className="ap-field" key={field.key}>
                <label htmlFor={`student-${field.key}`}>
                  {field.label}
                  {field.required && " *"}
                </label>

                {field.type === "lookup" && lookupOptions[field.key]?.length > 0 ? (
                  <select
                    id={`student-${field.key}`}
                    value={form[field.key]}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                  >
                    <option value="">Select {field.label}</option>
                    {lookupOptions[field.key].map((option, index) => {
                      const value = optionValue(option, index);
                      return (
                        <option key={`${field.key}-${index}`} value={value}>
                          {value}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === "date" ? (
                  <input
                    id={`student-${field.key}`}
                    type="date"
                    value={form[field.key]}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                  />
                ) : (
                  <input
                    id={`student-${field.key}`}
                    type="text"
                    value={form[field.key]}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="ap-actions">
            <button type="submit" className="ap-save-button" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Student
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* STUDENT LIST */}

      <section className="ap-panel">
        <div className="ap-panel-header">
          <div>
            <h2>Students</h2>
            <p>All students currently available for assessment</p>
          </div>

          <span className="ap-count-pill">{filteredStudents.length} shown</span>
        </div>

        <div className="ap-list-toolbar">
          <Search size={16} />
          <input
            type="text"
            value={listSearch}
            onChange={(event) => setListSearch(event.target.value)}
            placeholder="Search students by name, matric number, programme..."
            autoComplete="off"
          />
        </div>

        {students.length === 0 ? (
          <div className="ap-empty">No students yet — add one above.</div>
        ) : filteredStudents.length === 0 ? (
          <div className="ap-empty">No students match "{listSearch}".</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Matric No.</th>
                  <th>Programme</th>
                  <th>Level</th>
                  <th>Session</th>
                  <th>Project Title</th>
                  <th>Supervisor</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{getStudentName(student)}</td>
                    <td>{getStudentMatric(student)}</td>
                    <td>{getStudentProgramme(student) || "—"}</td>
                    <td>{getStudentLevel(student) || "—"}</td>
                    <td>{getStudentAcademicSession(student) || "—"}</td>
                    <td>{getStudentProjectTitle(student) || "—"}</td>
                    <td>{getStudentSupervisor(student) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* =====================================================
   STUDENT HELPERS
   (fall back across whatever field names the backend uses)
===================================================== */

function getStudentName(student) {
  return student.full_name || student.name || student.student_name || "Unknown Student";
}

function getStudentMatric(student) {
  return (
    student.matriculation_number ||
    student.matric_number ||
    student.matricNo ||
    student.registration_number ||
    "No matriculation number"
  );
}

function getStudentProgramme(student) {
  return student.programme || student.program || student.course || "";
}

function getStudentLevel(student) {
  return student.level || student.year || student.study_level || "";
}

function getStudentAcademicSession(student) {
  return (
    student.academic_session ||
    student.academicSession ||
    student.session ||
    ""
  );
}

function getStudentProjectTitle(student) {
  return student.project_title || student.projectTitle || student.title || "";
}

function getStudentSupervisor(student) {
  return student.supervisor || student.supervisor_name || student.supervisorName || "";
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`stat-card card-${color}`}>
      <div>
        <span>{title}</span>
        <h2>{value}</h2>
      </div>

      <div className="card-icon">{icon}</div>
    </div>
  );
}

/* =====================================================
   RECOMMENDATION BADGE
===================================================== */

function RecommendationBadge({ value }) {
  const recommendation = String(value || "").toLowerCase();

  if (recommendation.includes("pass")) {
    return (
      <span className="recommendation-badge pass">
        <CheckCircle size={16} />
        Pass
      </span>
    );
  }

  if (recommendation.includes("fail")) {
    return (
      <span className="recommendation-badge fail">
        <XCircle size={16} />
        Fail
      </span>
    );
  }

  return <span className="recommendation-badge pending">{value || "Pending"}</span>;
}

/* =====================================================
   SELF-CONTAINED STYLES FOR ASSESSMENTS + STUDENTS
   (works regardless of what's currently in App.css)
===================================================== */

const PANEL_STYLES = `
.assessment-page-wrap { display: flex; flex-direction: column; gap: 1.25rem; }

.ap-panel {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e2e2e2);
  border-radius: 12px;
  padding: 1.25rem;
}

.ap-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.ap-panel-header h2 { margin: 0 0 0.25rem 0; font-size: 1.05rem; }
.ap-panel-header p { margin: 0; font-size: 0.85rem; color: var(--text-muted, #6b7280); }

.ap-search-wrap { position: relative; }

.ap-search-wrap input,
.ap-form textarea {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d1d5db);
  font-size: 0.95rem;
  box-sizing: border-box;
}

.ap-results {
  margin-top: 0.5rem;
  border: 1px solid var(--border-color, #e2e2e2);
  border-radius: 10px;
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
}

.ap-result {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  cursor: pointer;
  text-align: left;
}

.ap-result:last-child { border-bottom: none; }
.ap-result:hover { background: var(--hover-bg, #f5f7fb); }

.ap-result-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft, #eef2ff);
  color: var(--accent, #4f46e5);
}

.ap-result-text { display: flex; flex-direction: column; gap: 0.15rem; overflow: hidden; }
.ap-result-text strong { font-size: 0.9rem; }
.ap-result-text span { font-size: 0.78rem; color: var(--text-muted, #6b7280); }

.ap-empty {
  margin-top: 0.5rem;
  padding: 0.75rem;
  text-align: center;
  color: var(--text-muted, #6b7280);
  font-size: 0.85rem;
}

.ap-selected-student {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.ap-selected-label {
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--text-muted, #6b7280);
}

.ap-selected-student h3 { margin: 0.25rem 0 0.5rem 0; }

.ap-selected-meta { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; font-size: 0.85rem; }
.ap-selected-meta span { color: var(--text-muted, #6b7280); }

.ap-secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d1d5db);
  background: var(--card-bg, #fff);
  cursor: pointer;
  font-size: 0.85rem;
}

.ap-live-total { text-align: right; flex-shrink: 0; }

.ap-live-total span {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: var(--text-muted, #6b7280);
}

.ap-live-total strong { font-size: 1.4rem; }
.ap-live-total strong small { font-size: 0.9rem; color: var(--text-muted, #6b7280); }

/* Eight criteria in a single horizontal row; scrolls sideways
   instead of wrapping so scoring stays compact and fast. */
.ap-criteria-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
}

.ap-criterion-card {
  flex: 0 0 150px;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px;
}

.ap-criterion-card label {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  min-height: 2.1em;
}

.ap-score-input-wrap { display: flex; align-items: center; gap: 0.4rem; }

.ap-score-input-wrap input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #d1d5db);
  font-size: 1rem;
  text-align: center;
}

.ap-max-label { font-size: 0.78rem; color: var(--text-muted, #6b7280); white-space: nowrap; }

.ap-preview-row { display: flex; gap: 2rem; flex-wrap: wrap; }
.ap-preview-row > div { display: flex; flex-direction: column; gap: 0.3rem; }
.ap-preview-row span { font-size: 0.75rem; color: var(--text-muted, #6b7280); }
.ap-preview-row strong { font-size: 1.1rem; }

.ap-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }

.ap-save-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  border: none;
  background: var(--accent, #4f46e5);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.ap-save-button:disabled,
.ap-secondary-button:disabled { opacity: 0.6; cursor: not-allowed; }

/* Students page: form grid + list toolbar */

.ap-form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.ap-field { display: flex; flex-direction: column; gap: 0.35rem; flex: 1 1 200px; min-width: 180px; }
.ap-field label { font-size: 0.8rem; font-weight: 600; }

.ap-field input,
.ap-field select {
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d1d5db);
  font-size: 0.9rem;
  box-sizing: border-box;
}

.ap-list-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
  position: relative;
}

.ap-list-toolbar svg { position: absolute; left: 0.7rem; color: var(--text-muted, #6b7280); }

.ap-list-toolbar input {
  flex: 1;
  padding: 0.55rem 0.7rem 0.55rem 2.1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d1d5db);
  box-sizing: border-box;
}

.ap-count-pill { font-size: 0.75rem; color: var(--text-muted, #6b7280); white-space: nowrap; }

@media (max-width: 640px) {
  .ap-panel-header { flex-direction: column; }
  .ap-live-total { text-align: left; }
}
`;

export default App;
