import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  
  GraduationCap,
  Users,
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
  Plus,
  Search,
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  FileText,
  UserPlus,
  Trash2,
  ShieldCheck,
  Building2,
  Layers,
  Settings,
} from "lucide-react";

const API_URL = "https://ems-backend-app-2ju7.onrender.com";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
];

const RUBRIC_FIELDS = [
  { key: "dress", label: "Dress & Appearance", maximum: 10 },
  { key: "report_format", label: "Report Format", maximum: 10 },
  { key: "problem_solved", label: "Problem Solved", maximum: 15 },
  { key: "clarity_of_writeup", label: "Clarity of Write-up", maximum: 10 },
  { key: "result_presentation", label: "Result Presentation", maximum: 15 },
  { key: "evidence_of_understanding", label: "Evidence of Understanding", maximum: 10 },
  { key: "knowledge_contribution", label: "Knowledge Contribution", maximum: 15 },
  { key: "reference", label: "Reference", maximum: 15 },
];

const MAXIMUM_TOTAL = RUBRIC_FIELDS.reduce(
  (sum, item) => sum + item.maximum,
  0
);

const EMPTY_SCORES = Object.fromEntries(
  RUBRIC_FIELDS.map((item) => [item.key, ""])
);

const EMPTY_STUDENT_FORM = {
  matric_number: "",
  full_name: "",
  programme_id: "",
  level_id: "",
  academic_session_id: "",
  project_title: "",
  supervisor: "",
  presentation_date: "",
};

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [authView, setAuthView] = useState("login");

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
    setAuthView("login");
  }

  if (!token) {
    if (authView === "signup") {
      return (
        <StudentSignup
          onSignedUp={handleLogin}
          onSwitchToLogin={() => setAuthView("login")}
          theme={theme}
          onThemeChange={setTheme}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onSwitchToSignup={() => setAuthView("signup")}
        theme={theme}
        onThemeChange={setTheme}
      />
    );
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

function ThemeSwitcher({
  theme,
  onThemeChange,
  className = "",
}) {
  return (
    <div className={`theme-switcher ${className}`}>
      <select
        value={theme}
        onChange={(event) =>
          onThemeChange(event.target.value)
        }
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

function Login({
  onLogin,
  onSwitchToSignup,
  theme,
  onThemeChange,
}) {
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
        {
          username,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      onLogin(response.data.access_token);
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Invalid username or password."
        );
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
        <ThemeSwitcher
          theme={theme}
          onThemeChange={onThemeChange}
        />
      </div>

      <div className="login-card">
        <div className="login-icon">
          <GraduationCap size={42} />
          <Sparkles
            className="sparkle-icon"
            size={18}
          />
        </div>

        <h1>EMS</h1>

        <p className="login-subtitle">
          Educational Management System
        </p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

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

        <button
          type="button"
          className="login-link-button"
          onClick={onSwitchToSignup}
        >
          New student? Create an account
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   STUDENT SIGN UP
===================================================== */

function StudentSignup({
  onSignedUp,
  onSwitchToLogin,
  theme,
  onThemeChange,
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/student-signup`,
        {
          username: username.trim(),
          password,
          full_name: fullName.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      onSignedUp(response.data.access_token);
    } catch (err) {
      console.error("SIGNUP ERROR:", err);

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else if (err.response) {
        setError(detail || "Unable to create your account.");
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
        <ThemeSwitcher
          theme={theme}
          onThemeChange={onThemeChange}
        />
      </div>

      <div className="login-card">
        <div className="login-icon">
          <GraduationCap size={42} />
          <Sparkles className="sparkle-icon" size={18} />
        </div>

        <h1>Student Sign Up</h1>

        <p className="login-subtitle">
          Create your account to submit your project details
        </p>

        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label>Full Name</label>

            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="input-group">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="e.g. your matriculation number"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Re-enter your password"
              required
            />
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <button
          type="button"
          className="login-link-button"
          onClick={onSwitchToLogin}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({
  token,
  onLogout,
  theme,
  onThemeChange,
}) {
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [assessmentView, setAssessmentView] =
    useState("dashboard");

  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/students/`, config),
        axios.get(`${API_URL}/assessments/`, config),
        axios.get(`${API_URL}/users/`, config),
        axios.get(`${API_URL}/users/me`, config),
      ]);

      const [
        studentResult,
        assessmentResult,
        userResult,
        meResult,
      ] = results;

      if (studentResult.status === "fulfilled") {
        setStudents(
          extractArray(
            studentResult.value.data,
            "students"
          )
        );
      }

      if (assessmentResult.status === "fulfilled") {
        setAssessments(
          extractArray(
            assessmentResult.value.data,
            "assessments"
          )
        );
      }

      if (userResult.status === "fulfilled") {
        setUsers(
          extractArray(
            userResult.value.data,
            "users"
          )
        );
      } else {
        // Non-admins get 403 here (the users list is admin-only) --
        // that's expected, not a sign of an invalid session.
        setUsers([]);
      }

      if (meResult.status === "fulfilled") {
        setCurrentUser(meResult.value.data);
      }

      // Only an expired/invalid token should force a logout. A 403 on
      // an admin-only endpoint (like /users/) is a normal permission
      // restriction for assessor/external_supervisor accounts, not an
      // authentication failure.
      const unauthorized = results.some(
        (result) =>
          result.status === "rejected" &&
          result.reason?.response?.status === 401
      );

      if (unauthorized) {
        onLogout();
        return;
      }

      const allFailed = results.every(
        (result) => result.status === "rejected"
      );

      if (allFailed) {
        setError(
          "Unable to load dashboard data."
        );
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleAssessmentSaved(
    confirmationText
  ) {
    setSuccessMessage(confirmationText);

    await loadDashboard();

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  }

  async function handleStudentSaved() {
    await loadDashboard();
  }

  const totalStudents = students.length;
  const totalAssessments = assessments.length;
  const totalUsers = users.length;

  const passed = assessments.filter(
    (item) =>
      String(item.recommendation || "")
        .toLowerCase() === "pass"
  ).length;

  const failed = assessments.filter(
    (item) =>
      String(item.recommendation || "")
        .toLowerCase() === "fail"
  ).length;

  const averageScore =
    assessments.length > 0
      ? (
          assessments.reduce(
            (sum, item) =>
              sum +
              Number(item.total_score || 0),
            0
          ) / assessments.length
        ).toFixed(2)
      : "0.00";

  const passRate =
    assessments.length > 0
      ? (
          (passed / assessments.length) *
          100
        ).toFixed(1)
      : "0.0";

  const activeUsers = users.filter(
    (user) => user.is_active
  ).length;

  return (
    <div className="dashboard-layout">
      <aside
        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <GraduationCap size={25} />
          </div>

          <div>
            <h2>EMS</h2>
            <span>
              Educational Management
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${
              assessmentView === "dashboard"
                ? "active"
                : ""
            }`}
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
            className={`nav-item ${
              assessmentView === "students"
                ? "active"
                : ""
            }`}
            type="button"
            onClick={() => {
              setAssessmentView("students");
              setSidebarOpen(false);
            }}
          >
            <Users size={19} />
            Students
          </button>

          {currentUser?.role !== "student" && (
            <button
              className={`nav-item ${
                assessmentView === "assessment"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() => {
                setAssessmentView("assessment");
                setSidebarOpen(false);
              }}
            >
              <ClipboardCheck size={19} />
              Assessments
            </button>
          )}

          {currentUser?.role !== "student" && (
            <button
              className={`nav-item ${
                assessmentView === "import"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() => {
                setAssessmentView("import");
                setSidebarOpen(false);
              }}
            >
              <Upload size={19} />
              Import Excel
            </button>
          )}

          {(currentUser?.role === "admin" ||
            currentUser?.role === "external_supervisor") && (
            <button
              className={`nav-item ${
                assessmentView === "external"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() => {
                setAssessmentView("external");
                setSidebarOpen(false);
              }}
            >
              <ShieldCheck size={19} />
              External Score
            </button>
          )}

          <button
            className={`nav-item ${
              assessmentView === "report"
                ? "active"
                : ""
            }`}
            type="button"
            onClick={() => {
              setAssessmentView("report");
              setSidebarOpen(false);
            }}
          >
            <FileText size={19} />
            Reports
          </button>

          {currentUser?.role === "admin" && (
            <button
              className={`nav-item ${
                assessmentView === "users"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() => {
                setAssessmentView("users");
                setSidebarOpen(false);
              }}
            >
              <UserCog size={19} />
              Users
            </button>
          )}

          {currentUser?.role === "admin" && (
            <button
              className={`nav-item ${
                assessmentView === "academic-setup"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() => {
                setAssessmentView("academic-setup");
                setSidebarOpen(false);
              }}
            >
              <GraduationCap size={19} />
              Academic Setup
            </button>
          )}

          {currentUser?.role !== "student" && (
            <button
              className={`nav-item ${
                assessmentView === "sessions"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() => {
                setAssessmentView("sessions");
                setSidebarOpen(false);
              }}
            >
              <BookOpen size={19} />
              Sessions
            </button>
          )}
        </nav>
        <div className="sidebar-footer">
          <button
            className="nav-item logout-item"
            onClick={onLogout}
            type="button"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button
              className="mobile-menu"
              onClick={() =>
                setSidebarOpen(
                  (current) => !current
                )
              }
              type="button"
            >
              {sidebarOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>

            <div className="header-icon">
              {assessmentView ===
              "assessment" ? (
                <ClipboardCheck size={25} />
              ) : assessmentView ===
                "students" ? (
                <Users size={25} />
              ) : assessmentView ===
                "import" ? (
                <FileSpreadsheet size={25} />
              ) : assessmentView ===
                "external" ? (
                <ShieldCheck size={25} />
              ) : assessmentView ===
                "report" ? (
                <FileText size={25} />
              ) : assessmentView ===
                "users" ? (
                <UserCog size={25} />
              ) : assessmentView ===
                "academic-setup" ? (
                <GraduationCap size={25} />
              ) : assessmentView ===
                "sessions" ? (
                <BookOpen size={25} />
              ) : (
                <BarChart3 size={25} />
              )}
            </div>

            <div>
              <h1>
                {assessmentView ===
                "assessment"
                  ? "Student Assessment"
                  : assessmentView ===
                    "students"
                  ? "Student Management"
                  : assessmentView ===
                    "import"
                  ? "Import Excel"
                  : assessmentView ===
                    "external"
                  ? "External Supervisor Score"
                  : assessmentView ===
                    "report"
                  ? "Assessment Report"
                  : assessmentView ===
                    "users"
                  ? "User Management"
                  : assessmentView ===
                    "academic-setup"
                  ? "Academic Setup"
                  : assessmentView ===
                    "sessions"
                  ? "Academic Sessions"
                  : "Dashboard"}
              </h1>

              <p>
                {assessmentView ===
                "assessment"
                  ? "Assess the student presenting the project"
                  : assessmentView ===
                    "students"
                  ? "Register and manage students"
                  : assessmentView ===
                    "import"
                  ? "Upload a grading sheet to score students in bulk"
                  : assessmentView ===
                    "external"
                  ? "Record the final-stage score, once internal scoring is complete"
                  : assessmentView ===
                    "report"
                  ? "Aggregate internal & external scores per student"
                  : assessmentView ===
                    "users"
                  ? "Create and manage assessor & supervisor accounts"
                  : assessmentView ===
                    "academic-setup"
                  ? "Manage departments, programmes, levels & sessions"
                  : assessmentView ===
                    "sessions"
                  ? "Browse students with results by academic session"
                  : "Assessment Management Overview"}
              </p>
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
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "spinning"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              className="logout-button"
              onClick={onLogout}
              type="button"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </header>

        <div className="content">
          {successMessage && (
            <div className="success">
              <CheckCircle size={18} />
              {successMessage}
            </div>
          )}

          {assessmentView ===
          "students" ? (
            <StudentManagement
              token={token}
              students={students}
              onLogout={onLogout}
              onSaved={handleStudentSaved}
              currentUser={currentUser}
            />
          ) : assessmentView ===
            "assessment" ? (
            <AssessmentPage
              token={token}
              students={students}
              onLogout={onLogout}
              onSaved={
                handleAssessmentSaved
              }
            />
          ) : assessmentView ===
            "import" ? (
            <ImportExcel
              token={token}
              onLogout={onLogout}
              onImported={handleAssessmentSaved}
              currentUser={currentUser}
            />
          ) : assessmentView ===
            "external" ? (
            <ExternalAssessmentPage
              token={token}
              students={students}
              onLogout={onLogout}
              onSaved={handleAssessmentSaved}
            />
          ) : assessmentView ===
            "report" ? (
            <ReportView
              token={token}
              students={students}
              onLogout={onLogout}
              currentUser={currentUser}
            />
          ) : assessmentView ===
            "users" ? (
            <AdminUsers
              token={token}
              users={users}
              onLogout={onLogout}
              onSaved={handleStudentSaved}
            />
          ) : assessmentView ===
            "academic-setup" ? (
            <AcademicSetup
              token={token}
              onLogout={onLogout}
            />
          ) : assessmentView ===
            "sessions" ? (
            <SessionsView
              token={token}
              students={students}
              assessments={assessments}
              onLogout={onLogout}
            />
          ) : (
            <>
              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              {currentUser?.role === "student" ? (
                <StudentDashboardOverview
                  token={token}
                  onLogout={onLogout}
                  currentUser={currentUser}
                />
              ) : (
                <>
              <div className="stat-cards">
                <StatCard
                  title="Total Students"
                  value={totalStudents}
                  icon={<Users />}
                  color="blue"
                />

                <StatCard
                  title="Assessments"
                  value={totalAssessments}
                  icon={
                    <ClipboardCheck />
                  }
                  color="purple"
                />

                <StatCard
                  title="System Users"
                  value={totalUsers}
                  icon={<UserCog />}
                  color="green"
                />

                <StatCard
                  title="Average Score"
                  value={averageScore}
                  icon={<BarChart3 />}
                  color="orange"
                />

                <StatCard
                  title="Passed"
                  value={passed}
                  icon={<CheckCircle />}
                  color="indigo"
                />

                <StatCard
                  title="Failed"
                  value={failed}
                  icon={<XCircle />}
                  color="red"
                />
              </div>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      Recent Assessments
                    </h2>

                    <p>
                      Latest student project
                      assessment records
                    </p>
                  </div>

                  <ClipboardCheck size={24} />
                </div>

                {loading ? (
                  <div className="empty-state">
                    <div className="loading-spinner" />
                    Loading assessments...
                  </div>
                ) : assessments.length ===
                  0 ? (
                  <div className="empty-state">
                    No assessments
                    available.
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>
                            Student
                          </th>
                          <th>
                            Total Score
                          </th>
                          <th>
                            Recommendation
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {assessments
                          .slice(-10)
                          .reverse()
                          .map(
                            (
                              assessment
                            ) => (
                              <tr
                                key={
                                  assessment.id
                                }
                              >
                                <td>
                                  #
                                  {
                                    assessment.id
                                  }
                                </td>

                                <td>
                                  Student #
                                  {
                                    assessment.student_id
                                  }
                                </td>

                                <td>
                                  <span className="score-value">
                                    {
                                      assessment.total_score
                                    }
                                  </span>
                                </td>

                                <td>
                                  <RecommendationBadge
                                    value={
                                      assessment.recommendation
                                    }
                                  />
                                </td>
                              </tr>
                            )
                          )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="bottom-grid">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>
                        Assessment Summary
                      </h2>
                    </div>

                    <BarChart3 size={23} />
                  </div>

                  <div className="summary-row">
                    <div className="summary-item">
                      <CheckCircle size={20} />
                      <span>
                        Passed
                      </span>
                      <strong>
                        {passed}
                      </strong>
                      <small>
                        {passRate}%
                      </small>
                    </div>

                    <div className="summary-item">
                      <XCircle size={20} />
                      <span>
                        Failed
                      </span>
                      <strong>
                        {failed}
                      </strong>
                      <small>
                        {(
                          100 -
                          parseFloat(
                            passRate
                          )
                        ).toFixed(1)}
                        %
                      </small>
                    </div>

                    <div className="summary-item">
                      <ClipboardCheck size={20} />
                      <span>
                        Total
                      </span>
                      <strong>
                        {totalAssessments}
                      </strong>
                      <small>
                        entries
                      </small>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>
                        System Overview
                      </h2>
                    </div>

                    <GraduationCap size={23} />
                  </div>

                  <div className="overview-list">
                    <div>
                      <span>
                        Students registered
                      </span>

                      <strong>
                        {totalStudents}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Assessments completed
                      </span>

                      <strong>
                        {totalAssessments}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Active users
                      </span>

                      <strong>
                        {activeUsers}
                      </strong>
                    </div>
                  </div>
                </section>
              </div>
              </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* =====================================================
   STUDENT MANAGEMENT
===================================================== */

/* =====================================================
   STUDENT DOCUMENTS PANEL (shared: self-service + admin)
===================================================== */

function StudentDocumentsPanel({
  token,
  studentId,
  documents,
  onLogout,
  onChanged,
}) {
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  function formatSize(bytes) {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      await axios.post(
        `${API_URL}/students/${studentId}/documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      await onChanged();
    } catch (err) {
      console.error("DOCUMENT UPLOAD ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to upload this document. Please try again."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(doc) {
    setError("");

    try {
      setDownloadingId(doc.id);

      const response = await axios.get(
        `${API_URL}/students/${studentId}/documents/${doc.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCUMENT DOWNLOAD ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      setError("Unable to download this document.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(doc) {
    if (
      !window.confirm(`Remove "${doc.file_name}"? This cannot be undone.`)
    ) {
      return;
    }

    setError("");

    try {
      setDeletingId(doc.id);

      await axios.delete(
        `${API_URL}/students/${studentId}/documents/${doc.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await onChanged();
    } catch (err) {
      console.error("DOCUMENT DELETE ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      setError("Unable to remove this document.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="ap-panel">
      <div className="ap-panel-header">
        <div>
          <h2>Project Documents</h2>
          <p>Upload your project report, slides, or other files.</p>
        </div>

        <FileText size={23} />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="import-form">
        <label
          className="import-dropzone"
          style={{ padding: "1.5rem 1rem" }}
        >
          <Upload size={24} />

          <span className="import-dropzone-title">
            {uploading ? "Uploading..." : "Click to upload a file"}
          </span>

          <span className="import-dropzone-hint">
            PDF, Word, PowerPoint, or image -- up to 20MB
          </span>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {documents && documents.length > 0 ? (
        <div className="table-container" style={{ marginTop: "14px" }}>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.file_name}</strong>
                  </td>

                  <td>{formatSize(doc.file_size)}</td>

                  <td>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>

                  <td
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      className="ap-secondary-button"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                    >
                      {downloadingId === doc.id ? (
                        <span className="spinner" />
                      ) : (
                        "Download"
                      )}
                    </button>

                    <button
                      type="button"
                      className="ap-secondary-button"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? (
                        <span className="spinner" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: "14px" }}>
          <p>No documents uploaded yet.</p>
        </div>
      )}
    </section>
  );
}

function StudentManagement({
  token,
  students,
  onLogout,
  onSaved,
  currentUser,
}) {
  const isStudentRole = currentUser?.role === "student";

  const [mode, setMode] = useState(
    () => (isStudentRole ? "add" : "list")
  );

  const [search, setSearch] =
    useState("");

  const [form, setForm] = useState(
    EMPTY_STUDENT_FORM
  );

  const [editingStudent, setEditingStudent] =
    useState(null);

  const [checkingOwnRecord, setCheckingOwnRecord] =
    useState(isStudentRole);

  const [programmes, setProgrammes] =
    useState([]);

  const [levels, setLevels] =
    useState([]);

  const [sessions, setSessions] =
    useState([]);

  const [optionErrors, setOptionErrors] =
    useState({
      programmes: false,
      levels: false,
      sessions: false,
    });

  const [loadingOptions, setLoadingOptions] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadOptions() {
    try {
      setLoadingOptions(true);
      setError("");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const results =
        await Promise.allSettled([
          axios.get(
            `${API_URL}/programmes/`,
            config
          ),
          axios.get(
            `${API_URL}/levels/`,
            config
          ),
          axios.get(
            `${API_URL}/sessions/`,
            config
          ),
        ]);

      const [
        programmeResult,
        levelResult,
        sessionResult,
      ] = results;

      const newErrors = {
        programmes: false,
        levels: false,
        sessions: false,
      };

      if (
        programmeResult.status ===
        "fulfilled"
      ) {
        setProgrammes(
          extractArray(
            programmeResult.value.data,
            "programmes"
          )
        );
      } else {
        newErrors.programmes = true;
        setProgrammes([]);
      }

      if (
        levelResult.status ===
        "fulfilled"
      ) {
        setLevels(
          extractArray(
            levelResult.value.data,
            "levels"
          )
        );
      } else {
        newErrors.levels = true;
        setLevels([]);
      }

      if (
        sessionResult.status ===
        "fulfilled"
      ) {
        setSessions(
          extractArray(
            sessionResult.value.data,
            "sessions"
          )
        );
      } else {
        newErrors.sessions = true;
        setSessions([]);
      }

      setOptionErrors(newErrors);

      const unauthorized =
        results.some(
          (result) =>
            result.status ===
              "rejected" &&
            [401, 403].includes(
              result.reason?.response
                ?.status
            )
        );

      if (unauthorized) {
        onLogout();
        return;
      }

      const failedLabels = [];

      if (newErrors.programmes) {
        failedLabels.push(
          "Programmes"
        );
      }

      if (newErrors.levels) {
        failedLabels.push("Levels");
      }

      if (newErrors.sessions) {
        failedLabels.push(
          "Academic Sessions"
        );
      }

      if (failedLabels.length > 0) {
        setError(
          `Unable to load: ${failedLabels.join(
            ", "
          )}. Check the backend endpoint(s) and try again.`
        );
      }
    } catch (err) {
      console.error(
        "OPTIONS ERROR:",
        err
      );

      setError(
        "Unable to load programme, level or session options."
      );

      setOptionErrors({
        programmes: true,
        levels: true,
        sessions: true,
      });
    } finally {
      setLoadingOptions(false);
    }
  }

  function openAddStudent() {
    setForm(EMPTY_STUDENT_FORM);
    setEditingStudent(null);
    setError("");
    setSuccess("");

    loadOptions();
    setMode("add");
  }

  function openEditStudent(student) {
    setForm({
      matric_number: student.matric_number || "",
      full_name: student.full_name || "",
      programme_id: student.programme_id || "",
      level_id: student.level_id || "",
      academic_session_id:
        student.academic_session_id || "",
      project_title: student.project_title || "",
      supervisor: student.supervisor || "",
      presentation_date:
        student.presentation_date || "",
    });

    setEditingStudent(student);
    setError("");
    setSuccess("");
    setMode("add");
  }

  async function refreshEditingStudent(studentId) {
    try {
      const response = await axios.get(
        `${API_URL}/students/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditingStudent(response.data);
    } catch (err) {
      console.error(
        "REFRESH STUDENT ERROR:",
        err
      );

      if (
        [401, 403].includes(
          err.response?.status
        )
      ) {
        onLogout();
      }
    }
  }

  useEffect(() => {
    if (!isStudentRole) return;

    let isMounted = true;

    async function loadMyRecord() {
      setCheckingOwnRecord(true);

      try {
        const response = await axios.get(
          `${API_URL}/students/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!isMounted) return;

        const student = response.data;

        setForm({
          matric_number: student.matric_number || "",
          full_name: student.full_name || "",
          programme_id: student.programme_id || "",
          level_id: student.level_id || "",
          academic_session_id:
            student.academic_session_id || "",
          project_title: student.project_title || "",
          supervisor: student.supervisor || "",
          presentation_date:
            student.presentation_date || "",
        });

        setEditingStudent(student);
      } catch (err) {
        if (!isMounted) return;

        if (err.response?.status !== 404) {
          console.error(
            "MY RECORD ERROR:",
            err
          );

          if (
            [401, 403].includes(
              err.response?.status
            )
          ) {
            onLogout();
            return;
          }
        }

        // 404 just means they haven't submitted yet -- the empty
        // create form (already the default) is exactly right.
      } finally {
        if (isMounted) setCheckingOwnRecord(false);
      }
    }

    loadOptions();
    loadMyRecord();
    setMode("add");

    return () => {
      isMounted = false;
    };
  }, [isStudentRole, token]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveStudent(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const isEditing = Boolean(editingStudent);

    if (!isEditing) {
      if (
        programmes.length === 0 ||
        levels.length === 0 ||
        sessions.length === 0
      ) {
        setError(
          "Programme, Level and Academic Session options must all load successfully before a student can be registered."
        );

        return;
      }

      const requiredFields = [
        "matric_number",
        "full_name",
        "programme_id",
        "level_id",
        "academic_session_id",
      ];

      const missing =
        requiredFields.filter(
          (field) =>
            !String(
              form[field] || ""
            ).trim()
        );

      if (missing.length > 0) {
        setError(
          "Please complete all required student information."
        );

        return;
      }
    } else if (!String(form.full_name || "").trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setSaving(true);

      let savedStudent;

      if (isEditing) {
        // Matric number, programme, level and session are locked
        // once a record exists -- only these fields can be updated.
        const updatePayload = {
          full_name: form.full_name.trim(),

          project_title:
            form.project_title.trim() || null,

          supervisor:
            form.supervisor.trim() || null,

          presentation_date:
            form.presentation_date || null,
        };

        const response = await axios.put(
          `${API_URL}/students/${editingStudent.id}`,
          updatePayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        savedStudent = response.data;

        setSuccess(
          `${getStudentName(
            savedStudent
          )}'s details have been updated.`
        );
      } else {
        const payload = {
          matric_number:
            form.matric_number.trim(),

          full_name:
            form.full_name.trim(),

          programme_id:
            Number(form.programme_id),

          level_id:
            Number(form.level_id),

          academic_session_id:
            Number(
              form.academic_session_id
            ),

          project_title:
            form.project_title.trim() ||
            null,

          supervisor:
            form.supervisor.trim() ||
            null,

          presentation_date:
            form.presentation_date ||
            null,
        };

        const response =
          await axios.post(
            `${API_URL}/students/`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },
            }
          );

        savedStudent = response.data;

        setSuccess(
          `${getStudentName(
            savedStudent
          )} has been registered successfully.`
        );
      }

      await onSaved();

      // Move straight into edit mode for the saved record so a
      // document can be attached right away, without losing the
      // success message or bouncing back to the list.
      setEditingStudent(savedStudent);

      setForm({
        matric_number: savedStudent.matric_number || "",
        full_name: savedStudent.full_name || "",
        programme_id: savedStudent.programme_id || "",
        level_id: savedStudent.level_id || "",
        academic_session_id:
          savedStudent.academic_session_id || "",
        project_title: savedStudent.project_title || "",
        supervisor: savedStudent.supervisor || "",
        presentation_date:
          savedStudent.presentation_date || "",
      });

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(
        "STUDENT SAVE ERROR:",
        err
      );

      if (
        [401, 403].includes(
          err.response?.status
        )
      ) {
        onLogout();
        return;
      }

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item) => item.msg
            )
            .join(", ")
        );
      } else {
        setError(
          detail ||
            "Unable to save student."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) return students;

      return students.filter(
        (student) => {
          const name =
            getStudentName(
              student
            ).toLowerCase();

          const matric =
            getStudentMatric(
              student
            ).toLowerCase();

          return (
            name.includes(query) ||
            matric.includes(query)
          );
        }
      );
    }, [students, search]);

  if (mode === "add") {
    const isEditing = Boolean(editingStudent);

    const hasAnyOptionError =
      optionErrors.programmes ||
      optionErrors.levels ||
      optionErrors.sessions;

    const canSubmit = isEditing
      ? !saving
      : !saving &&
        !loadingOptions &&
        programmes.length > 0 &&
        levels.length > 0 &&
        sessions.length > 0;

    if (isStudentRole && checkingOwnRecord) {
      return (
        <div className="student-page">
          <section className="panel">
            <div className="empty-state">
              <div className="loading-spinner" />
              <p>Loading your details...</p>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="student-page">
        <div className="student-page-header">
          <div>
            {!isStudentRole && (
              <button
                type="button"
                className="ap-secondary-button"
                onClick={() => {
                  setMode("list");
                  setEditingStudent(null);
                }}
              >
                <ArrowLeft size={17} />
                Back to Students
              </button>
            )}

            <h2>
              {isStudentRole
                ? "My Student Details"
                : isEditing
                ? "Edit Student"
                : "Register New Student"}
            </h2>

            <p>
              {isStudentRole
                ? "Submit your project details and documents ahead of your presentation."
                : isEditing
                ? "Update this student's project information, or complete their submission on their behalf."
                : "Enter the student's academic and project information."}
            </p>
          </div>
        </div>

        {error && (
          <div className="error">
            {error}

            {hasAnyOptionError && (
              <div
                style={{
                  marginTop: ".5rem",
                }}
              >
                <button
                  type="button"
                  className="ap-secondary-button"
                  onClick={
                    loadOptions
                  }
                  disabled={
                    loadingOptions
                  }
                >
                  <RefreshCw
                    size={15}
                    className={
                      loadingOptions
                        ? "spinning"
                        : ""
                    }
                  />

                  Retry Loading
                  Options
                </button>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="success">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <form
          className="student-form"
          onSubmit={saveStudent}
        >
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  Student Information
                </h2>

                <p>
                  Required student
                  identification details.
                </p>
              </div>

              <Users size={23} />
            </div>

            <div className="student-form-grid">
              <div className="input-group">
                <label>
                  Full Name *
                </label>

                <input
                  name="full_name"
                  value={
                    form.full_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter student's full name"
                  required
                />
              </div>

              <div className="input-group">
                <label>
                  Matriculation Number *
                </label>

                {isEditing ? (
                  <input
                    value={
                      form.matric_number
                    }
                    disabled
                    readOnly
                  />
                ) : (
                  <input
                    name="matric_number"
                    value={
                      form.matric_number
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. CSC/2022/001"
                    required
                  />
                )}
              </div>

              <div className="input-group">
                <label>
                  Programme *
                </label>

                {isEditing ? (
                  <input
                    value={
                      editingStudent
                        ?.programme
                        ?.name || "—"
                    }
                    disabled
                    readOnly
                  />
                ) : (
                  <select
                    name="programme_id"
                    value={
                      form.programme_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      loadingOptions ||
                      programmes.length ===
                        0
                    }
                  >
                    <option value="">
                      {getSelectPlaceholder(
                        "Programme",
                        programmes,
                        loadingOptions,
                        optionErrors.programmes
                      )}
                    </option>

                    {programmes.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name ||
                            item.programme_name ||
                            item.code ||
                            `Programme #${item.id}`}
                        </option>
                      )
                    )}
                  </select>
                )}
              </div>

              <div className="input-group">
                <label>
                  Level *
                </label>

                {isEditing ? (
                  <input
                    value={
                      editingStudent
                        ?.level
                        ?.name || "—"
                    }
                    disabled
                    readOnly
                  />
                ) : (
                  <select
                    name="level_id"
                    value={
                      form.level_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      loadingOptions ||
                      levels.length === 0
                    }
                  >
                    <option value="">
                      {getSelectPlaceholder(
                        "Level",
                        levels,
                        loadingOptions,
                        optionErrors.levels
                      )}
                    </option>

                    {levels.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name ||
                            item.level_name ||
                            item.title ||
                            `Level #${item.id}`}
                        </option>
                      )
                    )}
                  </select>
                )}
              </div>

              <div className="input-group">
                <label>
                  Academic Session *
                </label>

                {isEditing ? (
                  <input
                    value={
                      editingStudent
                        ?.academic_session
                        ?.name || "—"
                    }
                    disabled
                    readOnly
                  />
                ) : (
                  <select
                    name="academic_session_id"
                    value={
                      form.academic_session_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      loadingOptions ||
                      sessions.length === 0
                    }
                  >
                    <option value="">
                      {getSelectPlaceholder(
                        "Academic Session",
                        sessions,
                        loadingOptions,
                        optionErrors.sessions
                      )}
                    </option>

                    {sessions.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name ||
                            item.session_name ||
                            item.title ||
                            `Session #${item.id}`}
                        </option>
                      )
                    )}
                  </select>
                )}
              </div>

              <div className="input-group">
                <label>
                  Presentation Date
                </label>

                <input
                  type="date"
                  name="presentation_date"
                  value={
                    form.presentation_date
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  Project Information
                </h2>

                <p>
                  Information about the
                  student's final year
                  project.
                </p>
              </div>

              <BookOpen size={23} />
            </div>

            <div className="student-form-grid">
              <div className="input-group student-full-width">
                <label>
                  Project Title
                </label>

                <input
                  name="project_title"
                  value={
                    form.project_title
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter project title"
                />
              </div>

              <div className="input-group student-full-width">
                <label>
                  Supervisor
                </label>

                <input
                  name="supervisor"
                  value={
                    form.supervisor
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter supervisor name"
                />
              </div>
            </div>
          </section>

          <div className="student-form-actions">
            {!isStudentRole && (
              <button
                type="button"
                className="ap-secondary-button"
                onClick={() => {
                  setMode("list");
                  setEditingStudent(null);
                }}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="ap-save-button"
              disabled={!canSubmit}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  {isEditing
                    ? "Saving Changes..."
                    : "Saving Student..."}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing
                    ? "Save Changes"
                    : "Save Student"}
                </>
              )}
            </button>
          </div>
        </form>

        {editingStudent && (
          <StudentDocumentsPanel
            token={token}
            studentId={editingStudent.id}
            documents={editingStudent.documents}
            onLogout={onLogout}
            onChanged={() =>
              refreshEditingStudent(
                editingStudent.id
              )
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h2>Students</h2>

          <p>
            Register and manage students
            in the EMS database.
          </p>
        </div>

        <button
          type="button"
          className="ap-save-button"
          onClick={
            openAddStudent
          }
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      <section className="panel">
        <div className="student-toolbar">
          <div className="student-search">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by name or matriculation number..."
            />
          </div>

          <div className="student-count">
            {
              filteredStudents.length
            }{" "}
            student
            {filteredStudents.length ===
            1
              ? ""
              : "s"}
          </div>
        </div>

        {filteredStudents.length ===
        0 ? (
          <div className="empty-state">
            <Users size={35} />

            <h3>
              {search
                ? "No matching student"
                : "No students registered"}
            </h3>

            <p>
              {search
                ? "Try another name or matriculation number."
                : "Click Add Student to register the first student."}
            </p>

            {!search && (
              <button
                type="button"
                className="ap-save-button"
                onClick={
                  openAddStudent
                }
              >
                <Plus size={18} />
                Add Student
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>
                    Matriculation
                  </th>
                  <th>
                    Programme
                  </th>
                  <th>Level</th>
                  <th>
                    Academic Session
                  </th>
                  <th>
                    Project Title
                  </th>

                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map(
                  (student) => (
                    <tr
                      key={
                        student.id
                      }
                    >
                      <td>
                        <strong>
                          {getStudentName(
                            student
                          )}
                        </strong>
                      </td>

                      <td>
                        {getStudentMatric(
                          student
                        )}
                      </td>

                      <td>
                        {getStudentProgramme(
                          student
                        )}
                      </td>

                      <td>
                        {getStudentLevel(
                          student
                        )}
                      </td>

                      <td>
                        {getStudentSession(
                          student
                        )}
                      </td>

                      <td>
                        {student.project_title ||
                          "—"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="ap-secondary-button"
                          onClick={() =>
                            openEditStudent(
                              student
                            )
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* =====================================================
   ASSESSMENT PAGE
===================================================== */

function AssessmentPage({
  token,
  students,
  onLogout,
  onSaved,
}) {
  const [search, setSearch] =
    useState("");

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [scores, setScores] =
    useState(EMPTY_SCORES);

  const [remarks, setRemarks] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const scoreInputRefs =
    useRef([]);

  const remarksRef =
    useRef(null);

  const searchInputRef =
    useRef(null);

  const matchingStudents =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) return [];

      return students
        .filter((student) => {
          const name =
            getStudentName(
              student
            ).toLowerCase();

          const matric =
            getStudentMatric(
              student
            ).toLowerCase();

          return (
            name.includes(query) ||
            matric.includes(query)
          );
        })
        .slice(0, 10);
    }, [search, students]);

  function selectStudent(student) {
    setSelectedStudent(student);
    setSearch("");
    setError("");

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

  function handleScoreChange(
    criterion,
    rawValue
  ) {
    if (rawValue === "") {
      setScores((current) => ({
        ...current,
        [criterion.key]: "",
      }));

      return;
    }

    let numericValue =
      Number(rawValue);

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return;
    }

    if (
      numericValue >
      criterion.maximum
    ) {
      numericValue =
        criterion.maximum;
    }

    if (numericValue < 0) {
      numericValue = 0;
    }

    setScores((current) => ({
      ...current,
      [criterion.key]:
        numericValue,
    }));
  }

  function handleScoreKeyDown(
    event,
    index
  ) {
    if (event.key !== "Enter")
      return;

    event.preventDefault();

    const nextInput =
      scoreInputRefs.current[
        index + 1
      ];

    if (nextInput) {
      nextInput.focus();
      nextInput.select?.();
    } else {
      remarksRef.current?.focus();
    }
  }

  const currentTotal =
    RUBRIC_FIELDS.reduce(
      (sum, item) =>
        sum +
        Number(
          scores[item.key] || 0
        ),
      0
    );

  const previewRecommendation =
    currentTotal >= 50
      ? "Pass"
      : "Fail";

  async function submitAssessment(
    event
  ) {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (!selectedStudent) {
      setError(
        "Please select the student being assessed."
      );

      return;
    }

    const missing =
      RUBRIC_FIELDS.filter(
        (item) =>
          scores[item.key] === ""
      );

    if (missing.length > 0) {
      setError(
        `Please enter a score for: ${missing
          .map(
            (item) => item.label
          )
          .join(", ")}.`
      );

      return;
    }

    const invalid =
      RUBRIC_FIELDS.filter(
        (item) => {
          const value = Number(
            scores[item.key]
          );

          return (
            Number.isNaN(value) ||
            value < 0 ||
            value > item.maximum
          );
        }
      );

    if (invalid.length > 0) {
      setError(
        `These scores are out of range: ${invalid
          .map(
            (item) => item.label
          )
          .join(", ")}.`
      );

      return;
    }

    const payload = {
      student_id: selectedStudent.id,

      ...Object.fromEntries(
        RUBRIC_FIELDS.map((item) => [
          item.key,
          Number(scores[item.key]),
        ])
      ),

      remarks:
        remarks.trim() || null,
    };

    const submittedStudentName =
      getStudentName(
        selectedStudent
      );

    const submittedStudentMatric =
      getStudentMatric(
        selectedStudent
      );

    try {
      setSaving(true);

      const response =
        await axios.post(
          `${API_URL}/assessments/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

      const confirmationText =
        `Saved for ${submittedStudentName} (${submittedStudentMatric}) — ${response.data.total_score}/100, ${response.data.recommendation}.`;

      setSelectedStudent(null);
      setSearch("");
      setScores(EMPTY_SCORES);
      setRemarks("");
      setError("");

      await onSaved(
        confirmationText
      );

      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } catch (err) {
      console.error(
        "ASSESSMENT SAVE ERROR:",
        err
      );

      if (
        [401, 403].includes(
          err.response?.status
        )
      ) {
        onLogout();
        return;
      }

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item) => item.msg
            )
            .join(", ")
        );
      } else {
        setError(
          detail ||
            "Unable to save assessment. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="assessment-page-wrap">
      <section className="ap-panel">
        <div className="ap-panel-header">
          <div>
            <h2>
              Find Student
            </h2>

            <p>
              Search by name or any part
              of the matriculation number.
            </p>
          </div>

          <Users size={23} />
        </div>

        {!selectedStudent ? (
          <div className="ap-search-wrap">
            <input
              ref={
                searchInputRef
              }
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Type student name or matric number..."
              autoComplete="off"
              autoFocus
            />

            {search.trim() &&
              matchingStudents.length >
                0 && (
                <div className="ap-results">
                  {matchingStudents.map(
                    (student) => (
                      <button
                        key={
                          student.id
                        }
                        type="button"
                        className="ap-result"
                        onClick={() =>
                          selectStudent(
                            student
                          )
                        }
                      >
                        <div className="ap-result-icon">
                          <Users size={18} />
                        </div>

                        <div className="ap-result-text">
                          <strong>
                            {getStudentName(
                              student
                            )}
                          </strong>

                          <span>
                            {getStudentMatric(
                              student
                            )}

                            {getStudentProgramme(
                              student
                            ) &&
                              ` · ${getStudentProgramme(
                                student
                              )}`}

                            {getStudentLevel(
                              student
                            ) &&
                              ` · ${getStudentLevel(
                                student
                              )}`}
                          </span>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}

            {search.trim() &&
              matchingStudents.length ===
                0 && (
                <div className="ap-empty">
                  No matching student
                  found.
                </div>
              )}
          </div>
        ) : (
          <div className="ap-selected-student">
            <div>
              <span className="ap-selected-label">
                STUDENT TO BE ASSESSED
              </span>

              <h3>
                {getStudentName(
                  selectedStudent
                )}
              </h3>

              <div className="ap-selected-meta">
                <span>
                  Matric No:{" "}
                  <strong>
                    {getStudentMatric(
                      selectedStudent
                    )}
                  </strong>
                </span>

                {getStudentProgramme(
                  selectedStudent
                ) && (
                  <span>
                    Programme:{" "}
                    <strong>
                      {getStudentProgramme(
                        selectedStudent
                      )}
                    </strong>
                  </span>
                )}

                {getStudentLevel(
                  selectedStudent
                ) && (
                  <span>
                    Level:{" "}
                    <strong>
                      {getStudentLevel(
                        selectedStudent
                      )}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="ap-secondary-button"
              onClick={
                changeStudent
              }
            >
              Change Student
            </button>
          </div>
        )}
      </section>

      {selectedStudent && (
        <form
          onSubmit={
            submitAssessment
          }
          className="ap-form"
        >
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <section className="ap-panel">
            <div className="ap-panel-header">
              <div>
                <h2>
                  Assessment Criteria
                </h2>

                <p>
                  Enter scores horizontally.
                  Press Enter to move to the
                  next criterion.
                </p>
              </div>

              <div className="ap-live-total">
                <span>TOTAL</span>

                <strong>
                  {currentTotal}{" "}
                  <small>
                    / {MAXIMUM_TOTAL}
                  </small>
                </strong>
              </div>
            </div>

            <div className="ap-criteria-row">
              {RUBRIC_FIELDS.map(
                (
                  criterion,
                  index
                ) => (
                  <div
                    className="ap-criterion-card"
                    key={
                      criterion.key
                    }
                  >
                    <label
                      htmlFor={
                        criterion.key
                      }
                    >
                      {
                        criterion.label
                      }
                    </label>

                    <small className="criterion-max">
                      Maximum:{" "}
                      {
                        criterion.maximum
                      }
                    </small>

                    <div className="ap-score-input-wrap">
                      <input
                        id={
                          criterion.key
                        }
                        ref={(
                          element
                        ) => {
                          scoreInputRefs.current[
                            index
                          ] =
                            element;
                        }}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max={
                          criterion.maximum
                        }
                        step="0.5"
                        value={
                          scores[
                            criterion.key
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          handleScoreChange(
                            criterion,
                            event
                              .target
                              .value
                          )
                        }
                        onKeyDown={(
                          event
                        ) =>
                          handleScoreKeyDown(
                            event,
                            index
                          )
                        }
                        onFocus={(
                          event
                        ) =>
                          event.target.select()
                        }
                        placeholder="0"
                        required
                      />

                      <span className="ap-max-label">
                        /{" "}
                        {
                          criterion.maximum
                        }
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="ap-panel">
            <div className="ap-panel-header">
              <div>
                <h2>
                  Preliminary Result
                </h2>

                <p>
                  Preview only. The backend
                  calculates the official result
                  when saved.
                </p>
              </div>
            </div>

            <div className="ap-preview-row">
              <div>
                <span>
                  Preview Total
                </span>

                <strong>
                  {currentTotal} /{" "}
                  {MAXIMUM_TOTAL}
                </strong>
              </div>

              <div>
                <span>
                  Preview Recommendation
                </span>

                <RecommendationBadge
                  value={
                    previewRecommendation
                  }
                />
              </div>
            </div>
          </section>

          <section className="ap-panel">
            <div className="ap-panel-header">
              <div>
                <h2>Remarks</h2>

                <p>
                  Optional comments about
                  the presentation.
                </p>
              </div>
            </div>

            <textarea
              ref={remarksRef}
              value={remarks}
              onChange={(event) =>
                setRemarks(
                  event.target.value
                )
              }
              placeholder="Enter assessment remarks..."
              rows={3}
            />
          </section>

          <div className="ap-actions">
            <button
              type="button"
              className="ap-secondary-button"
              onClick={
                changeStudent
              }
              disabled={saving}
            >
              <X size={18} />
              Cancel
            </button>

            <button
              type="submit"
              className="ap-save-button"
              disabled={saving}
            >
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
   EXTERNAL SUPERVISOR ASSESSMENT
===================================================== */

function ExternalAssessmentPage({
  token,
  students,
  onLogout,
  onSaved,
}) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [scores, setScores] = useState(EMPTY_SCORES);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const scoreInputRefs = useRef([]);
  const remarksRef = useRef(null);
  const searchInputRef = useRef(null);

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

  async function selectStudent(student) {
    setSelectedStudent(student);
    setSearch("");
    setError("");
    setReport(null);
    setScores(EMPTY_SCORES);
    setRemarks("");
    setLoadingReport(true);

    try {
      const response = await axios.get(
        `${API_URL}/assessments/student/${student.id}/report`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReport(response.data);

      const existing = response.data.external_assessment;

      if (existing) {
        setScores(
          Object.fromEntries(
            RUBRIC_FIELDS.map((item) => [
              item.key,
              Number(existing[item.key]),
            ])
          )
        );

        setRemarks(existing.remarks || "");
      }

      requestAnimationFrame(() => {
        scoreInputRefs.current[0]?.focus();
      });
    } catch (err) {
      console.error("EXTERNAL REPORT ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to check this student's internal assessment status."
      );
    } finally {
      setLoadingReport(false);
    }
  }

  function changeStudent() {
    setSelectedStudent(null);
    setSearch("");
    setReport(null);
    setScores(EMPTY_SCORES);
    setRemarks("");
    setError("");

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  function handleScoreChange(criterion, rawValue) {
    if (rawValue === "") {
      setScores((current) => ({
        ...current,
        [criterion.key]: "",
      }));

      return;
    }

    let numericValue = Number(rawValue);

    if (Number.isNaN(numericValue)) return;

    if (numericValue > criterion.maximum) {
      numericValue = criterion.maximum;
    }

    if (numericValue < 0) numericValue = 0;

    setScores((current) => ({
      ...current,
      [criterion.key]: numericValue,
    }));
  }

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

  const isEditingExisting = Boolean(report?.external_assessment);
  const canScore = report?.status === "ready";

  async function submitAssessment(event) {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (!selectedStudent) {
      setError("Please select the student being assessed.");
      return;
    }

    const missing = RUBRIC_FIELDS.filter(
      (item) => scores[item.key] === ""
    );

    if (missing.length > 0) {
      setError(
        `Please enter a score for: ${missing
          .map((item) => item.label)
          .join(", ")}.`
      );

      return;
    }

    const invalid = RUBRIC_FIELDS.filter((item) => {
      const value = Number(scores[item.key]);

      return Number.isNaN(value) || value < 0 || value > item.maximum;
    });

    if (invalid.length > 0) {
      setError(
        `These scores are out of range: ${invalid
          .map((item) => item.label)
          .join(", ")}.`
      );

      return;
    }

    const payload = {
      student_id: selectedStudent.id,

      ...Object.fromEntries(
        RUBRIC_FIELDS.map((item) => [
          item.key,
          Number(scores[item.key]),
        ])
      ),

      remarks: remarks.trim() || null,
    };

    const submittedStudentName = getStudentName(selectedStudent);
    const submittedStudentMatric = getStudentMatric(selectedStudent);

    try {
      setSaving(true);

      const response = await axios.post(
        `${API_URL}/assessments/external`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const confirmationText = `External score saved for ${submittedStudentName} (${submittedStudentMatric}) — ${response.data.total_score}/100, ${response.data.recommendation}.`;

      setSelectedStudent(null);
      setSearch("");
      setReport(null);
      setScores(EMPTY_SCORES);
      setRemarks("");
      setError("");

      await onSaved(confirmationText);

      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } catch (err) {
      console.error("EXTERNAL SAVE ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(
          detail || "Unable to save the external score. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="assessment-page-wrap">
      <section className="ap-panel">
        <div className="ap-panel-header">
          <div>
            <h2>Find Student</h2>

            <p>
              Search by name or any part of the matriculation number.
            </p>
          </div>

          <Users size={23} />
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

                        {getStudentProgramme(student) &&
                          ` · ${getStudentProgramme(student)}`}
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
              <span className="ap-selected-label">
                EXTERNAL ASSESSMENT FOR
              </span>

              <h3>{getStudentName(selectedStudent)}</h3>

              <div className="ap-selected-meta">
                <span>
                  Matric No:{" "}
                  <strong>{getStudentMatric(selectedStudent)}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ap-secondary-button"
              onClick={changeStudent}
            >
              Change Student
            </button>
          </div>
        )}
      </section>

      {error && <div className="error">{error}</div>}

      {selectedStudent && loadingReport && (
        <section className="panel">
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>Checking internal assessment status...</p>
          </div>
        </section>
      )}

      {selectedStudent && !loadingReport && report && !canScore && (
        <section className="panel">
          <div className="empty-state">
            <ClipboardCheck size={35} />
            <h3>Internal stage not complete yet</h3>
            <p>
              {report.internal_assessments_submitted}/
              {report.internal_assessments_required} lecturers have
              scored this student so far. All{" "}
              {report.internal_assessments_required} internal scores
              must be in before the external supervisor can score
              them.
            </p>
          </div>
        </section>
      )}

      {selectedStudent && !loadingReport && canScore && (
        <form onSubmit={submitAssessment} className="ap-form">
          {isEditingExisting && (
            <div className="success">
              <CheckCircle size={18} />
              This student already has an external score -- saving
              again will update it.
            </div>
          )}

          <section className="ap-panel">
            <div className="ap-panel-header">
              <div>
                <h2>Assessment Criteria</h2>

                <p>
                  Enter scores horizontally. Press Enter to move to
                  the next criterion.
                </p>
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
                <div
                  className="ap-criterion-card"
                  key={criterion.key}
                >
                  <label htmlFor={`external-${criterion.key}`}>
                    {criterion.label}
                  </label>

                  <small className="criterion-max">
                    Maximum: {criterion.maximum}
                  </small>

                  <div className="ap-score-input-wrap">
                    <input
                      id={`external-${criterion.key}`}
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
                        handleScoreChange(
                          criterion,
                          event.target.value
                        )
                      }
                      onKeyDown={(event) =>
                        handleScoreKeyDown(event, index)
                      }
                      onFocus={(event) => event.target.select()}
                      placeholder="0"
                      required
                    />

                    <span className="ap-max-label">
                      / {criterion.maximum}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ap-panel">
            <div className="ap-panel-header">
              <div>
                <h2>Preliminary Result</h2>

                <p>
                  Preview only. The backend calculates the official
                  result when saved.
                </p>
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

                <p>Optional comments about the final presentation.</p>
              </div>
            </div>

            <textarea
              ref={remarksRef}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Enter external assessment remarks..."
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

            <button
              type="submit"
              className="ap-save-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditingExisting
                    ? "Update External Score"
                    : "Save External Score"}
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
   IMPORT EXCEL
===================================================== */

function ImportExcel({ token, onLogout, onImported, currentUser }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setError("");
    setResult(null);
  }

  function resetForm() {
    setFile(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!file) {
      setError("Please choose an .xlsx file first.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Only .xlsx Excel files are supported.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_URL}/imports/excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(response.data);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setFile(null);

      await onImported(
        `Import complete: ${response.data.imported} score(s) saved, ` +
          `${response.data.skipped} row(s) skipped.`
      );
    } catch (err) {
      console.error("IMPORT ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(detail || "Unable to import the Excel file.");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="assessment-page-wrap">
      <section className="ap-panel">
        <div className="ap-panel-header">
          <div>
            <h2>Upload Grading Sheet</h2>

            <p>
              Upload the .xlsx aggregate score sheet. Each sheet's
              "MATRIC NUMBER" column is matched against existing
              students, and the scores are saved as your own
              assessment for each matched student. Students must
              already be registered in EMS -- this does not create
              new students.
            </p>
          </div>

          <FileSpreadsheet size={23} />
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleUpload} className="import-form">
          <label className="import-dropzone">
            <Upload size={28} />

            <span className="import-dropzone-title">
              {file ? file.name : "Click to choose an .xlsx file"}
            </span>

            <span className="import-dropzone-hint">
              Only .xlsx files are supported
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              hidden
            />
          </label>

          <div className="ap-actions">
            <button
              type="button"
              className="ap-secondary-button"
              onClick={resetForm}
              disabled={uploading || (!file && !result)}
            >
              Clear
            </button>

            <button
              type="submit"
              className="ap-save-button"
              disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <span className="spinner" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload & Import
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {result && (
        <section className="ap-panel">
          <div className="ap-panel-header">
            <div>
              <h2>Import Results</h2>
              <p>
                Summary of the last upload -- every score below has
                been saved to the database.
              </p>
            </div>
          </div>

          {result.imported > 0 && (
            <div className="success">
              <CheckCircle size={18} />
              {result.imported} score
              {result.imported === 1 ? "" : "s"} saved to the database,
              recorded under{" "}
              <strong>
                {result.assessor_name ||
                  currentUser?.full_name ||
                  "your account"}
              </strong>
              .
            </div>
          )}

          <div className="ap-preview-row">
            <div>
              <span>Imported</span>
              <strong>{result.imported}</strong>
            </div>

            <div>
              <span>Skipped</span>
              <strong>{result.skipped}</strong>
            </div>

            <div>
              <span>Errors</span>
              <strong>{result.errors?.length || 0}</strong>
            </div>
          </div>

          {result.imported_students &&
            result.imported_students.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Matric Number</th>
                      <th>Assessor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.imported_students.map((student, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{student.full_name}</strong>
                        </td>
                        <td>{student.matric_number}</td>
                        <td>
                          {result.assessor_name ||
                            currentUser?.full_name ||
                            "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {result.errors && result.errors.length > 0 && (
            <div className="import-errors">
              <h3>Row Errors</h3>

              <ul>
                {result.errors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* =====================================================
   REPORT VIEW
===================================================== */

function ReportView({ token, students, onLogout, currentUser }) {
  const isStudentRole = currentUser?.role === "student";

  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(isStudentRole);
  const [error, setError] = useState("");
  const [notSubmitted, setNotSubmitted] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const searchInputRef = useRef(null);

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

  useEffect(() => {
    if (!isStudentRole) return;

    let isMounted = true;

    async function loadOwnReport() {
      setLoading(true);
      setError("");
      setNotSubmitted(false);

      try {
        const response = await axios.get(
          `${API_URL}/assessments/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (isMounted) setReport(response.data);
      } catch (err) {
        if (!isMounted) return;

        console.error("MY REPORT ERROR:", err);

        if ([401, 403].includes(err.response?.status)) {
          onLogout();
          return;
        }

        if (err.response?.status === 404) {
          setNotSubmitted(true);
        } else {
          setError(
            "Unable to load your assessment report."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOwnReport();

    return () => {
      isMounted = false;
    };
  }, [isStudentRole, token]);

  async function downloadPdf() {
    setError("");

    try {
      setDownloadingPdf(true);

      const response = await axios.get(
        `${API_URL}/assessments/me/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        "assessment-report.pdf"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF DOWNLOAD ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      setError("Unable to download your report as PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function selectStudent(student) {
    setSelectedStudent(student);
    setSearch("");
    setError("");
    setReport(null);
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/assessments/student/${student.id}/report`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReport(response.data);
    } catch (err) {
      console.error("REPORT ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to load the assessment report for this student."
      );
    } finally {
      setLoading(false);
    }
  }

  function changeStudent() {
    setSelectedStudent(null);
    setSearch("");
    setReport(null);
    setError("");

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  if (isStudentRole && loading) {
    return (
      <div className="assessment-page-wrap">
        <section className="panel">
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>Loading your report...</p>
          </div>
        </section>
      </div>
    );
  }

  if (isStudentRole && notSubmitted) {
    return (
      <div className="assessment-page-wrap">
        <section className="panel">
          <div className="empty-state">
            <FileText size={35} />
            <h3>No submission yet</h3>
            <p>
              Go to Students to submit your project details
              before a report can be generated.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="assessment-page-wrap">
      {!isStudentRole && (
      <section className="ap-panel">
        <div className="ap-panel-header">
          <div>
            <h2>Find Student</h2>

            <p>
              Search by name or matriculation number to view the
              aggregate assessment report.
            </p>
          </div>

          <FileText size={23} />
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

                        {getStudentProgramme(student) &&
                          ` · ${getStudentProgramme(student)}`}
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
              <span className="ap-selected-label">
                VIEWING REPORT FOR
              </span>

              <h3>{getStudentName(selectedStudent)}</h3>

              <div className="ap-selected-meta">
                <span>
                  Matric No: <strong>{getStudentMatric(selectedStudent)}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ap-secondary-button"
              onClick={changeStudent}
            >
              Change Student
            </button>
          </div>
        )}
      </section>
      )}

      {error && <div className="error">{error}</div>}

      {isStudentRole && report && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "14px",
          }}
        >
          <button
            type="button"
            className="ap-secondary-button"
            onClick={downloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <span className="spinner" />
            ) : (
              <>
                <FileText size={15} />
                Download PDF
              </>
            )}
          </button>
        </div>
      )}

      {!isStudentRole && selectedStudent && loading && (
        <section className="panel">
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>Loading report...</p>
          </div>
        </section>
      )}

      {(isStudentRole || selectedStudent) && !loading && report && (
        <>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Internal Assessment Summary</h2>
                <p>
                  {report.status === "ready"
                    ? "All required lecturer scores are in."
                    : "Waiting for more lecturers to submit scores."}
                </p>
              </div>

              <span
                className={`badge ${
                  report.status === "ready"
                    ? "badge-success"
                    : ""
                }`}
              >
                {report.status === "ready" ? "Ready" : "Pending"}
              </span>
            </div>

            <div className="summary-row">
              <div className="summary-item">
                <ClipboardCheck size={22} />
                <span>Scores Submitted</span>
                <strong>
                  {report.internal_assessments_submitted}/
                  {report.internal_assessments_required}
                </strong>
              </div>

              <div className="summary-item">
                <BarChart3 size={22} />
                <span>Internal Average</span>
                <strong>
                  {report.internal_average_total != null
                    ? Number(report.internal_average_total).toFixed(2)
                    : "—"}
                </strong>
              </div>

              <div className="summary-item">
                <CheckCircle size={22} />
                <span>Recommendation</span>
                <strong>
                  <RecommendationBadge
                    value={report.internal_recommendation}
                  />
                </strong>
              </div>
            </div>

            {report.areas_to_improve &&
              report.areas_to_improve.length > 0 && (
                <div className="overview-list">
                  <span
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      fontWeight: 650,
                      fontSize: "13px",
                    }}
                  >
                    Areas to Improve
                  </span>

                  {report.areas_to_improve.map((area, index) => (
                    <div key={index}>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              )}
          </section>

          <section className="panel" style={{ marginTop: "22px" }}>
            <div className="panel-header">
              <div>
                <h2>Lecturer Remarks</h2>
                <p>Comments from each lecturer who has scored this student.</p>
              </div>
            </div>

            {report.lecturer_comments &&
            report.lecturer_comments.length > 0 ? (
              <div className="overview-list">
                {report.lecturer_comments.map((comment, index) => (
                  <div key={index}>
                    <span>{comment.lecturer_name}</span>
                    <strong style={{ fontSize: "13px", fontWeight: 500 }}>
                      {comment.remarks}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No remarks left yet.</p>
              </div>
            )}
          </section>

          <section className="panel" style={{ marginTop: "22px" }}>
            <div className="panel-header">
              <div>
                <h2>External Supervisor</h2>
                <p>
                  {report.status === "ready"
                    ? "Final-stage score from the external supervisor."
                    : "Unlocks once all internal scores are submitted."}
                </p>
              </div>
            </div>

            {report.external_assessment ? (
              <div className="summary-row">
                <div className="summary-item">
                  <BarChart3 size={22} />
                  <span>External Score</span>
                  <strong>
                    {Number(
                      report.external_assessment.total_score
                    ).toFixed(2)}
                  </strong>
                </div>

                <div className="summary-item">
                  <CheckCircle size={22} />
                  <span>Recommendation</span>
                  <strong>
                    <RecommendationBadge
                      value={report.external_assessment.recommendation}
                    />
                  </strong>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No external supervisor score yet.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* =====================================================
   ADMIN: USER MANAGEMENT
===================================================== */

const EMPTY_USER_FORM = {
  username: "",
  password: "",
  full_name: "",
  role: "assessor",
};

const USER_ROLES = [
  { value: "assessor", label: "Assessor (Lecturer)" },
  { value: "external_supervisor", label: "External Supervisor" },
  { value: "student", label: "Student" },
  { value: "admin", label: "Administrator" },
];

function AdminUsers({ token, users, onLogout, onSaved }) {
  const [mode, setMode] = useState("list");
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function openAddUser() {
    setForm(EMPTY_USER_FORM);
    setError("");
    setSuccess("");
    setMode("add");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveUser(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    if (!form.username.trim() || !form.password || !form.full_name.trim()) {
      setError("Please complete all fields.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(
        `${API_URL}/users/`,
        {
          username: form.username.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          role: form.role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(`${response.data.full_name} has been added successfully.`);

      await onSaved();

      setForm(EMPTY_USER_FORM);

      setTimeout(() => {
        setMode("list");
        setSuccess("");
      }, 1200);
    } catch (err) {
      console.error("USER SAVE ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(detail || "Unable to create user.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (deletingId) return;

    if (
      !window.confirm(
        `Remove ${user.full_name} (${user.username})? This cannot be undone.`
      )
    ) {
      return;
    }

    setError("");

    try {
      setDeletingId(user.id);

      await axios.delete(`${API_URL}/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await onSaved();
    } catch (err) {
      console.error("USER DELETE ERROR:", err);

      if ([401, 403].includes(err.response?.status)) {
        onLogout();
        return;
      }

      setError(err.response?.data?.detail || "Unable to remove user.");
    } finally {
      setDeletingId(null);
    }
  }

  if (mode === "add") {
    return (
      <div className="student-page">
        <div className="student-page-header">
          <div>
            <button
              type="button"
              className="ap-secondary-button"
              onClick={() => setMode("list")}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>

        <form onSubmit={saveUser}>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>New User</h2>
                <p>
                  Create a lecturer (assessor), external supervisor, or
                  admin account.
                </p>
              </div>

              <UserPlus size={23} />
            </div>

            {error && <div className="error">{error}</div>}
            {success && (
              <div className="success">
                <CheckCircle size={18} />
                {success}
              </div>
            )}

            <div className="student-form-grid">
              <div className="input-group">
                <label>Full Name</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </div>

              <div className="input-group">
                <label>Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  autoComplete="off"
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  autoComplete="new-password"
                />
              </div>

              <div className="input-group">
                <label>Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  {USER_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="student-form-actions">
            <button
              type="button"
              className="ap-secondary-button"
              onClick={() => setMode("list")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ap-save-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  Saving User...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h2>Users</h2>
          <p>Manage assessor, external supervisor, and admin accounts.</p>
        </div>

        <button
          type="button"
          className="ap-save-button"
          onClick={openAddUser}
        >
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <section className="panel">
        {users.length === 0 ? (
          <div className="empty-state">
            <UserCog size={35} />
            <h3>No users yet</h3>
            <p>Click Add User to create the first account.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.full_name}</strong>
                    </td>

                    <td>{user.username}</td>

                    <td>
                      {USER_ROLES.find((role) => role.value === user.role)
                        ?.label || user.role}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          user.is_active ? "badge-success" : "badge-danger"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="ap-secondary-button"
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                      >
                        {deletingId === user.id ? (
                          <span className="spinner" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </td>
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
   ACADEMIC SETUP (departments, programmes, levels, sessions)
===================================================== */

function AcademicSetup({ token, onLogout }) {
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  async function loadAll() {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      axios.get(`${API_URL}/departments/`, authHeader),
      axios.get(`${API_URL}/programmes/`, authHeader),
      axios.get(`${API_URL}/levels/`, authHeader),
      axios.get(`${API_URL}/sessions/`, authHeader),
    ]);

    const [deptRes, progRes, levelRes, sessRes] = results;

    if (deptRes.status === "fulfilled") {
      setDepartments(extractArray(deptRes.value.data, "departments"));
    }
    if (progRes.status === "fulfilled") {
      setProgrammes(extractArray(progRes.value.data, "programmes"));
    }
    if (levelRes.status === "fulfilled") {
      setLevels(extractArray(levelRes.value.data, "levels"));
    }
    if (sessRes.status === "fulfilled") {
      setSessions(extractArray(sessRes.value.data, "sessions"));
    }

    const unauthorized = results.some(
      (r) =>
        r.status === "rejected" &&
        r.reason?.response?.status === 401
    );

    if (unauthorized) {
      onLogout();
      return;
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function flashSuccess(message) {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  }

  function handleApiError(err) {
    console.error("ACADEMIC SETUP ERROR:", err);

    if ([401, 403].includes(err.response?.status)) {
      onLogout();
      return true;
    }

    const detail = err.response?.data?.detail;
    setError(
      Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : detail || "Something went wrong."
    );

    return false;
  }

  if (loading) {
    return (
      <div className="student-page">
        <section className="panel">
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>Loading academic setup...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="student-page">
      {error && <div className="error">{error}</div>}
      {success && (
        <div className="success">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <DepartmentSection
        departments={departments}
        onError={handleApiError}
        onSuccess={flashSuccess}
        onClearError={() => setError("")}
        reload={loadAll}
        token={token}
        authHeader={authHeader}
      />

      <ProgrammeSection
        programmes={programmes}
        departments={departments}
        onError={handleApiError}
        onSuccess={flashSuccess}
        onClearError={() => setError("")}
        reload={loadAll}
        authHeader={authHeader}
      />

      <LevelSection
        levels={levels}
        onError={handleApiError}
        onSuccess={flashSuccess}
        onClearError={() => setError("")}
        reload={loadAll}
        authHeader={authHeader}
      />

      <SessionSection
        sessions={sessions}
        onError={handleApiError}
        onSuccess={flashSuccess}
        onClearError={() => setError("")}
        reload={loadAll}
        authHeader={authHeader}
      />
    </div>
  );
}

function DepartmentSection({
  departments,
  onError,
  onSuccess,
  onClearError,
  reload,
  authHeader,
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleCreate(event) {
    event.preventDefault();
    if (saving || !name.trim() || !code.trim()) return;

    onClearError();

    try {
      setSaving(true);

      await axios.post(
        `${API_URL}/departments/`,
        { name: name.trim(), code: code.trim() },
        authHeader
      );

      onSuccess(`Department "${name.trim()}" created.`);
      setName("");
      setCode("");
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(dept) {
    if (
      !window.confirm(
        `Delete "${dept.name}"? This also removes any programmes under it, and will fail if students are already attached.`
      )
    )
      return;

    onClearError();
    setDeletingId(dept.id);

    try {
      await axios.delete(
        `${API_URL}/departments/${dept.id}`,
        authHeader
      );
      onSuccess(`Department "${dept.name}" deleted.`);
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Departments</h2>
          <p>The top-level unit programmes belong to.</p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="student-form-grid"
        style={{ marginBottom: "16px" }}
      >
        <div className="input-group">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Computing Science"
          />
        </div>

        <div className="input-group">
          <label>Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. CSD"
          />
        </div>

        <button
          type="submit"
          className="ap-save-button"
          disabled={saving || !name.trim() || !code.trim()}
          style={{ alignSelf: "flex-end" }}
        >
          {saving ? <span className="spinner" /> : <Plus size={16} />}
          Add
        </button>
      </form>

      {departments.length === 0 ? (
        <div className="empty-state">
          <p>No departments yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.name}</td>
                  <td>{dept.code}</td>
                  <td>
                    <button
                      type="button"
                      className="ap-secondary-button"
                      onClick={() => handleDelete(dept)}
                      disabled={deletingId === dept.id}
                    >
                      {deletingId === dept.id ? (
                        <span className="spinner" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProgrammeSection({
  programmes,
  departments,
  onError,
  onSuccess,
  onClearError,
  reload,
  authHeader,
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleCreate(event) {
    event.preventDefault();
    if (saving || !name.trim() || !code.trim() || !departmentId)
      return;

    onClearError();

    try {
      setSaving(true);

      await axios.post(
        `${API_URL}/programmes/`,
        {
          name: name.trim(),
          code: code.trim(),
          department_id: Number(departmentId),
        },
        authHeader
      );

      onSuccess(`Programme "${name.trim()}" created.`);
      setName("");
      setCode("");
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(programme) {
    if (!window.confirm(`Delete "${programme.name}"?`)) return;

    onClearError();
    setDeletingId(programme.id);

    try {
      await axios.delete(
        `${API_URL}/programmes/${programme.id}`,
        authHeader
      );
      onSuccess(`Programme "${programme.name}" deleted.`);
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setDeletingId(null);
    }
  }

  function departmentName(id) {
    return (
      departments.find((d) => d.id === id)?.name || `#${id}`
    );
  }

  return (
    <section className="panel" style={{ marginTop: "22px" }}>
      <div className="panel-header">
        <div>
          <h2>Programmes</h2>
          <p>Courses of study within a department.</p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="student-form-grid"
        style={{ marginBottom: "16px" }}
      >
        <div className="input-group">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Computer Science"
          />
        </div>

        <div className="input-group">
          <label>Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. CSC"
          />
        </div>

        <div className="input-group">
          <label>Department</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            disabled={departments.length === 0}
          >
            <option value="">
              {departments.length === 0
                ? "Add a department first"
                : "Select department"}
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="ap-save-button"
          disabled={
            saving ||
            !name.trim() ||
            !code.trim() ||
            !departmentId
          }
          style={{ alignSelf: "flex-end" }}
        >
          {saving ? <span className="spinner" /> : <Plus size={16} />}
          Add
        </button>
      </form>

      {programmes.length === 0 ? (
        <div className="empty-state">
          <p>No programmes yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Department</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {programmes.map((programme) => (
                <tr key={programme.id}>
                  <td>{programme.name}</td>
                  <td>{programme.code}</td>
                  <td>
                    {departmentName(programme.department_id)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ap-secondary-button"
                      onClick={() => handleDelete(programme)}
                      disabled={deletingId === programme.id}
                    >
                      {deletingId === programme.id ? (
                        <span className="spinner" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LevelSection({
  levels,
  onError,
  onSuccess,
  onClearError,
  reload,
  authHeader,
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleCreate(event) {
    event.preventDefault();
    if (saving || !name.trim()) return;

    onClearError();

    try {
      setSaving(true);

      await axios.post(
        `${API_URL}/levels/`,
        { name: name.trim() },
        authHeader
      );

      onSuccess(`Level "${name.trim()}" created.`);
      setName("");
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(level) {
    if (!window.confirm(`Delete "${level.name}"?`)) return;

    onClearError();
    setDeletingId(level.id);

    try {
      await axios.delete(
        `${API_URL}/levels/${level.id}`,
        authHeader
      );
      onSuccess(`Level "${level.name}" deleted.`);
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="panel" style={{ marginTop: "22px" }}>
      <div className="panel-header">
        <div>
          <h2>Levels</h2>
          <p>e.g. 100 Level, 200 Level, 400 Level.</p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="student-form-grid"
        style={{ marginBottom: "16px" }}
      >
        <div className="input-group">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 400 Level"
          />
        </div>

        <button
          type="submit"
          className="ap-save-button"
          disabled={saving || !name.trim()}
          style={{ alignSelf: "flex-end" }}
        >
          {saving ? <span className="spinner" /> : <Plus size={16} />}
          Add
        </button>
      </form>

      {levels.length === 0 ? (
        <div className="empty-state">
          <p>No levels yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => (
                <tr key={level.id}>
                  <td>{level.name}</td>
                  <td>
                    <button
                      type="button"
                      className="ap-secondary-button"
                      onClick={() => handleDelete(level)}
                      disabled={deletingId === level.id}
                    >
                      {deletingId === level.id ? (
                        <span className="spinner" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SessionSection({
  sessions,
  onError,
  onSuccess,
  onClearError,
  reload,
  authHeader,
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingCurrentId, setSettingCurrentId] = useState(null);

  async function handleCreate(event) {
    event.preventDefault();
    if (saving || !name.trim()) return;

    onClearError();

    try {
      setSaving(true);

      await axios.post(
        `${API_URL}/sessions/`,
        { name: name.trim() },
        authHeader
      );

      onSuccess(`Session "${name.trim()}" created.`);
      setName("");
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetCurrent(session) {
    onClearError();
    setSettingCurrentId(session.id);

    try {
      await axios.put(
        `${API_URL}/sessions/${session.id}/set-current`,
        {},
        authHeader
      );
      onSuccess(`"${session.name}" is now the current session.`);
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setSettingCurrentId(null);
    }
  }

  async function handleDelete(session) {
    if (!window.confirm(`Delete "${session.name}"?`)) return;

    onClearError();
    setDeletingId(session.id);

    try {
      await axios.delete(
        `${API_URL}/sessions/${session.id}`,
        authHeader
      );
      onSuccess(`Session "${session.name}" deleted.`);
      await reload();
    } catch (err) {
      onError(err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="panel" style={{ marginTop: "22px" }}>
      <div className="panel-header">
        <div>
          <h2>Academic Sessions</h2>
          <p>e.g. 2025-2026. Mark one as current.</p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="student-form-grid"
        style={{ marginBottom: "16px" }}
      >
        <div className="input-group">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2025-2026"
          />
        </div>

        <button
          type="submit"
          className="ap-save-button"
          disabled={saving || !name.trim()}
          style={{ alignSelf: "flex-end" }}
        >
          {saving ? <span className="spinner" /> : <Plus size={16} />}
          Add
        </button>
      </form>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No academic sessions yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.name}</td>
                  <td>
                    {session.is_current ? (
                      <span className="badge badge-success">
                        Current
                      </span>
                    ) : (
                      <span className="badge">—</span>
                    )}
                  </td>
                  <td
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                    }}
                  >
                    {!session.is_current && (
                      <button
                        type="button"
                        className="ap-secondary-button"
                        onClick={() => handleSetCurrent(session)}
                        disabled={
                          settingCurrentId === session.id
                        }
                      >
                        {settingCurrentId === session.id ? (
                          <span className="spinner" />
                        ) : (
                          "Set Current"
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      className="ap-secondary-button"
                      onClick={() => handleDelete(session)}
                      disabled={deletingId === session.id}
                    >
                      {deletingId === session.id ? (
                        <span className="spinner" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* =====================================================
   SESSIONS VIEW
===================================================== */

function SessionsView({ token, students, assessments, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API_URL}/sessions/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        setSessions(extractArray(response.data, "sessions"));
      } catch (err) {
        console.error("SESSIONS ERROR:", err);

        if (!isMounted) return;

        if ([401, 403].includes(err.response?.status)) {
          onLogout();
          return;
        }

        setError("Unable to load academic sessions.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const assessmentsByStudent = useMemo(() => {
    const map = new Map();

    assessments.forEach((record) => {
      const list = map.get(record.student_id) || [];
      list.push(record);
      map.set(record.student_id, list);
    });

    return map;
  }, [assessments]);

  function getSessionId(student) {
    if (
      typeof student.academic_session === "object" &&
      student.academic_session
    ) {
      return student.academic_session.id;
    }

    return student.academic_session_id;
  }

  const studentsWithResults = useMemo(() => {
    if (!selectedSession) return [];

    return students.filter((student) => {
      if (getSessionId(student) !== selectedSession.id) return false;

      const records = assessmentsByStudent.get(student.id) || [];

      return records.length > 0;
    });
  }, [students, selectedSession, assessmentsByStudent]);

  function summarizeStudent(student) {
    const records = assessmentsByStudent.get(student.id) || [];

    const internal = records.filter(
      (record) => record.assessment_type === "internal"
    );

    const external = records.find(
      (record) => record.assessment_type === "external"
    );

    const average =
      internal.length > 0
        ? internal.reduce(
            (sum, record) => sum + Number(record.total_score || 0),
            0
          ) / internal.length
        : null;

    return {
      internalCount: internal.length,
      average,
      external,
    };
  }

  return (
    <div className="assessment-page-wrap">
      <section className="ap-panel">
        <div className="ap-panel-header">
          <div>
            <h2>Academic Sessions</h2>

            <p>
              Select a session to see which students already have
              assessment results recorded.
            </p>
          </div>

          <BookOpen size={23} />
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>Loading sessions...</p>
          </div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={35} />
            <h3>No academic sessions yet</h3>
            <p>Sessions are created when students are registered.</p>
          </div>
        ) : (
          <div className="session-chip-row">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`session-chip ${
                  selectedSession?.id === session.id ? "active" : ""
                }`}
                onClick={() => setSelectedSession(session)}
              >
                {session.name}

                {session.is_current && (
                  <span className="badge badge-success">Current</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedSession && (
        <section className="panel" style={{ marginTop: "22px" }}>
          <div className="panel-header">
            <div>
              <h2>{selectedSession.name} -- Students With Results</h2>

              <p>
                {studentsWithResults.length} student
                {studentsWithResults.length === 1 ? "" : "s"} have at
                least one score recorded so far.
              </p>
            </div>
          </div>

          {studentsWithResults.length === 0 ? (
            <div className="empty-state">
              <Users size={35} />
              <h3>No results yet</h3>
              <p>
                No student in {selectedSession.name} has been scored
                yet.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Matric Number</th>
                    <th>Programme</th>
                    <th>Internal Scores</th>
                    <th>Avg Score</th>
                    <th>External</th>
                  </tr>
                </thead>

                <tbody>
                  {studentsWithResults.map((student) => {
                    const summary = summarizeStudent(student);

                    return (
                      <tr key={student.id}>
                        <td>
                          <strong>{getStudentName(student)}</strong>
                        </td>

                        <td>{getStudentMatric(student)}</td>

                        <td>{getStudentProgramme(student) || "—"}</td>

                        <td>{summary.internalCount}/4</td>

                        <td>
                          {summary.average != null
                            ? summary.average.toFixed(2)
                            : "—"}
                        </td>

                        <td>
                          {summary.external ? (
                            <RecommendationBadge
                              value={summary.external.recommendation}
                            />
                          ) : (
                            <span className="badge">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function extractArray(
  data,
  preferredKey
) {
  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    Array.isArray(
      data[preferredKey]
    )
  ) {
    return data[preferredKey];
  }

  if (
    data &&
    Array.isArray(data.items)
  ) {
    return data.items;
  }

  if (
    data &&
    Array.isArray(data.data)
  ) {
    return data.data;
  }

  return [];
}

function getSelectPlaceholder(
  label,
  list,
  isLoading,
  hasError
) {
  if (isLoading) {
    return `Loading ${label}...`;
  }

  if (hasError) {
    return `Failed to load ${label}`;
  }

  if (list.length === 0) {
    return `No ${label} available`;
  }

  return `Select ${label}`;
}

function getStudentName(student) {
  return (
    student.full_name ||
    student.name ||
    student.student_name ||
    "Unknown Student"
  );
}

function getStudentMatric(
  student
) {
  return (
    student.matric_number ||
    student.matriculation_number ||
    student.matricNo ||
    student.registration_number ||
    "No matriculation number"
  );
}

function getStudentProgramme(
  student
) {
  if (
    typeof student.programme ===
    "object"
  ) {
    return (
      student.programme.name ||
      student.programme.code ||
      ""
    );
  }

  return (
    student.programme ||
    student.program ||
    student.course ||
    ""
  );
}

function getStudentLevel(student) {
  if (
    typeof student.level ===
    "object"
  ) {
    return (
      student.level.name ||
      student.level.level_name ||
      ""
    );
  }

  return (
    student.level ||
    student.year ||
    student.study_level ||
    ""
  );
}

function getStudentSession(
  student
) {
  if (
    typeof student.academic_session ===
    "object"
  ) {
    return (
      student.academic_session
        .name ||
      student.academic_session
        .session_name ||
      ""
    );
  }

  return (
    student.academic_session ||
    student.session ||
    student.academic_session_name ||
    ""
  );
}

/* =====================================================
   STAT CARD
===================================================== */

/* =====================================================
   STUDENT DASHBOARD OVERVIEW
===================================================== */

function StudentDashboardOverview({ token, onLogout, currentUser }) {
  const [report, setReport] = useState(null);
  const [studentRecord, setStudentRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notSubmitted, setNotSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError("");
      setNotSubmitted(false);

      const authHeader = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/students/me`, authHeader),
        axios.get(`${API_URL}/assessments/me`, authHeader),
      ]);

      if (!isMounted) return;

      const [studentResult, reportResult] = results;

      const unauthorized = results.some(
        (result) =>
          result.status === "rejected" &&
          result.reason?.response?.status === 401
      );

      if (unauthorized) {
        onLogout();
        return;
      }

      if (studentResult.status === "fulfilled") {
        setStudentRecord(studentResult.value.data);
      }

      if (reportResult.status === "fulfilled") {
        setReport(reportResult.value.data);
      } else if (reportResult.reason?.response?.status === 404) {
        setNotSubmitted(true);
      } else if (studentResult.status === "rejected") {
        // Neither call worked -- most likely they genuinely haven't
        // submitted their details yet.
        setNotSubmitted(true);
      } else {
        setError(
          "Unable to load your assessment status."
        );
      }

      setLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <section className="panel">
        <div className="empty-state">
          <div className="loading-spinner" />
          <p>
            Loading your assessment
            status...
          </p>
        </div>
      </section>
    );
  }

  const welcomeName =
    studentRecord?.full_name ||
    currentUser?.full_name ||
    "there";

  if (notSubmitted) {
    return (
      <>
        <section
          className="panel"
          style={{ marginBottom: "22px" }}
        >
          <h2 style={{ margin: 0 }}>
            Welcome, {welcomeName}
          </h2>
          <p style={{ margin: "6px 0 0" }}>
            You haven't submitted your project
            details yet.
          </p>
        </section>

        <section className="panel">
          <div className="empty-state">
            <ClipboardCheck size={35} />
            <h3>No submission yet</h3>
            <p>
              Go to Students to submit your
              project details before
              assessment can begin.
            </p>
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  const statusLabel =
    report.status === "ready"
      ? "Complete"
      : `${report.internal_assessments_submitted}/${report.internal_assessments_required} scored`;

  const scoreLabel =
    report.internal_average_total !=
    null
      ? Number(
          report.internal_average_total
        ).toFixed(2)
      : "Pending";

  const recommendation = String(
    report.internal_recommendation || ""
  ).toLowerCase();

  const isPass =
    recommendation.includes("pass");

  const isFail =
    recommendation.includes("fail");

  return (
    <>
      <section
        className="panel"
        style={{ marginBottom: "22px" }}
      >
        <h2 style={{ margin: 0 }}>
          Welcome, {welcomeName}
        </h2>

        {studentRecord ? (
          <div
            className="summary-row"
            style={{ marginTop: "14px" }}
          >
            <div className="summary-item">
              <Users size={20} />
              <span>Matric Number</span>
              <strong>
                {studentRecord.matric_number}
              </strong>
            </div>

            <div className="summary-item">
              <BookOpen size={20} />
              <span>Programme</span>
              <strong>
                {studentRecord.programme?.name ||
                  "—"}
              </strong>
            </div>

            <div className="summary-item">
              <ClipboardCheck size={20} />
              <span>Academic Session</span>
              <strong>
                {studentRecord.academic_session
                  ?.name || "—"}
              </strong>
            </div>
          </div>
        ) : (
          <p style={{ margin: "6px 0 0" }}>
            Here's your assessment status so far.
          </p>
        )}
      </section>

      <div className="stat-cards">
        <StatCard
          title="Assessment"
          value={statusLabel}
          icon={<ClipboardCheck />}
          color="purple"
        />

        <StatCard
          title="Score"
          value={scoreLabel}
          icon={<BarChart3 />}
          color="orange"
        />

        <StatCard
          title="Passed"
          value={isPass ? "Yes" : "—"}
          icon={<CheckCircle />}
          color="indigo"
        />

        <StatCard
          title="Failed"
          value={isFail ? "Yes" : "—"}
          icon={<XCircle />}
          color="red"
        />
      </div>

      {report.areas_to_improve &&
        report.areas_to_improve.length >
          0 && (
          <section
            className="panel"
            style={{
              marginTop: "22px",
            }}
          >
            <div className="panel-header">
              <div>
                <h2>
                  Areas to Improve
                </h2>
              </div>
            </div>

            <div className="overview-list">
              {report.areas_to_improve.map(
                (area, index) => (
                  <div key={index}>
                    <span>
                      {area}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        )}
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div
      className={`stat-card card-${color}`}
    >
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>

      <div className="card-icon">
        {icon}
      </div>
    </div>
  );
}

/* =====================================================
   RECOMMENDATION BADGE
===================================================== */

function RecommendationBadge({
  value,
}) {
  const recommendation =
    String(
      value || ""
    ).toLowerCase();

  if (
    recommendation.includes(
      "pass"
    )
  ) {
    return (
      <span className="badge badge-success">
        <CheckCircle size={13} />
        Pass
      </span>
    );
  }

  if (
    recommendation.includes(
      "fail"
    )
  ) {
    return (
      <span className="badge badge-danger">
        <XCircle size={13} />
        Fail
      </span>
    );
  }

  return (
    <span className="badge">
      {value || "Pending"}
    </span>
  );
}

/* =====================================================
   STYLES
===================================================== */

const ASSESSMENT_STYLES = `
.import-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: 2.5rem 1rem;
  border: 2px dashed var(--border-color, #d1d5db);
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  color: var(--text-muted, #6b7280);
}

.import-dropzone:hover {
  background: var(--hover-bg, #f5f7fb);
}

.import-dropzone-title {
  font-weight: 600;
  color: inherit;
}

.import-dropzone-hint {
  font-size: .78rem;
}

.import-errors {
  margin-top: 1rem;
}

.import-errors h3 {
  margin: 0 0 .5rem;
  font-size: .9rem;
}

.import-errors ul {
  margin: 0;
  padding-left: 1.1rem;
  max-height: 260px;
  overflow-y: auto;
  font-size: .82rem;
  color: var(--text-muted, #6b7280);
}

.import-errors li {
  margin-bottom: .3rem;
}

.assessment-page-wrap,
.student-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.student-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.student-page-header h2 {
  margin: .8rem 0 .25rem;
}

.student-page-header p {
  margin: 0;
  color: var(--text-muted, #6b7280);
}

.student-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.student-search {
  flex: 1;
  max-width: 650px;
  display: flex;
  align-items: center;
  gap: .6rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 9px;
  padding: .55rem .75rem;
}

.student-search input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
}

.student-count {
  color: var(--text-muted, #6b7280);
  font-size: .85rem;
}

.student-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.student-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.student-full-width {
  grid-column: 1 / -1;
}

.student-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
}

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

.ap-panel-header h2 {
  margin: 0 0 .25rem;
  font-size: 1.05rem;
}

.ap-panel-header p {
  margin: 0;
  font-size: .85rem;
  color: var(--text-muted, #6b7280);
}

.ap-search-wrap {
  position: relative;
}

.ap-search-wrap input,
.ap-form textarea,
.student-form input,
.student-form select {
  width: 100%;
  padding: .7rem .85rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d1d5db);
  font-size: .95rem;
  box-sizing: border-box;
  background: var(--input-bg, transparent);
  color: inherit;
}

.ap-results {
  margin-top: .5rem;
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
  gap: .75rem;
  padding: .6rem .85rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  cursor: pointer;
  text-align: left;
  color: inherit;
}

.ap-result:last-child {
  border-bottom: none;
}

.ap-result:hover {
  background: var(--hover-bg, #f5f7fb);
}

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

.ap-result-text {
  display: flex;
  flex-direction: column;
  gap: .15rem;
  overflow: hidden;
}

.ap-result-text strong {
  font-size: .9rem;
}

.ap-result-text span {
  font-size: .78rem;
  color: var(--text-muted, #6b7280);
}

.ap-empty {
  margin-top: .5rem;
  padding: .75rem;
  text-align: center;
  color: var(--text-muted, #6b7280);
  font-size: .85rem;
}

.ap-selected-student {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.ap-selected-label {
  font-size: .7rem;
  letter-spacing: .04em;
  color: var(--text-muted, #6b7280);
}

.ap-selected-student h3 {
  margin: .25rem 0 .5rem;
}

.ap-selected-meta {
  display: flex;
  flex-wrap: wrap;
  gap: .25rem 1.25rem;
  font-size: .85rem;
}

.ap-selected-meta span {
  color: var(--text-muted, #6b7280);
}

.ap-secondary-button {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .5rem .9rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d1d5db);
  background: var(--card-bg, #fff);
  color: inherit;
  cursor: pointer;
  font-size: .85rem;
}

.ap-secondary-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.ap-live-total {
  text-align: right;
  flex-shrink: 0;
}

.ap-live-total span {
  display: block;
  font-size: .7rem;
  letter-spacing: .05em;
  color: var(--text-muted, #6b7280);
}

.ap-live-total strong {
  font-size: 1.4rem;
}

.ap-live-total strong small {
  font-size: .9rem;
  color: var(--text-muted, #6b7280);
}

.ap-criteria-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: .75rem;
  overflow-x: auto;
  padding-bottom: .35rem;
}

.ap-criterion-card {
  flex: 0 0 150px;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: .4rem;
  padding: .75rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px;
}

.ap-criterion-card label {
  font-size: .78rem;
  font-weight: 600;
  line-height: 1.2;
  min-height: 2.1em;
}

.criterion-max {
  color: var(--text-muted, #6b7280);
  font-size: .7rem;
}

.ap-score-input-wrap {
  display: flex;
  align-items: center;
  gap: .4rem;
}

.ap-score-input-wrap input {
  width: 100%;
  padding: .4rem .5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #d1d5db);
  font-size: 1rem;
  text-align: center;
  color: inherit;
  background: transparent;
}

.ap-max-label {
  font-size: .78rem;
  color: var(--text-muted, #6b7280);
  white-space: nowrap;
}

.ap-preview-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.ap-preview-row > div {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.ap-preview-row span {
  font-size: .75rem;
  color: var(--text-muted, #6b7280);
}

.ap-preview-row strong {
  font-size: 1.1rem;
}

.ap-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
}

.ap-save-button {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .65rem 1.4rem;
  border-radius: 8px;
  border: none;
  background: var(--accent, #4f46e5);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.ap-save-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .3rem .55rem;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
}

.badge-success {
  background: #dcfce7;
  color: #166534;
}

.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}

.student-page .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  min-height: 260px;
  text-align: center;
}

.student-page .empty-state h3,
.student-page .empty-state p {
  margin: 0;
}

.student-page .empty-state p {
  color: var(--text-muted, #6b7280);
}

@media (max-width: 800px) {
  .student-form-grid {
    grid-template-columns: 1fr;
  }

  .student-full-width {
    grid-column: auto;
  }

  .student-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .student-search {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .ap-panel-header {
    flex-direction: column;
  }

  .ap-live-total {
    text-align: left;
  }
}

.session-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.session-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid var(--border-color, #d1d5db);
  background: var(--surface, #fff);
  color: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.session-chip:hover {
  background: var(--hover-bg, #f5f7fb);
}

.session-chip.active {
  background: var(--accent, #6d28d9);
  border-color: var(--accent, #6d28d9);
  color: #fff;
}

.session-chip .badge {
  padding: 2px 8px;
  font-size: 11px;
}

.login-register-link {
  display: block;
  margin-top: 18px;
  font-size: 13px;
  color: #ddd6fe;
  text-decoration: none;
  text-align: center;
}

.login-register-link:hover {
  text-decoration: underline;
}

.login-link-button {
  display: block;
  width: 100%;
  margin-top: 18px;
  padding: 0;
  font-size: 13px;
  font-family: inherit;
  color: #ddd6fe;
  background: transparent;
  border: none;
  text-align: center;
  cursor: pointer;
}

.login-link-button:hover {
  text-decoration: underline;
}
`;

if (typeof document !== "undefined") {
  const styleId =
    "ems-assessment-student-styles";

  if (
    !document.getElementById(styleId)
  ) {
    const style =
      document.createElement(
        "style"
      );

    style.id = styleId;
    style.textContent =
      ASSESSMENT_STYLES;

    document.head.appendChild(
      style
    );
  }
}

export default App;
